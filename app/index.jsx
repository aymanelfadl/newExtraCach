// App.jsx - Main entry point
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './screens/SplashScreen';
import LogIn from './screens/LogIn';
import { TabNavigator } from '../components/Navigation'; 
import { colors } from '../styles/theme';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* {isLoading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !userId ? (
          <Stack.Screen name="LogIn">
            {() => <LogIn onLogin={(uid) => setUserId(uid)} />}
          </Stack.Screen>
        ) : ( */}
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        {/* // )}  */}
      </Stack.Navigator>
    </SafeAreaProvider>
  );
};

export default App;