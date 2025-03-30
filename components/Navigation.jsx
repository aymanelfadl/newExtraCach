import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Dimensions } from 'react-native';
import { Header }  from './Header'; 

// Test function component
const testFunc = () => {
    return (
        <View>
            <Header />
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

          // Assign icons based on the route name
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
        component={testFunc}
      />
      <Tab.Screen
        name="Dépenses"
        component={testFunc}
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
