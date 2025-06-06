import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = '@financial_app:currentUser';

export const userService = {
  getUsersWithSharedAccess: async () => {
    try {
      // Get current user from AsyncStorage (just for UID)
      
      const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (!userData) return { success: true, users: [] };
      const user = JSON.parse(userData);

      // Always fetch the latest user doc from Firestore!
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      if (!userDocSnap.exists()) return { success: true, users: [] };
      const userDoc = userDocSnap.data();
      const ids = userDoc.hasAccessTo || [];

      if (ids.length === 0) {
        return { success: true, users: [] };
      }
      const users = [];
      for (const id of ids) {
        const sharedUserDoc = await getDoc(doc(db, 'users', id));
        if (sharedUserDoc.exists()) {
          const d = sharedUserDoc.data();
          users.push({ uid: d.uid, email: d.email, fullName: d.fullName });
        }
      }
      return { success: true, users };
    } catch (err) {
      return { success: false, error: err.message, users: [] };
    }
  },
  getEmployees: async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'employee'));
      const snap = await getDocs(q);
      const employees = [];
      snap.forEach(doc => {
        employees.push(doc.data());
      });
      return { success: true, employees };
    } catch (err) {
      return { success: false, error: err.message, employees: [] };
    }
  },

  getUserById: async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, user: docSnap.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
};