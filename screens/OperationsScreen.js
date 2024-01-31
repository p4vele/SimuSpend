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

const db = getFirestore();

export default function OperationsScreen({ navigation }) {
  const { user } = useAuthentication();
  const [data, setData] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [datetime, setDatetime] = useState(new Date().toISOString());
  const [numPayments, setNumPayments] = useState('');
  const [selectedType, setSelectedType] = useState('expense');
  const [comment, setComment] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  
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

        const mergedData = [...expensesData, ...incomesData].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        setData(mergedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Use useFocusEffect to fetch data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [user]) // Dependency on user to trigger data fetch when the user changes
  );
  

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Operations</Text>
        <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                style={[styles.entryItem, { backgroundColor: item.type === 'income' ? '#8eff8e' : '#ff8e8e' }]}
                onPress={() => navigation.navigate(`${item.type === 'expense' ? 'Expense' : 'Income'}Details`, { entry: item })}
                >
                <Text style={styles.entryDescription}>{item.description}</Text>
                <Text style={[styles.entryAmount, { color: item.type === 'income' ? 'green' : 'red' }]}>
                    {item.amount}
                </Text>
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
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
  },
  entryDescription: {
    flex: 2,
  },
  entryAmount: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    width: '80%',
    marginTop: 10,
  },
});
