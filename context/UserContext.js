import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const UserContext = createContext(null);

// Standardized keys
const USER_DATA_KEY = '@financial_app:currentUser';
const VIEWING_AS_KEY = '@financial_app:viewingAs';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [viewingAs, setViewingAs] = useState(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          // User is signed in
          const userData = {
            uid: authUser.uid,
            email: authUser.email,
            fullName: authUser.displayName || '', // use fullName for consistency
            photoURL: authUser.photoURL,
            emailVerified: authUser.emailVerified,
            lastLoginAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
          const viewingAsData = await AsyncStorage.getItem(VIEWING_AS_KEY);
          if (viewingAsData) setViewingAs(JSON.parse(viewingAsData));
          setUser(userData);
        } else {
          await AsyncStorage.removeItem(USER_DATA_KEY);
          await AsyncStorage.removeItem(VIEWING_AS_KEY);
          setUser(null);
          setViewingAs(null);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    const loadOfflineUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem(USER_DATA_KEY);
        if (userData && !user) {
          setUser(JSON.parse(userData));
          const viewingAsData = await AsyncStorage.getItem(VIEWING_AS_KEY);
          if (viewingAsData) setViewingAs(JSON.parse(viewingAsData));
        }
      } catch (error) {
        console.error("Error loading offline user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOfflineUserData();
    return () => unsubscribe();
  }, []);

  const setViewingAsUser = async (targetUser) => {
    try {
      if (targetUser){
        await AsyncStorage.setItem(VIEWING_AS_KEY, JSON.stringify(targetUser));
        setViewingAs(targetUser);
      } else {
        await AsyncStorage.removeItem(VIEWING_AS_KEY);
        setViewingAs(null);
      }
      return { success: true };
    } catch (error) {
      console.error("Error setting viewing as user:", error);
      return { success: false, error: error.message };
    }
  };

  const canModifyData = () => {
    if (viewingAs) return false;
    if (!isOnline && user) return true;
    return isOnline && user !== null;
  };

  const value = {
    user,
    loading,
    isOnline,
    viewingAs,
    setViewingAsUser,
    canModifyData,
    userId: user?.uid || null,
    networkStatus: isOnline ? "online" : "offline"
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;