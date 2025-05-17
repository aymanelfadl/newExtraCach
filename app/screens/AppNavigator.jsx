import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from '../../components/Navigation';
import EmployeeDetail from '../../components/EmployeeDetail';
import LogIn from './LogIn';
import SplashScreen from './SplashScreen3';
import { useUser } from '../../context/UserContext';
import AddSharedUser from '../../components/AddSharedUser';
import ArchivedTransactions from './ArchivedTransactions';
import React, { useState, useEffect } from 'react';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Show splash screen for 4 seconds
    console.log("AppNavigator: Starting splash screen timer");
    const timer = setTimeout(() => {
      console.log("AppNavigator: Splash screen timer completed");
      setIsInitializing(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  
  console.log("AppNavigator: loading=", loading, "isInitializing=", isInitializing);
  
  if (isInitializing) {
    return <SplashScreen />;
  }
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="LogIn" component={LogIn} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="EmployeeDetail" component={EmployeeDetail} />
          <Stack.Screen name="AddSharedUser" component={AddSharedUser} options={{ headerShown: false }} />
          <Stack.Screen name="ArchivedTransactions" component={ArchivedTransactions} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;