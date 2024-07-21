import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Input } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RefreshControl } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { FontAwesome } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';

const db = getFirestore();

const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];

const calculateChartData = (expensesData) => {
  const typesData = expensesData.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
    return acc;
  }, {});

  const newChartData = Object.keys(typesData).map((type, index) => ({
    name: type,
    amount: typesData[type],
    color: colorScale[index % colorScale.length],
    legendFontColor: '#7F7F7F',
    legendFontSize: 15,
  }));

  return newChartData;
};

export default function ExpensesScreen({ navigation }) {
  const { user } = useAuthentication();
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [numPayments, setNumPayments] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('מזון ומשקאות');
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState('מזומן');
  const [creditCards, setCreditCards] = useState([]);

  const fetchExpenses = async () => {
    try {
      if (!user) return;

      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
      const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      const newData = await calculateChartData(expensesData);
      setChartData(newData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchCreditCards = async () => {
    try {
      if (!user) return;

      const creditCardsCollection = collection(db, 'users', user.uid, 'creditCards');
      const creditCardsSnapshot = await getDocs(creditCardsCollection);
      const creditCardsData = creditCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCreditCards(creditCardsData);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCreditCards();
  }, [user]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const addExpense = async () => {
    try {
      const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
      await addDoc(expensesCollection, {
        description: newExpense,
        amount: parseFloat(newAmount) || 0,
        date,
        numPayments: parseInt(numPayments, 10) || 0,
        type: selectedExpenseType,
        comment,
        creditCard: selectedCreditCard,
      });
      setNewExpense('');
      setNewAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNumPayments('');
      setSelectedExpenseType('מזון ומשקאות');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <View style={styles.container}>
      {chartData.length > 0 && (
        <PieChart
          data={chartData}
          width={350}
          height={220}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            strokeWidth: 2,
          }}
          accessor="amount"
          backgroundColor="transparent"
          style={styles.pai}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleModal}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
          <Text style={styles.buttonText}>הוסף הוצאה</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('יבא מאקסל')}>
          <FontAwesome name="upload" size={20} color="#007BFF" />
          <Text style={styles.buttonText}>יבא מאקסל</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={true} keyboardShouldPersistTaps='handled'>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>הוסף הוצאה</Text>
              <View style={styles.inputContainer}>
                <Input
                  placeholder="תיאור"
                  value={newExpense}
                  onChangeText={(text) => setNewExpense(text)}
                  containerStyle={styles.input}
                />
                <Input
                  placeholder="סכום"
                  value={newAmount}
                  onChangeText={(text) => setNewAmount(text)}
                  keyboardType="numeric"
                  containerStyle={styles.input}
                />
                <DateTimePicker
                  style={styles.inputContainer}
                  value={new Date(date)}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => setDate(formatDate(selectedDate))}
                />
                <Input
                  placeholder="מספר תשלומים"
                  value={numPayments}
                  onChangeText={(text) => setNumPayments(text)}
                  keyboardType="numeric"
                  containerStyle={styles.input}
                />
                <Input
                  placeholder="הערה"
                  value={comment}
                  onChangeText={(text) => setComment(text)}
                  containerStyle={styles.input}
                />
              </View>
              <Text style={styles.modalTitle2}>בחר סוג</Text>
              <Picker
                selectedValue={selectedExpenseType}
                onValueChange={(itemValue) => setSelectedExpenseType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="מזון ומשקאות" value="מזון ומשקאות" />
                <Picker.Item label="תחבורה" value="תחבורה" />
                <Picker.Item label="מסעדות" value="מסעדות" />
                <Picker.Item label="שירותי תקשורת" value="שירותי תקשורת" />
                <Picker.Item label="אנרגיה" value="אנרגיה" />
                <Picker.Item label="דלק" value="דלק" />
                <Picker.Item label="אחר" value="אחר" />
              </Picker>
              <Text style={styles.modalTitle2}>בחר אמצעי תשלום</Text>
              <Picker
                selectedValue={selectedCreditCard}
                onValueChange={(itemValue) => setSelectedCreditCard(itemValue)}
                style={styles.picker}
              >
                {creditCards.map((card) => (
                  <Picker.Item key={card.id} label={card.name} value={card.name} />
                ))}
                <Picker.Item label="מזומן" value="מזומן" />
              </Picker>
              <View style={styles.modalButtons}>
                <Button title="ביטול" onPress={toggleModal} buttonStyle={styles.modalButtonCancel} />
                <Button title="הוסף" onPress={addExpense} buttonStyle={styles.modalButtonAdd} />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={{color:'red'}}>{item.amount}</Text>
            <View style={styles.expensesData}>
              <Text style={{fontWeight:'bold'}}>{item.description}</Text>
              <Text>{item.comment}</Text> 
            </View>
            <Text>{formatDate(item.date)}</Text>
            <TouchableOpacity onPress={() => deleteExpense(item.id)}>
            <Icon name="times" size={15} color="red" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop:35,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 5,
    color: '#007BFF',
  },
  expensesData:{
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalTitle2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    width: '100%',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonCancel: {
    backgroundColor: 'red',
  },
  modalButtonAdd: {
    backgroundColor: 'green',
  },
  pai: {
    alignSelf: 'center',
  },
});
