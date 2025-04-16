import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, query, collection, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = '@financial_app:currentUser';
const VIEWING_AS_KEY = '@financial_app:viewingAs';

export const authService = {
  register: async (email, password, fullName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
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
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
          uid: user.uid,
          email: user.email,
          fullName: userData.fullName,
          hasAccessTo: userData.hasAccessTo || [],
          sharedAccess: userData.sharedAccess || []
        }));
        return { success: true, user: { ...user, ...userData } };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
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