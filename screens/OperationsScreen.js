import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ImageBackground } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Button, Input } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { RefreshControl } from 'react-native';

const db = getFirestore();

export default function OperationsScreen({ navigation }) {
  const { user } = useAuthentication();
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      if (!user) {
        return;
      }

      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const incomesCollection = collection(db, 'users', user.uid, 'incomes');

      const [expensesSnapshot, incomesSnapshot] = await Promise.all([
        getDocs(expensesCollection),
        getDocs(incomesCollection),
      ]);

      if (expensesSnapshot && expensesSnapshot.docs && incomesSnapshot && incomesSnapshot.docs) {
        const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: 'expense' }));
        const incomesData = incomesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: 'income' }));

        const mergedData = [...expensesData, ...incomesData].sort((a, b) => new Date(b.datetime) - new Date(a.datetime)).reverse();
        setData(mergedData);
        console.log("fetch data operations");
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
        await fetchData();
    };
  
    loadData();
  }, [user]);
  
 const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>תנועות אחרונות</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.entryGridItem,
                { backgroundColor: item.type === 'income' ? '#b3ffb3' : '#ffb3b3' },
              ]}
            >
              <View style={styles.amountContainer}>
                <Icon
                  name={item.type === 'income' ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={item.type === 'income' ? 'green' : 'red'}
                />
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryDescription}>{item.description}</Text>
                <Text style={[styles.entryAmount, { color: item.type === 'income' ? 'green' : 'red' }]}>
                  {item.amount}
                </Text>
                <Text style={styles.entryComment}>{item.comment}</Text>
              </View>
            
            </TouchableOpacity>
          )}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {   
    padding: 25,
    marginTop:25,

  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'right',
    color:'white',
  },
  entryInfo: {
    flexDirection: 'column',
    flex: 1,
    textAlign: 'right',
  },
  entryDescription: {
    marginRight:10,
    fontWeight: 'bold',
    direction: 'ltr',
    textAlign: 'right',
  },
  entryAmount: {
    marginRight:10,
    direction: 'ltr',
    textAlign: 'right',
  },
  entryComment: {
    marginRight:10,
    direction: 'ltr',
    textAlign: 'right',
  },
  entryGridItem: {
    direction: 'rtl',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
