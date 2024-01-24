// ExpensesScreen.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity ,Modal,ImageBackground} from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc,addDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Button, Input} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

const db = getFirestore();

export default function ExpensesScreen({ navigation }) {
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

  
  const fetchExpenses = async () => {
    try {
      if (!user) {
        // If user is not defined, do nothing or handle accordingly
        return;
      }
  
      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
  
      if (expensesSnapshot && expensesSnapshot.docs) {
        const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExpenses(expensesData);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
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

  useFocusEffect(
    React.useCallback(() => {
      fetchExpenses();
    }, [])
  );
  
  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
    <View style={styles.container}>
      <Text style={styles.title}>Expenses</Text>
      <Button style={{ marginBottom: 25,}} title="Enter Expense" onPress={toggleModal} />
      {/**expense modal */}
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
              mode="date"
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

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.expenseItem}
            onPress={() => navigation.navigate('ExpenseDetails', { expense: item })}
          >
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <Text style={styles.expenseAmount}>{item.amount}</Text>
            <TouchableOpacity
              onPress={() => deleteExpense(item.id)}
              style={styles.deleteButton}
            >
              <Icon name="times" size={15} color="red" />
            </TouchableOpacity>
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
