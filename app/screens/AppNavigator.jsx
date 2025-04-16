import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from '../../components/Navigation';
import EmployeeDetail from '../../components/EmployeeDetail';
import LogIn from './LogIn';
import SplashScreen from './SplashScreen';
import { useUser } from '../../context/UserContext';
import React, { useState, useEffect } from 'react';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || isInitializing) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="LogIn" component={LogIn} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="EmployeeDetail" component={EmployeeDetail} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;