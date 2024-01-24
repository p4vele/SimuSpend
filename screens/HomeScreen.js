import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TouchableOpacity, Image,ImageBackground } from 'react-native';
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
  //expeneses
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [datetime, setDatetime] = useState(new Date().toISOString());
  const [numPayments, setNumPayments] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('food');
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  //incomes
  const [incomes, setIncomes] = useState([]);
  const [newIncome, setNewIncome] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDatetime, setIncomeDatetime] = useState(new Date().toISOString());
  const [selectedIncomeType, setSelectedIncomeType] = useState('salary');
  const [incomeComment, setIncomeComment] = useState('');
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);


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

  const fetchIncomes = async () => {
    try {
      const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
      const incomesSnapshot = await getDocs(incomesCollection);
      const incomesData = incomesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setIncomes(incomesData);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const toggleIncomeModal = () => {
    setIsIncomeModalVisible(!isIncomeModalVisible);
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
  
  const addIncome = async () => {
    try {
      const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
      await addDoc(incomesCollection, {
        description: newIncome,
        amount: parseFloat(incomeAmount) || 0,
        datetime: incomeDatetime,
        type: selectedIncomeType,
        comment: incomeComment,
      });
      setNewIncome('');
      setIncomeAmount('');
      setIncomeDatetime(new Date().toISOString());
      setSelectedIncomeType('salary');
      setIncomeComment('');
      fetchIncomes();
      toggleIncomeModal();
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={{ width: 150, height: 150, alignSelf: 'center', resizeMode: 'contain' }}
      />
      <Text style={{ marginBottom: 25,}}>Welcome {user?.email}!</Text>

      <View style={styles.buttonContainer}>
          <Button style={styles.button} title="Enter Expense" onPress={toggleModal} />
          <Button style={styles.button} title="Enter Income" onPress={toggleIncomeModal} />
      </View>


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

       {/* Income Modal */}
       <Modal visible={isIncomeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '80%' }]}>
            <Text style={styles.modalTitle}>Enter Income</Text>
            <Input
              placeholder="Income Description"
              value={newIncome}
              onChangeText={(text) => setNewIncome(text)}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="Income Amount"
              value={incomeAmount}
              onChangeText={(text) => setIncomeAmount(text)}
              keyboardType="numeric"
              containerStyle={styles.inputContainer}
            />
            <DateTimePicker
              style={styles.inputContainer}
              value={new Date(incomeDatetime)}
              mode="date"
              display="default"
              onChange={(event, date) => setIncomeDatetime(date.toISOString())}
            />
            <Picker
              selectedValue={selectedIncomeType}
              onValueChange={(itemValue) => setSelectedIncomeType(itemValue)}
            >
              <Picker.Item label="Salary" value="salary" />
              <Picker.Item label="Side Job" value="sidejob" />
              <Picker.Item label="Transaction" value="transaction" />
              <Picker.Item label="Gift" value="gift" />
              <Picker.Item label="Other" value="other" />
            </Picker>
            <Input
              placeholder="Comment"
              value={incomeComment}
              onChangeText={(text) => setIncomeComment(text)}
              containerStyle={styles.inputContainer}
            />

            <Button title="Add Income" onPress={addIncome} />
            <Button title="Cancel" type="outline" onPress={toggleIncomeModal} />
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
    margin: 10,
  },
  signOutButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'blue',
  },
  signOutText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    marginHorizontal: 5,
  },
});
            