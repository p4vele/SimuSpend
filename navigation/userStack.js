import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; 
import HomeScreen from '../screens/HomeScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import IncomesScreen from '../screens/IncomesScreen';
import ChatScreen from '../screens/ChatScreen';
import OperationsScreen from '../screens/OperationsScreen';
import CreditCardsScreen from '../screens/CreditCardsScreen';
import UploadCsvScreen from '../screens/UploadCsvScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoansScreen from '../screens/LoansScreen';
import SharedBudgetScreen from '../screens/SharedBudgetScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import SimulationsScreen from '../screens/SimulationsScreen';

const Tab = createBottomTabNavigator();

export default function UserStack() {
  return (
    <NavigationContainer>
      <Tab.Navigator >
        <Tab.Screen name="בית" component={HomeScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" color={color} size={size} />), headerShown: false }}  />
        <Tab.Screen name="הוצאות" component={ExpensesScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="trending-down" color={color} size={size} />), headerShown: false }} />
        <Tab.Screen name="הכנסות" component={IncomesScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="finance" color={color} size={size} />),  headerShown: false}} />
        <Tab.Screen name="צאט" component={ChatScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chat" color={color} size={size} />), headerShown: false }} />
        <Tab.Screen name="כל התנועות" component={OperationsScreen} options={{ tabBarButton: () => null,   tabBarVisible:false,headerShown: false}} />
        <Tab.Screen name="כרטיסים" component={CreditCardsScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="credit-card" color={color} size={size} />),  headerShown: false}} />
        <Tab.Screen name="יבא מאקסל" component={UploadCsvScreen} options={{  tabBarButton: () => null,   tabBarVisible:false,headerShown: false }}/>
        <Tab.Screen name="תזכורות" component={NotificationsScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="alarm-light" color={color} size={size} />),  headerShown: false}} />
        <Tab.Screen name="הלוואות" component={LoansScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bank" color={color} size={size} />),  headerShown: false}} />
        <Tab.Screen name="קבוצות " component={SharedBudgetScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-multiple" color={color} size={size} />),  headerShown: false}} />
        <Tab.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ tabBarButton: () => null,   tabBarVisible:false,headerShown: false}} />
        <Tab.Screen name="סימולציות " component={SimulationsScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="currency-ils" color={color} size={size} />),  headerShown: false}} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}