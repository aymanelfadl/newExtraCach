import { TabNavigator } from '../components/Navigation';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const App = () => {

  const RootStack = createNativeStackNavigator({
    screens: {
      Home: {
        screen: TabNavigator,
        navigationOptions: {
          headerShown: false,
        },
      },
      Expense: {
        screen: TabNavigator,
        navigationOptions: {
          headerShown: false,
        },
      },
    },
  })

  const Navigation = createStaticNavigation(RootStack);
  
  return <Navigation />
};

export default App;