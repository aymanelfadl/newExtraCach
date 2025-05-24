import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, query, collection, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      // Check if Firebase auth is initialized
      if (!auth) {
        console.error('Firebase auth not initialized');
        return { success: false, error: 'Service d\'authentification non disponible. Veuillez redémarrer l\'application.' };
      }
      
      console.log('Firebase auth available, attempting sign in...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Sign in successful, user ID:', user.uid);
      
      // Check if Firestore is initialized
      if (!db) {
        console.error('Firestore not initialized');
        return { success: false, error: 'Service de base de données non disponible. Veuillez vérifier votre connexion internet.' };
      }
      
      console.log('Fetching user document from Firestore...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
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
      } else {
        console.error('User document not found in Firestore');
        throw new Error('Profile utilisateur non trouvé. Veuillez contacter le support.');
      }
    } catch (error) {
      console.error('Login error details:', error.code, error.message, error.stack);
      
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-login-credentials'
      ) {
        message = 'E-mail ou mot de passe incorrect.';
      } else if (error.code === 'auth/user-not-found') {
        message = "Aucun utilisateur trouvé avec cet e-mail.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Trop de tentatives échouées. Veuillez réessayer plus tard.";
      } else if (error.code === 'auth/invalid-email') {
        message = "L'e-mail est invalide.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "L'e-mail est déjà utilisé.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Problème de connexion réseau. Veuillez vérifier votre connexion internet.";
      } else if (error.code === 'auth/internal-error') {
        message = "Erreur interne. Veuillez réessayer plus tard.";
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