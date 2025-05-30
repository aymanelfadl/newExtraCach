import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';

import AppNavigator from './app/screens/AppNavigator';
import { UserProvider } from './context/UserContext';

try {
  ExpoSplashScreen.preventAutoHideAsync().catch(e => {
    console.warn('Failed to keep splash screen visible:', e);
  });
} catch (splashError) {
  console.error('Error initializing splash screen:', splashError);
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Preparing app initialization...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialisation trop longue. Vérifiez votre connexion.')), 15000)
        );
        
        await Promise.race([
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
              const { auth, db, checkFirebaseStatus } = require('./services/firebase');
              console.log('Firebase check - auth:', !!auth, 'db:', !!db);
              
              const firebaseStatus = checkFirebaseStatus();
              console.log('Firebase status:', JSON.stringify(firebaseStatus));
              if (!auth || typeof auth.onAuthStateChanged !== 'function') {
                console.error('Firebase auth is missing or incomplete during app preparation');
                try {
                  console.log('Attempting direct Firebase initialization in App.jsx');
                  const { getApp, initializeApp } = require('firebase/app');
                  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                  const { getReactNativePersistence, initializeAuth } = require('firebase/auth');
                  let firebaseApp;
                  try {
                    firebaseApp = getApp();
                    console.log('Retrieved existing Firebase app');
                  } catch (appError) {
                    const minConfig = {
                      apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
                      projectId: "expense-manager-376bc",
                      appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9"
                    };
                    firebaseApp = initializeApp(minConfig, 'app-recovery');
                    console.log('Created new Firebase app with minimal config');
                  }
                  try {
                    const recoveredAuth = initializeAuth(firebaseApp, {
                      persistence: getReactNativePersistence(AsyncStorage)
                    });
                    console.log('Successfully initialized auth in App.jsx recovery');
                  } catch (authRecoveryError) {
                    console.error('Auth recovery in App.jsx failed:', authRecoveryError);
                  }
                } catch (directInitError) {
                  console.error('Direct Firebase initialization failed:', directInitError);
                }
                if (process.env.NODE_ENV === 'production') {
                  console.warn('Continuing despite Firebase auth issues in production');
                } else {
                  throw new Error('Service d\'authentification non disponible');
                }
              }
              if (!db) {
                console.warn('Firebase database is missing during app preparation');
              }
            } catch (firebaseError) {
              console.error('Firebase check failed:', firebaseError.message);
              if (process.env.NODE_ENV === 'production') {
                console.warn('Continuing despite Firebase initialization issues in production');
              } else {
                throw new Error(`Problème d'initialisation: ${firebaseError.message}`);
              }
            }
            console.log('App initialization complete');
          })(),
          timeoutPromise
        ]);
        setAppIsReady(true);
        await ExpoSplashScreen.hideAsync().catch(e => {
          console.warn('Error hiding splash screen:', e);
        });
      } catch (e) {
        console.warn('Error in initialization:', e);
        setInitError(e.message || 'Une erreur inconnue est survenue');
        await ExpoSplashScreen.hideAsync().catch(console.warn);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.container}>
        <StatusBar 
          backgroundColor="#FFFFFF" 
          barStyle="dark-content" 
          translucent={false}
        />
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar 
          backgroundColor="#FFFFFF" 
          barStyle="dark-content" 
          translucent={false}
        />
        <Text style={styles.errorText}>Un problème est survenu</Text>
        <Text style={styles.errorDetail}>{initError}</Text>
        <Text style={styles.errorHelp}>Veuillez redémarrer l'application</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setInitError(null);
            setAppIsReady(false);
            setTimeout(async () => {
              try {
                await ExpoSplashScreen.preventAutoHideAsync().catch(console.warn);
                await new Promise(resolve => setTimeout(resolve, 500));
                setAppIsReady(true);
                await ExpoSplashScreen.hideAsync();
              } catch (e) {
                console.warn('Error during retry:', e);
                setInitError(e.message || 'Échec de la tentative. Veuillez redémarrer l\'application.');
                await ExpoSplashScreen.hideAsync().catch(console.warn);
                setAppIsReady(true);
              }
            }, 500);
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        backgroundColor="#FFFFFF" 
        barStyle="dark-content"
        translucent={false}
      />
      <UserProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF'
  },
  errorText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#E74C3C',
    textAlign: 'center'
  },
  errorDetail: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
    paddingHorizontal: 20
  },
  errorHelp: {
    fontSize: 16,
    color: '#777',
    marginBottom: 30,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});