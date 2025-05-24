import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
} from '@env';

// Log configuration (without sensitive values) for debugging
console.log('Firebase Config Check: ', {
  hasApiKey: !!EXPO_PUBLIC_FIREBASE_API_KEY,
  hasAuthDomain: !!EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!EXPO_PUBLIC_FIREBASE_PROJECT_ID, 
  hasStorageBucket: !!EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  hasMessagingSenderId: !!EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  hasAppId: !!EXPO_PUBLIC_FIREBASE_APP_ID,
  hasMeasurementId: !!EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
});

const firebaseConfig = {
  apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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
    // Try to use a shallow config if the full config fails
    const minimalConfig = {
      apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
      projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: EXPO_PUBLIC_FIREBASE_APP_ID
    };
    console.log('Attempting with minimal config');
    app = initializeApp(minimalConfig);
  }
  
  // Initialize Auth with multiple fallback options
  console.log('Initializing Firebase Auth...');
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Auth initialized with AsyncStorage persistence');
  } catch (authError) {
    console.error('Auth initialization with persistence error:', authError.message);
    // First fallback - try without custom persistence
    try {
      auth = initializeAuth(app);
      console.log('Auth initialized without custom persistence');
    } catch (e) {
      console.error('Standard auth initialization also failed:', e.message);
      // Second fallback - try getting the existing auth
      try {
        const { getAuth } = require('firebase/auth');
        auth = getAuth(app);
        console.log('Using existing auth instance');
      } catch (finalError) {
        console.error('All auth initialization methods failed:', finalError.message);
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

// Export with fallbacks to prevent app crashes
const authWithFallback = auth || null;
const dbWithFallback = db || null;
const storageWithFallback = storage || null;

// Special debug function that can be used to check Firebase status
const checkFirebaseStatus = () => {
  return {
    authInitialized: !!auth,
    dbInitialized: !!db,
    appInitialized: !!app,
    storageInitialized: !!storage,
    currentUser: auth ? auth.currentUser : null
  };
};

export { 
  app, 
  authWithFallback as auth, 
  dbWithFallback as db, 
  storageWithFallback as storage,
  checkFirebaseStatus
};