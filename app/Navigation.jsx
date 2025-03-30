import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';  // Import MaterialCommunityIcons
import { View, Text } from 'react-native';

// Test function component
const testFunc = () => {
    return (
        <View>
            <Text>Test</Text>
        </View>
    )
}

const Tab = createBottomTabNavigator();

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
