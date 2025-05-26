/**
 * This module provides recovery functions for Firebase services in production environments
 * where initialization issues may be more common due to environment differences.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Hardcoded Firebase configuration for testing
// This replaces the @env dependencies to eliminate potential issues with env variables
const firebaseConfig = {
  apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
  authDomain: "expense-manager-376bc.firebaseapp.com",
  projectId: "expense-manager-376bc",
  storageBucket: "expense-manager-376bc.appspot.com",
  messagingSenderId: "281673701772",
  appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9",
  measurementId: "G-M7XF1V4BHR",
};

// Minimal config for recovery attempts
const getMinimalConfig = () => {
  // Always return the hardcoded minimal config
  return {
    apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
    projectId: "expense-manager-376bc",
    appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9"
  };
};

/**
 * Attempts to recover Firebase auth in production environments
 */
export const recoverFirebaseAuth = async () => {
  try {
    console.log('Attempting to recover Firebase auth...');
    
    // Get existing app or initialize new one
    let app;
    try {
      app = getApp();
      console.log('Using existing Firebase app for auth recovery');
    } catch (appError) {
      const config = getMinimalConfig();
      if (!config) {
        throw new Error('Cannot recover Firebase auth: missing configuration');
      }
      
      app = initializeApp(config, 'auth-recovery');
      console.log('Created new Firebase app for auth recovery');
    }
    
    // Try to get existing auth instance
    let authInstance;
    try {
      authInstance = getAuth(app);
      console.log('Retrieved existing auth instance');
    } catch (authError) {
      console.log('No existing auth, trying to initialize...');
      
      // For Android, use AsyncStorage persistence
      if (Platform.OS === 'android') {
        try {
          authInstance = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
          console.log('Created auth instance with AsyncStorage persistence');
        } catch (persistenceError) {
          console.error('Failed to initialize auth with persistence:', persistenceError);
          authInstance = initializeAuth(app);
          console.log('Created auth instance without persistence');
        }
      } else {
        authInstance = initializeAuth(app);
        console.log('Created basic auth instance');
      }
    }
    
    if (!authInstance) {
      throw new Error('Failed to recover auth instance');
    }
    
    return {
      success: true,
      auth: authInstance,
      app
    };
  } catch (error) {
    console.error('Firebase auth recovery failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Tests Firebase auth by performing a timed sign-in operation
 */
export const testFirebaseAuth = async (auth, email, password, timeout = 10000) => {
  try {
    console.log('Testing Firebase auth functionality...');
    
    if (!auth) {
      throw new Error('No auth instance provided for testing');
    }
    
    // Only run this test if valid credentials are provided
    if (!email || !password) {
      return { success: false, reason: 'No test credentials provided' };
    }
    
    // Test with timeout
    const loginPromise = signInWithEmailAndPassword(auth, email, password);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth test timed out')), timeout)
    );
    
    await Promise.race([loginPromise, timeoutPromise]);
    return {
      success: true
    };
  } catch (error) {
    // We expect wrong credentials errors, that means auth is working
    if (error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/invalid-credential') {
      return {
        success: true,
        reason: 'Auth is working but invalid credentials'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Get Firebase diagnostics information
 */
export const getFirebaseDiagnostics = () => {
  const info = {
    platform: Platform.OS,
    environment: __DEV__ ? 'development' : 'production',
    appsInitialized: getApps().length,
    configAvailable: Object.keys(firebaseConfig).length > 0,
  };
  
  // Test if we can get auth
  try {
    const app = getApp();
    info.hasApp = true;
    
    try {
      const auth = getAuth(app);
      info.hasAuth = true;
      info.authMethods = Object.keys(auth).filter(key => typeof auth[key] === 'function');
    } catch (authError) {
      info.hasAuth = false;
      info.authError = authError.message;
    }
    
    try {
      const db = getFirestore(app);
      info.hasDb = true;
    } catch (dbError) {
      info.hasDb = false;
      info.dbError = dbError.message;
    }
  } catch (appError) {
    info.hasApp = false;
    info.appError = appError.message;
  }
  
  return info;
};
