import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from '../../components/Navigation';
import EmployeeDetail from '../../components/EmployeeDetail';
import LogIn from './LogIn';
import { useUser } from '../../context/UserContext';
import AddSharedUser from '../../components/AddSharedUser';
import ArchivedTransactions from './ArchivedTransactions';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useUser();
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
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