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
  
  // Update user profile
  updateUserProfile: async (userId, profileData) => {
    try {
      // Get current auth context to check permissions
      const authContext = await authService.checkViewingAs();
      const currentUserUid = (await authService.getCurrentUser()).uid;
      
      // Only the actual user can update their profile, not someone viewing as them
      if (authContext && authContext.viewingAsUid === userId && authContext.actualUid !== userId) {
        return { 
          success: false, 
          error: "Vous ne pouvez pas modifier le profil d'un autre utilisateur" 
        };
      }
      
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (isOnline) {
        // Update in Firestore
        await updateDoc(doc(db, 'users', userId), {
          ...profileData,
          updatedAt: new Date().toISOString()
        });
        
        // Update in local storage too
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          await AsyncStorage.setItem(`@financial_app:user_${userId}`, JSON.stringify(userDoc.data()));
        }
        
        return { success: true };
      } else {
        // Store update operation for later
        const pendingUpdatesJson = await AsyncStorage.getItem('@financial_app:pendingProfileUpdates');
        const pendingUpdates = pendingUpdatesJson ? JSON.parse(pendingUpdatesJson) : [];
        
        pendingUpdates.push({
          userId,
          data: profileData,
          timestamp: Date.now()
        });
        
        await AsyncStorage.setItem('@financial_app:pendingProfileUpdates', JSON.stringify(pendingUpdates));
        
        // Update the local copy too
        const offlineUserData = await AsyncStorage.getItem(`@financial_app:user_${userId}`);
        if (offlineUserData) {
          const userData = JSON.parse(offlineUserData);
          await AsyncStorage.setItem(`@financial_app:user_${userId}`, JSON.stringify({
            ...userData,
            ...profileData,
            hasOfflineUpdates: true
          }));
        }
        
        return { success: true, isOffline: true };
      }
    } catch (error) {
      console.error('Update user profile error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Upload user profile picture
  uploadProfilePicture: async (userId, uri) => {
    try {
      // Only allow this when online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (!isOnline) {
        return { success: false, error: "L'upload d'image nécessite une connexion internet" };
      }
      
      // Check permissions
      const authContext = await authService.checkViewingAs();
      const currentUserUid = (await authService.getCurrentUser()).uid;
      
      // Only the actual user can update their profile picture
      if (authContext && authContext.viewingAsUid === userId && authContext.actualUid !== userId) {
        return { 
          success: false, 
          error: "Vous ne pouvez pas modifier la photo de profil d'un autre utilisateur" 
        };
      }
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `profile_pictures/${userId}`);
      
      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the user profile with the new photo URL
      await updateDoc(doc(db, 'users', userId), {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      });
      
      // Update local storage
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        await AsyncStorage.setItem(`@financial_app:user_${userId}`, JSON.stringify(userDoc.data()));
      }
      
      return { success: true, photoURL: downloadURL };
    } catch (error) {
      console.error('Upload profile picture error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Save user settings
  saveUserSettings: async (userId, settings) => {
    try {
      // Get current auth context to check permissions
      const authContext = await authService.checkViewingAs();
      const currentUserUid = (await authService.getCurrentUser()).uid;
      
      // Only the actual user can update their settings
      if (authContext && authContext.viewingAsUid === userId && authContext.actualUid !== userId) {
        return { 
          success: false, 
          error: "Vous ne pouvez pas modifier les paramètres d'un autre utilisateur" 
        };
      }
      
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Always save settings locally
      const existingSettingsJson = await AsyncStorage.getItem(`${USER_SETTINGS_KEY}_${userId}`);
      const existingSettings = existingSettingsJson ? JSON.parse(existingSettingsJson) : {};
      
      const updatedSettings = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(`${USER_SETTINGS_KEY}_${userId}`, JSON.stringify(updatedSettings));
      
      // If online, also save to Firestore
      if (isOnline) {
        await setDoc(doc(db, 'userSettings', userId), updatedSettings, { merge: true });
        return { success: true };
      } else {
        return { success: true, isOffline: true };
      }
    } catch (error) {
      console.error('Save user settings error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get user settings
  getUserSettings: async (userId) => {
    try {
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Try to get from local storage first
      const localSettingsJson = await AsyncStorage.getItem(`${USER_SETTINGS_KEY}_${userId}`);
      let settings = localSettingsJson ? JSON.parse(localSettingsJson) : {};
      
      // If online, also try to get from Firestore and merge
      if (isOnline) {
        const settingsDoc = await getDoc(doc(db, 'userSettings', userId));
        
        if (settingsDoc.exists()) {
          const firestoreSettings = settingsDoc.data();
          
          // Check which is newer
          const localUpdatedAt = settings.updatedAt ? new Date(settings.updatedAt) : new Date(0);
          const firestoreUpdatedAt = firestoreSettings.updatedAt ? new Date(firestoreSettings.updatedAt) : new Date(0);
          
          if (firestoreUpdatedAt > localUpdatedAt) {
            // Firestore has newer settings
            settings = firestoreSettings;
            
            // Update local storage
            await AsyncStorage.setItem(`${USER_SETTINGS_KEY}_${userId}`, JSON.stringify(settings));
          } else if (localUpdatedAt > firestoreUpdatedAt) {
            // Local has newer settings, update Firestore
            await setDoc(doc(db, 'userSettings', userId), settings, { merge: true });
          }
        } else {
          // No Firestore settings, save local settings to Firestore
          if (Object.keys(settings).length > 0) {
            await setDoc(doc(db, 'userSettings', userId), settings);
          }
        }
        
        return { success: true, settings };
      } else {
        // Return local settings when offline
        return { success: true, settings, isOffline: true };
      }
    } catch (error) {
      console.error('Get user settings error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Sync all pending profile updates when back online
  syncPendingProfileUpdates: async () => {
    try {
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (!isOnline) {
        return { success: false, error: "Pas de connexion internet" };
      }
      
      const pendingUpdatesJson = await AsyncStorage.getItem('@financial_app:pendingProfileUpdates');
      
      if (!pendingUpdatesJson) {
        return { success: true, message: "Aucune mise à jour de profil en attente" };
      }
      
      const pendingUpdates = JSON.parse(pendingUpdatesJson);
      
      if (pendingUpdates.length === 0) {
        return { success: true, message: "Aucune mise à jour de profil en attente" };
      }
      
      // Process each pending update
      for (const update of pendingUpdates) {
        await updateDoc(doc(db, 'users', update.userId), {
          ...update.data,
          updatedAt: new Date(update.timestamp).toISOString(),
          syncedFromOffline: true
        });
      }
      
      // Clear pending updates
      await AsyncStorage.removeItem('@financial_app:pendingProfileUpdates');
      
      return { success: true, updatedCount: pendingUpdates.length };
    } catch (error) {
      console.error('Sync pending profile updates error:', error);
      return { success: false, error: error.message };
    }
  }
};