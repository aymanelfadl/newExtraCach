import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './screens/AppNavigator';
import { colors } from '../styles/theme';
import { UserProvider } from '../context/UserContext';

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