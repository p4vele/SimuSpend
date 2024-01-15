import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';


export default function HomeScreen() {
    const { user } = useAuthentication();
   
    return (
        <View>
          <Text>Welcome {user?.email}!</Text>
          </View>
    )
};

