import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded Firebase configuration for testing
// This replaces the @env import to test if environment variable loading is the issue
const firebaseConfig = {
  apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
  authDomain: "expense-manager-376bc.firebaseapp.com",
  projectId: "expense-manager-376bc",
  storageBucket: "expense-manager-376bc.appspot.com",
  messagingSenderId: "281673701772",
  appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9",
  measurementId: "G-M7XF1V4BHR",
};

// Log configuration (without sensitive values) for debugging
console.log('Firebase Config Check: ', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId, 
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  hasMeasurementId: !!firebaseConfig.measurementId
});

// Initialize Firebase app
let app, auth, db, storage;

// Check if all required config values are present
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

try {
  console.log('Starting Firebase initialization...');
  
  if (!isConfigValid) {
    console.error('Firebase configuration values check:', Object.keys(firebaseConfig).map(key => `${key}: ${!!firebaseConfig[key]}`));
    console.warn('Firebase configuration is incomplete but will attempt to initialize anyway');
    // Continue with initialization even with incomplete config for better error handling
  }
  
  // Initialize with a timeout to avoid hanging
  const initTimeout = setTimeout(() => {
    console.error('Firebase initialization timed out');
    // We don't throw here as that would prevent any fallback initialization
  }, 15000); // 15 second timeout for slow connections
  
  // Attempt to initialize Firebase app first
  console.log('Initializing Firebase app...');
  try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
  } catch (appError) {
    console.error('Firebase app initialization error:', appError.message);
    // Try to use a shallow hardcoded config if the full config fails
    const minimalConfig = {
      apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
      projectId: "expense-manager-376bc",
      appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9"
    };
    console.log('Attempting with minimal config');
    app = initializeApp(minimalConfig);
  }
  
  // Initialize Auth with multiple fallback options
  console.log('Initializing Firebase Auth...');
  try {
    if (!app) {
      throw new Error('Firebase app not initialized before auth initialization');
    }

    console.log('Attempting to initialize auth with AsyncStorage persistence...');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Auth initialized with AsyncStorage persistence');
  } catch (authError) {
    console.error('Auth initialization with persistence error:', authError.message);
    
    // First fallback - try without custom persistence
    try {
      console.log('Attempting to initialize auth without persistence...');
      auth = initializeAuth(app);
      console.log('Auth initialized without custom persistence');
    } catch (e) {
      console.error('Standard auth initialization also failed:', e.message, e.stack);
      
      // Second fallback - try getting the existing auth
      try {
        console.log('Attempting to get existing auth instance...');
        const { getAuth } = require('firebase/auth');
        auth = getAuth(app);
        console.log('Using existing auth instance:', !!auth);
      } catch (finalError) {
        console.error('All auth initialization methods failed:', finalError.message, finalError.stack);
        
        // One last try with direct import
        try {
          const firebase = require('firebase/app');
          const { getAuth: getAuthDirect } = require('firebase/auth');
          auth = getAuthDirect(firebase.getApp());
          console.log('Last resort auth initialization succeeded:', !!auth);
        } catch (lastError) {
          console.error('Final auth initialization attempt failed:', lastError.message, lastError.stack);
        }
      }
    }
  }
  
  // Initialize other Firebase services
  db = getFirestore(app);
  storage = getStorage(app);
  
  clearTimeout(initTimeout);
  
  // Test Firebase connection to ensure it's working
  if (!auth || !db) {
    throw new Error('Firebase services could not be properly initialized');
  }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  
  // Try to initialize with minimal functionality if possible
  if (app && !auth) {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (e) {
      console.error('Failed to initialize auth as fallback:', e.message);
    }
  }
  
  if (app && !db) {
    try {
      db = getFirestore(app);
    } catch (e) {
      console.error('Failed to initialize Firestore as fallback:', e.message);
    }
  }
  
  // If we have app but no services, log this critical error
  if (app && (!auth || !db)) {
    console.error('CRITICAL: Firebase partially initialized. Some features may not work.');
  }
}

// Check Firebase settings at startup
try {
  // Log Firebase status for debugging
  const checkFirebaseStatus = async () => {
    try {
      console.log('Checking Firebase connection status...');
      
      if (!auth) {
        console.error('CRITICAL: Firebase auth not initialized. Login will fail!');
        
        // Try one more initialization attempt for auth
        try {
          const { getAuth } = require('firebase/auth');
          auth = getAuth();
          console.log('Auth recovery attempt result:', !!auth);
        } catch (lastAttemptError) {
          console.error('Final auth recovery attempt failed:', lastAttemptError.message);
        }
        return;
      }
      
      // Check if Firebase auth is working
      const currentUser = auth.currentUser;
      console.log('Firebase auth initialized, current user:', currentUser ? 'exists' : 'none');
      
      // Test basic auth functionality
      try {
        const { onAuthStateChanged } = require('firebase/auth');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state listener works, user:', user ? 'logged in' : 'not logged in');
          unsubscribe(); // Clean up listener after first call
        }, (error) => {
          console.error('Auth listener error:', error.code, error.message);
        });
      } catch (authTestError) {
        console.error('Auth functionality test failed:', authTestError.message);
      }
      
      if (!db) {
        console.warn('Firebase Firestore not initialized');
        return;
      }
      
      console.log('Firebase connection check complete');
    } catch (error) {
      console.error('Error checking Firebase status:', error);
    }
  };
  
  // Run the check asynchronously but don't wait for it
  setTimeout(() => {
    checkFirebaseStatus().catch(e => console.error('Firebase status check failed:', e));
  }, 2000);
} catch (error) {
  console.error('Error in Firebase diagnostic check:', error);
}

// Enhanced fallbacks to prevent app crashes and ensure auth always exists
let authWithFallback = auth || null;
const dbWithFallback = db || null;
const storageWithFallback = storage || null;

// If authWithFallback is still null, create a dummy implementation to prevent crashes
if (!authWithFallback) {
  console.warn('Creating dummy auth implementation to prevent crashes');
  authWithFallback = {
    currentUser: null,
    onAuthStateChanged: (callback, onError) => {
      console.warn('Using dummy onAuthStateChanged implementation');
      // Call with null user after a short delay to simulate auth flow
      setTimeout(() => {
        try {
          callback(null);
        } catch (err) {
          console.error('Error in dummy onAuthStateChanged callback:', err);
          if (onError) onError(err);
        }
      }, 500);
      // Return dummy unsubscribe function
      return () => {};
    },
    signOut: () => Promise.resolve(),
    signInWithEmailAndPassword: (email, password) => {
      console.error('Attempted to sign in with email/password but auth is not available');
      return Promise.reject(new Error('Service d\'authentification non disponible'));
    }
  };
}

// Special debug function that can be used to check Firebase status
const checkFirebaseStatus = () => {
  return {
    authInitialized: !!auth,
    dbInitialized: !!db,
    appInitialized: !!app,
    storageInitialized: !!storage,
    currentUser: auth ? auth.currentUser : null,
    usingFallbackAuth: auth !== authWithFallback
  };
};

export { 
  app, 
  authWithFallback as auth, 
  dbWithFallback as db, 
  storageWithFallback as storage,
  checkFirebaseStatus
};