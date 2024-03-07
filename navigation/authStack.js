import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 

import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

const Tab = createBottomTabNavigator();

export default function AuthStack() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="התחברות" component={SignInScreen} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="login" color={color} size={size} />), headerShown: false }} />
        <Tab.Screen name="הרשמה" component={SignUpScreen}  options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="file-sign" color={color} size={size} />), headerShown: false }}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
}