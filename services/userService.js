import { db, storage } from './firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const USER_SETTINGS_KEY = '@financial_app:userSettings';

export const userService = {
  // Get user profile
  getUserProfile: async (userId) => {
    try {
      // Check if we're online and can fetch from Firestore
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (isOnline) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Save to AsyncStorage for offline access
          await AsyncStorage.setItem(`@financial_app:user_${userId}`, JSON.stringify(userData));
          
          return { success: true, profile: userData };
        } else {
          return { success: false, error: "Utilisateur non trouvé" };
        }
      } else {
        // Try to get from offline storage
        const offlineUserData = await AsyncStorage.getItem(`@financial_app:user_${userId}`);
        
        if (offlineUserData) {
          return { success: true, profile: JSON.parse(offlineUserData), isOffline: true };
        } else {
          return { success: false, error: "Utilisateur non disponible hors ligne" };
        }
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get list of users who how i can see there data without changing their data

}