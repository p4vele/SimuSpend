import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import IncomesScreen from '../screens/IncomesScreen';
import ChatScreen from '../screens/ChatScreen';
import OperationsScreen from '../screens/OperationsScreen';
import CreditCardsScreen from '../screens/CreditCardsScreen';

const Tab = createBottomTabNavigator();

export default function UserStack() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="בית" component={HomeScreen} />
        <Tab.Screen name="הוצאות" component={ExpensesScreen} />
        <Tab.Screen name="הכנסות" component={IncomesScreen} />
        <Tab.Screen name="צאט" component={ChatScreen} />
        <Tab.Screen name="עובר ושב" component={OperationsScreen} />
        <Tab.Screen name="כרטיסי אשראי" component={CreditCardsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}