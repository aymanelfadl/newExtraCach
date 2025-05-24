import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './app/screens/AppNavigator';
import { UserProvider } from './context/UserContext';

// Keep the splash screen visible until explicitly hidden
SplashScreen.preventAutoHideAsync().catch(console.warn);

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  // Initialize app
  useEffect(() => {
    async function prepare() {
      try {
        // Artificial delay to ensure all modules are loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Any additional initialization can go here
        
        // App is ready
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error in initialization:', e);
        setInitError(e.message);
        await SplashScreen.hideAsync();
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{initError}</Text>
        <Text style={styles.errorHelp}>Try restarting the app</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',
  },
  errorDetail: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorHelp: {
    fontSize: 16,
    color: '#777',
  },
});