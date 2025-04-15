// App.jsx - Main entry point
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './screens/SplashScreen';
import LogIn from './screens/LogIn';
import { TabNavigator } from '../components/Navigation'; 

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
  );
};

export default App;