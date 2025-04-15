import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabNavigator } from '../components/Navigation';
import LogIn from './screens/LogIn';
import SplashScreen from './screens/SplashScreen';
import { colors } from '../styles/theme';
import { UserProvider, useUser } from '../context/UserContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading || isInitializing) {
    return <SplashScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="LogIn" component={LogIn} />
      ) : (
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </SafeAreaProvider>
  );
}