import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = '@financial_app:currentUser';
const USER_AUTH_KEY = '@financial_app:userAuth';

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
  
  // Log in existing user
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
          hasAccessTo: userData.hasAccessTo || []
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
      await AsyncStorage.removeItem(USER_AUTH_KEY);
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
      
      await updateDoc(doc(db, 'users', currentUserUid), {
        sharedAccess: arrayUnion(targetUserId)
      });
      
      // Update target user's access list
      await updateDoc(doc(db, 'users', targetUserId), {
        hasAccessTo: arrayUnion(currentUserUid)
      });
      
      return { success: true };
    } catch (error) {
      console.error('Grant access error:', error);
      return { success: false, error: error.message };
    }
  },
  
  revokeAccess: async (currentUserUid, targetUserId) => {
    try {
      // Update current user's shared access list
      await updateDoc(doc(db, 'users', currentUserUid), {
        sharedAccess: arrayRemove(targetUserId)
      });
      
      // Update target user's access list
      await updateDoc(doc(db, 'users', targetUserId), {
        hasAccessTo: arrayRemove(currentUserUid)
      });
      
      return { success: true };
    } catch (error) {
      console.error('Revoke access error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get list of users who have access to current user's account
  getSharedUsers: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: "Utilisateur non trouvé" };
      }
      
      const userData = userDoc.data();
      const sharedAccessIds = userData.sharedAccess || [];
      
      // Return empty array if no shared users
      if (sharedAccessIds.length === 0) {
        return { success: true, users: [] };
      }
      
      // Get user details for each shared user
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
      console.error('Get shared users error:', error);
      return { success: false, error: error.message };
    }
  },
  
  getAccessibleAccounts: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: "Utilisateur non trouvé" };
      }
      
      const userData = userDoc.data();
      const accessibleAccountIds = userData.hasAccessTo || [];
      
      // Return empty array if no accessible accounts
      if (accessibleAccountIds.length === 0) {
        return { success: true, accounts: [] };
      }
      
      // Get user details for each accessible account
      const accessibleAccounts = [];
      for (const accountId of accessibleAccountIds) {
        const accountDoc = await getDoc(doc(db, 'users', accountId));
        if (accountDoc.exists()) {
          const accountData = accountDoc.data();
          accessibleAccounts.push({
            uid: accountData.uid,
            email: accountData.email,
            fullName: accountData.fullName
          });
        }
      }
      
      return { success: true, accounts: accessibleAccounts };
    } catch (error) {
      console.error('Get accessible accounts error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Switch to another user's account (if current user has access)
  switchToAccount: async (targetUserId) => {
    try {
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      // Check if current user has access to target account
      if (!currentUser.hasAccessTo || !currentUser.hasAccessTo.includes(targetUserId)) {
        return { success: false, error: "Vous n'avez pas accès à ce compte" };
      }
      
      // Get target user data
      const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
      
      if (!targetUserDoc.exists()) {
        return { success: false, error: "Compte utilisateur non trouvé" };
      }
      
      const targetUserData = targetUserDoc.data();
      
      // Store viewing as information in AsyncStorage
      await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify({
        actualUid: currentUser.uid,
        viewingAsUid: targetUserId,
        viewingAs: {
          email: targetUserData.email,
          fullName: targetUserData.fullName
        }
      }));
      
      return { 
        success: true, 
        viewingAs: {
          uid: targetUserId,
          email: targetUserData.email,
          fullName: targetUserData.fullName
        } 
      };
    } catch (error) {
      console.error('Switch account error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Check if user is viewing as someone else
  checkViewingAs: async () => {
    try {
      const authData = await AsyncStorage.getItem(USER_AUTH_KEY);
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      console.error('Check viewing as error:', error);
      return null;
    }
  },
  
  // Reset back to original user
  resetToOriginalUser: async () => {
    try {
      await AsyncStorage.removeItem(USER_AUTH_KEY);
      return { success: true };
    } catch (error) {
      console.error('Reset to original user error:', error);
      return { success: false, error: error.message };
    }
  }
};