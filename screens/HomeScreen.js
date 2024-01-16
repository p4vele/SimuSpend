import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TouchableOpacity, Image } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { Button, Input} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';

const auth = getAuth();
const db = getFirestore();

export default function HomeScreen() {
  const { user } = useAuthentication();
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [datetime, setDatetime] = useState(new Date().toISOString());
  const [numPayments, setNumPayments] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('food');
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        await fetchExpenses();
      }
    };

    fetchData();
  }, [user]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const fetchExpenses = async () => {
    try {
      const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
      const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const addExpense = async () => {
    try {
      const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
      await addDoc(expensesCollection, {
        description: newExpense,
        amount: parseFloat(newAmount) || 0,
        datetime,
        numPayments: parseInt(numPayments, 10) || 0, 
        type: selectedExpenseType,
        comment,
      });
      setNewExpense('');
      setNewAmount('');
      setDatetime(new Date().toISOString());
      setNumPayments('');
      setSelectedExpenseType('food');
      setComment('');
      fetchExpenses();
      toggleModal();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };
  

  const deleteExpense = async (expenseId) => {
    try {
      const expenseDoc = doc(db, 'users', user?.uid, 'expenses', expenseId);
      await deleteDoc(expenseDoc);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

 

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={{ width: 150, height: 150, alignSelf: 'center', resizeMode: 'contain' }}
      />
      <Text style={{ marginBottom: 25,}}>Welcome {user?.email}!</Text>

      <Button style={{ marginBottom: 25,}} title="Enter Expense" onPress={toggleModal} />
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '80%' }]}>
            <Text style={styles.modalTitle}>Enter Expense</Text>
            <Input
              placeholder="Expense Description"
              value={newExpense}
              onChangeText={(text) => setNewExpense(text)}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="Expense Amount"
              value={newAmount}
              onChangeText={(text) => setNewAmount(text)}
              keyboardType="numeric"
              containerStyle={styles.inputContainer}
            />
            <DateTimePicker
              style={styles.inputContainer}
              value={new Date(datetime)}
              mode="datetime"
              display="default"
              onChange={(event, date) => setDatetime(date.toISOString())}
            />
            <Input
              placeholder="Number of Payments"
              value={numPayments}
              onChangeText={(text) => setNumPayments(text)}
              keyboardType="numeric"
              containerStyle={styles.inputContainer}
            />
            <Picker
              selectedValue={selectedExpenseType}
              onValueChange={(itemValue) => setSelectedExpenseType(itemValue)}
            >
              <Picker.Item label="Food" value="food" />
              <Picker.Item label="Traffic" value="traffic" />
              <Picker.Item label="Entertainment" value="entertainment" />
              <Picker.Item label="Maintenance" value="maintenance" />
              <Picker.Item label="Rent" value="rent" />
              <Picker.Item label="Insurence" value="insurence" />
              <Picker.Item label="House Expense" value="houseexpense" />
              <Picker.Item label="Other" value="other" />
            </Picker>
            <Input
              placeholder="Comment"
              value={comment}
              onChangeText={(text) => setComment(text)}
              containerStyle={styles.inputContainer}
            />
            
            <Button title="Add Expense" onPress={addExpense} />
            <Button title="Cancel" type="outline" onPress={toggleModal} />
          </View>
        </View>
      </Modal>

      <View style={styles.headerContainer}>
        <TouchableOpacity
            onPress={() => signOut(auth)}
            style={styles.signOutButton}
        >
            <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
    </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <Text style={styles.headerText}>Description</Text>
            <Text style={styles.headerText}>  Amount</Text>
            <Text style={styles.headerText}>  Delete</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <Text style={styles.expenseAmount}>{item.amount}</Text>
            <Button
            icon={<Icon name="times" size={15} color="red" />}
            type="clear"
            onPress={() => deleteExpense(item.id)}
            />
            </View>
            )}
            />
            </View>
            );
            }
            
            const styles = StyleSheet.create({
              container: {
                flex: 1,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              },
              inputContainer: {
                width: '80%',
                marginTop: 10,
              },
              expenseItem: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                borderBottomWidth: 1,
                borderColor: '#ccc',
                paddingVertical: 10,
              },
              expenseDescription: {
                flex: 2,
              },
              expenseAmount: {
                flex: 1,
              },
              listHeader: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                marginTop: 10,
                paddingHorizontal: 10,
              },
              headerText: {
                fontWeight: 'bold',
                fontSize: 15,
                
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
              headerContainer: {
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              },
              signOutButton: {
                padding: 10,
                borderRadius: 5,
                backgroundColor: 'blue',
              },
              signOutText: {
                color: 'white',
              },
            });
            