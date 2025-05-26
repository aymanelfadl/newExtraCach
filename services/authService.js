import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, query, collection, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recoverFirebaseAuth } from './firebaseRecovery';

const CURRENT_USER_KEY = '@financial_app:currentUser';
const VIEWING_AS_KEY = '@financial_app:viewingAs';

export const authService = {
  register: async (email, password, fullName) => {
    try {
      // Check if Firebase auth is initialized
      if (!auth) {
        console.error('Firebase auth not initialized');
        return { success: false, error: 'Service d\'authentification non disponible. Veuillez redémarrer l\'application.' };
      }
      
      // Check email validity before attempting registration
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Adresse e-mail invalide.' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if Firestore is initialized
      if (!db) {
        console.error('Firestore not initialized');
        return { success: false, error: 'Compte créé, mais problème de connexion à la base de données. Veuillez vous connecter.' };
      }
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        fullName: fullName,
        createdAt: new Date().toISOString(),
        sharedAccess: [],
        hasAccessTo: [],
      });
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
        uid: user.uid,
        email: user.email,
        fullName: fullName
      }));
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error.code, error.message);
      
      let message = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'L\'adresse e-mail est invalide.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
      } else if (error.code === 'auth/internal-error') {
        message = 'Erreur interne. Veuillez réessayer plus tard.';
      }
      
      return { success: false, error: message };
    }
  },

  login: async (email, password) => {
    try {
      console.log('Login attempt for email:', email);
      let authInstance = auth;
      
      // Check if Firebase auth is initialized
      if (!authInstance) {
        console.error('Firebase auth not initialized, attempting to get auth instance directly');
        try {
          // Last resort attempt to get auth in production environment
          const { getAuth } = require('firebase/auth');
          const { initializeApp } = require('firebase/app');
          
          // Try to get the default app or initialize with minimal config
          // Try to use our recovery module first
          const recoveryResult = await recoverFirebaseAuth();
          if (recoveryResult.success && recoveryResult.auth) {
            authInstance = recoveryResult.auth;
            console.log('Successfully recovered auth via recovery module');
          } else {
            // Fallback to standard recovery
            try {
              const { getApp } = require('firebase/app');
              const defaultApp = getApp();
              authInstance = getAuth(defaultApp);
              console.log('Successfully retrieved auth from default app');
            } catch (appError) {
              console.error('No default app found, creating minimal app');
              // Use hardcoded config values instead of environment variables
              const minConfig = {
                apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
                projectId: "expense-manager-376bc",
                appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9"
              };
              const minimalApp = initializeApp(minConfig, "auth-fallback-app");
              authInstance = getAuth(minimalApp);
            }
          }
        } catch (fallbackError) {
          console.error('Failed to initialize fallback auth:', fallbackError);
          return { 
            success: false, 
            error: 'Service d\'authentification non disponible. Veuillez redémarrer l\'application ou vérifier votre connexion.' 
          };
        }
      }
      
      if (!authInstance) {
        return { 
          success: false, 
          error: 'Impossible d\'accéder au service d\'authentification. Veuillez réessayer plus tard.' 
        };
      }
      
      console.log('Firebase auth available, attempting sign in...');
      // Use a timeout promise to prevent hanging
      const loginPromise = signInWithEmailAndPassword(authInstance, email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La connexion a pris trop de temps. Veuillez vérifier votre connexion internet.')), 15000)
      );
      
      const userCredential = await Promise.race([loginPromise, timeoutPromise]);
      const user = userCredential.user;
      console.log('Sign in successful, user ID:', user.uid);
      
      // Check if Firestore is initialized
      let dbInstance = db;
      if (!dbInstance) {
        console.error('Firestore not initialized, attempting to initialize');
        try {
          const { getFirestore } = require('firebase/firestore');
          dbInstance = getFirestore(authInstance.app);
          console.log('Initialized Firestore from auth app:', !!dbInstance);
        } catch (dbError) {
          console.error('Failed to initialize Firestore:', dbError);
          // We can still proceed with auth success even if db fails
        }
      }
      
      // If we have a database connection, try to fetch user document
      if (dbInstance) {
        console.log('Fetching user document from Firestore...');
        try {
          const userDoc = await getDoc(doc(dbInstance, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User document exists, saving to AsyncStorage...');
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
              uid: user.uid,
              email: user.email,
              fullName: userData.fullName,
              hasAccessTo: userData.hasAccessTo || [],
              sharedAccess: userData.sharedAccess || []
            }));
            return { success: true, user: { ...user, ...userData } };
          }
        } catch (firestoreError) {
          console.error('Error fetching user document:', firestoreError);
          // Continue without Firestore data as a fallback
        }
      }
      
      // If we couldn't get Firestore data but auth succeeded, create minimal user data
      console.log('Creating minimal user data from auth only');
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || email.split('@')[0],
        hasAccessTo: [],
        sharedAccess: []
      }));
      return { success: true, user };
      
    } catch (error) {
      console.error('Login error details:', error.code || 'no-error-code', error.message, error.stack);
      
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      const errorCode = error.code || '';
      const errorMsg = (error.message || '').toLowerCase();
      
      // Improved error handling for both development and production
      if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        console.error('Login timeout detected in production');
        message = 'La connexion a pris trop de temps. Veuillez vérifier votre connexion internet.';
      } else if (
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-login-credentials' ||
        errorMsg.includes('password') && errorMsg.includes('invalid')
      ) {
        message = 'E-mail ou mot de passe incorrect.';
      } else if (errorCode === 'auth/user-not-found' || errorMsg.includes('user') && errorMsg.includes('not found')) {
        message = "Aucun utilisateur trouvé avec cet e-mail.";
      } else if (errorCode === 'auth/too-many-requests' || errorMsg.includes('too many requests')) {
        message = "Trop de tentatives échouées. Veuillez réessayer plus tard.";
      } else if (errorCode === 'auth/invalid-email' || errorMsg.includes('email') && errorMsg.includes('invalid')) {
        message = "L'e-mail est invalide.";
      } else if (errorCode === 'auth/email-already-in-use' || errorMsg.includes('email') && errorMsg.includes('already')) {
        message = "L'e-mail est déjà utilisé.";
      } else if (errorCode === 'auth/network-request-failed' || 
                errorMsg.includes('network') || 
                errorMsg.includes('internet') || 
                errorMsg.includes('connection')) {
        message = "Problème de connexion réseau. Veuillez vérifier votre connexion internet.";
      } else if (errorCode === 'auth/internal-error' || errorMsg.includes('internal')) {
        message = "Erreur interne. Veuillez réessayer plus tard.";
      } else if (errorMsg.includes('not initialized') || errorMsg.includes('no auth')) {
        // Production-specific error - authentication service not initialized
        console.error('Auth not initialized error in production');
        message = "Service d'authentification non disponible. Veuillez redémarrer l'application.";
        
        // Try to recover by reinitializing auth
        try {
          const { getAuth } = require('firebase/auth');
          const { getApp } = require('firebase/app');
          const recoveredAuth = getAuth(getApp());
          console.log('Auth recovery attempt during error handling:', !!recoveredAuth);
        } catch (recoveryError) {
          console.error('Auth recovery attempt failed:', recoveryError);
        }
      }
      
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      await AsyncStorage.removeItem(VIEWING_AS_KEY);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  grantAccess: async (currentUserUid, targetUserEmail) => {
    try {
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', targetUserEmail)));
      console.log("targetUserEmail", targetUserEmail);
      if (usersSnapshot.empty) {
        return { success: false, error: "L'utilisateur n'existe pas" };
      }
      const targetUserDoc = usersSnapshot.docs[0];
      const targetUserId = targetUserDoc.id;
      await updateDoc(doc(db, 'users', currentUserUid), { sharedAccess: arrayUnion(targetUserId) });
      await updateDoc(doc(db, 'users', targetUserId), { hasAccessTo: arrayUnion(currentUserUid) });
      return { success: true };
    } catch (error) {
      console.error('Grant access error:', error);
      return { success: false, error: error.message };
    }
  },

  revokeAccess: async (currentUserUid, targetUserId) => {
    try {
      await updateDoc(doc(db, 'users', currentUserUid), { sharedAccess: arrayRemove(targetUserId) });
      await updateDoc(doc(db, 'users', targetUserId), { hasAccessTo: arrayRemove(currentUserUid) });
      return { success: true };
    } catch (error) {
      console.error('Revoke access error:', error);
      return { success: false, error: error.message };
    }
  },

  getSharedUsers: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return { success: false, users: [] };
      }
      const userData = userDoc.data();
      const sharedAccessIds = userData.sharedAccess || [];
      if (sharedAccessIds.length === 0) {
        return { success: true, users: [] };
      }
      const sharedUsers = [];
      for (const sharedUserId of sharedAccessIds) {
        const sharedUserDoc = await getDoc(doc(db, 'users', sharedUserId));
        if (sharedUserDoc.exists()) {
          const sharedUserData = sharedUserDoc.data();
          sharedUsers.push({
            uid: sharedUserData.uid,
            email: sharedUserData.email,
            fullName: sharedUserData.fullName
          });
        }
      }
      return { success: true, users: sharedUsers };
    } catch (error) {
      return { success: false, users: [] };
    }
  },

  checkViewingAs: async () => {
    try {
      const authData = await AsyncStorage.getItem(USER_AUTH_KEY);
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      return null;
    }
  },

  resetToOriginalUser: async () => {
    try {
      await AsyncStorage.removeItem(USER_AUTH_KEY);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};