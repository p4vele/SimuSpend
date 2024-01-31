import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import IncomesScreen from '../screens/IncomesScreen';
import ChatScreen from '../screens/ChatScreen';
import OperationsScreen from '../screens/OperationsScreen';

const Tab = createBottomTabNavigator();

export default function UserStack() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Expenses" component={ExpensesScreen} />
        <Tab.Screen name="Incomes" component={IncomesScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="עובר ושב" component={OperationsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}