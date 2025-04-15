import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Dimensions } from 'react-native';
import Home from '../app/screens/Home';
import Expense from '../app/screens/Expense';
import Revenue from '../app/screens/Revenue';

const PlaceholderScreen = ({ title }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 24 }}>{title}</Text>
  </View>
);

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

export const TabNavigator = ({ route }) => {

  const userId = route?.params?.userId;
  
  return (
    <Tab.Navigator
      initialRouteName="Accueil"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: 'crimson',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          display: 'flex',
          height: 50,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Accueil') iconName = 'home';
          else if (route.name === 'Dépenses') iconName = 'credit-card';
          else if (route.name === 'Revenu') iconName = 'currency-usd';
          else if (route.name === 'Employé') iconName = 'account';
          else if (route.name === 'Analyse') iconName = 'chart-line';

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ focused }) => width >= 300 ? route.name : null,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Accueil" component={Home} initialParams={{ userId }} />
      <Tab.Screen name="Dépenses" component={Expense} initialParams={{ userId }} />
      <Tab.Screen name="Revenu" component={Revenue} initialParams={{ userId }} />
      <Tab.Screen name="Employé" component={() => <PlaceholderScreen title="Employé" />} />
      <Tab.Screen name="Analyse" component={() => <PlaceholderScreen title="Analyse" />} />
    </Tab.Navigator>
  );
};
