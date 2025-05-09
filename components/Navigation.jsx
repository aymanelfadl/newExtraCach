import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Home from '../app/screens/Home';
import Expense from '../app/screens/Expense';
import Revenue from '../app/screens/Revenue';
import Employees from '../app/screens/Employees';
import Dashboard from '../app/screens/Dashboard';     
import Settings from '../app/screens/Settings';        

import { colors, typography, shadows } from '../styles/theme';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive || colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive || colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar || colors.card,
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
          ...shadows.medium,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizeXSmall,
          fontWeight: typography.weightSemiBold,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Expense"
        component={Expense}
        options={{
          tabBarLabel: 'Dépenses',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash-minus" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Revenue"
        component={Revenue}
        options={{
          tabBarLabel: 'Revenus',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash-plus" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Employees"
        component={Employees}
        options={{
          tabBarLabel: 'Employés',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};