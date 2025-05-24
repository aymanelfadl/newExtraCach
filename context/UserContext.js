import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ActivityIndicator, View, Text, Alert, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserContext = createContext(null);

const USER_DATA_KEY = '@financial_app:currentUser';
const VIEWING_AS_KEY = '@financial_app:viewingAs';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [viewingAs, setViewingAs] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Monitor network status
  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribeNet();
  }, []);

  // Authentication listener with improved error handling
  useEffect(() => {
    let isMounted = true;
    let authTimeout;

    try {
      // Set a timeout for authentication to prevent hanging indefinitely
      authTimeout = setTimeout(() => {
        if (loading && isMounted) {
          console.log('Auth timeout reached, proceeding with null user');
          setLoading(false);
          setAuthError('Authentication timed out. Please check your connection.');
        }
      }, 15000); // 15 seconds timeout

      const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
        try {
          if (!isMounted) return;
          
          clearTimeout(authTimeout);
          
          if (authUser) {
            const userData = {
              uid: authUser.uid,
              email: authUser.email,
              fullName: authUser.displayName || '',
              photoURL: authUser.photoURL,
              emailVerified: authUser.emailVerified,
              lastLoginAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            const viewingAsData = await AsyncStorage.getItem(VIEWING_AS_KEY);
            setUser(userData);
            setViewingAs(viewingAsData ? JSON.parse(viewingAsData) : null);
          } else if (!authUser && !isOnline) {
            const savedUser = await AsyncStorage.getItem(USER_DATA_KEY);
            if (savedUser) {
              setUser(JSON.parse(savedUser));
              const viewingAsData = await AsyncStorage.getItem(VIEWING_AS_KEY);
              setViewingAs(viewingAsData ? JSON.parse(viewingAsData) : null);
            } else {
              setUser(null);
              setViewingAs(null);
            }
          } else {
            await AsyncStorage.multiRemove([USER_DATA_KEY, VIEWING_AS_KEY]);
            setUser(null);
            setViewingAs(null);
          }
        } catch (error) {
          console.error('🔥 Auth handler error:', error);
          setAuthError(error.message);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }, (error) => {
        // This is the error callback for onAuthStateChanged
        console.error('Auth state change error:', error);
        if (isMounted) {
          setAuthError(error.message);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
        clearTimeout(authTimeout);
        unsubscribeAuth();
      };
    } catch (error) {
      console.error('Failed to setup auth listener:', error);
      if (isMounted) {
        setAuthError(error.message);
        setLoading(false);
      }
      return () => {
        isMounted = false;
        clearTimeout(authTimeout);
      };
    }
  }, []);

  const setViewingAsUser = async (targetUser) => {
    try {
      if (targetUser) {
        await AsyncStorage.setItem(VIEWING_AS_KEY, JSON.stringify(targetUser));
        setViewingAs(targetUser);
      } else {
        await AsyncStorage.removeItem(VIEWING_AS_KEY);
        setViewingAs(null);
      }
    } catch (error) {
      console.error("setViewingAsUser error:", error);
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

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
      }}>
        <Image 
          source={require('../assets/images/exchanging.png')} 
          style={{ width: 100, height: 100, marginBottom: 20 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginBottom: 10 }} />
        <Text style={{ fontSize: 16, marginTop: 10, color: '#555' }}>
          Chargement en cours...
        </Text>
      </View>
    );
  }
  
  if (authError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20
      }}>
        <Icon name="alert-circle-outline" size={50} color="#E74C3C" />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginTop: 20, 
          marginBottom: 10,
          color: '#E74C3C',
          textAlign: 'center'
        }}>
          Problème d'authentification
        </Text>
        <Text style={{ 
          fontSize: 16, 
          textAlign: 'center',
          color: '#555',
          marginBottom: 20
        }}>
          {authError}
        </Text>
        <TouchableOpacity 
          style={{
            backgroundColor: '#4A90E2',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 6
          }}
          onPress={() => auth.signOut().catch(console.error)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
