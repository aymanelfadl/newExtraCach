import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Dimensions } from 'react-native';
import Home from '../app/screens/Home';
import Expense from '../app/screens/Expense';

const testFunc = () => {
    return (
        <View>
            <Text>Test</Text>
        </View>
    )
}

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window'); 

export const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: 'crimson',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          display: 'flex',
          height: 50,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Accueil') {
            iconName = 'home';
          } else if (route.name === 'Dépenses') {
            iconName = 'credit-card';
          } else if (route.name === 'Revenu') {
            iconName = 'currency-usd';
          } else if (route.name === 'Employé') {
            iconName = 'account';
          } else if (route.name === 'Analyse') {
            iconName = 'chart-line';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: width >= 300 ? route.name : '',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={Home}
      />
      <Tab.Screen
        name="Dépenses"
        component={Expense}
      />
      <Tab.Screen
        name="Revenu"
        component={testFunc}
      />
      <Tab.Screen
        name="Employé"
        component={testFunc}
      />
      <Tab.Screen
        name="Analyse"
        component={testFunc}
      />
    </Tab.Navigator>
);
