import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

const Tab = createBottomTabNavigator();

export default function AuthStack() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="התחברות" component={SignInScreen} />
        <Tab.Screen name="הרשמה" component={SignUpScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}