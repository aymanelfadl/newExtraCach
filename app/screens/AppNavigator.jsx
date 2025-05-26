import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from '../../components/Navigation';
import EmployeeDetail from '../../components/EmployeeDetail';
import LogIn from './LogIn';
import { useUser } from '../../context/UserContext';
import AddSharedUser from '../../components/AddSharedUser';
import ArchivedTransactions from './ArchivedTransactions';
import { View, ActivityIndicator, Text, Image } from 'react-native';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useUser();
  
  useEffect(() => {
    // Log navigation state for debugging
    console.log('AppNavigator state:', { isLoading: loading, hasUser: !!user });
  }, [loading, user]);
  
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF' 
      }}>
        <Image 
          source={require('../../assets/images/final_logo.png')} 
          style={{ width: 100, height: 100, marginBottom: 20 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginBottom: 10 }} />
        <Text style={{ fontSize: 16, marginTop: 10, color: '#555' }}>
          Chargement de l'application...
        </Text>
      </View>
    );
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