import { authService } from './authService';
import { transactionService } from './transactionService';
import { userService } from './userService';
import { app, auth, db, storage } from './firebase';

// Network monitoring
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Custom hook to monitor network status
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });
    
    // Clean up
    return () => unsubscribe();
  }, []);
  
  return isConnected;
};

// Sync function to call all sync methods
export const syncAllOfflineData = async () => {
  try {
    // Check if online
    const networkState = await NetInfo.fetch();
    const isOnline = networkState.isConnected && networkState.isInternetReachable;
    
    if (!isOnline) {
      return { success: false, error: "Pas de connexion internet" };
    }
    
    // Sync transactions
    const transactionSyncResult = await transactionService.syncOfflineTransactions();
    
    // Sync profile updates
    const profileSyncResult = await userService.syncPendingProfileUpdates();
    
    return { 
      success: true, 
      transactionSync: transactionSyncResult,
      profileSync: profileSyncResult
    };
  } catch (error) {
    console.error('Sync all offline data error:', error);
    return { success: false, error: error.message };
  }
};

export {
  authService,
  transactionService,
  userService,
  app,
  auth,
  db,
  storage
};