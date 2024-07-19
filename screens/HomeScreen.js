import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TouchableOpacity, Keyboard, TouchableWithoutFeedback ,ScrollView} from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { Button, Input } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc,doc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PieChart } from 'react-native-chart-kit';
import Swiper from 'react-native-swiper';
import Icon from 'react-native-vector-icons/FontAwesome';

const auth = getAuth();
const db = getFirestore();

export default function HomeScreen({ navigation }) {
  const { user } = useAuthentication();

  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [numPayments, setNumPayments] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('מזון ומשקאות');
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState('מזומן');
  const [creditCards, setCreditCards] = useState([]);

  const [incomes, setIncomes] = useState([]);
  const [newIncome, setNewIncome] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedIncomeType, setSelectedIncomeType] = useState('משכורת');
  const [incomeComment, setIncomeComment] = useState('');
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);

  const [expenseChartData, setExpenseChartData] = useState([]);
  const [incomeChartData, setIncomeChartData] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const today = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const fetchNotifications = async () => {
    try {
      const notificationsCollection = collection(db, 'users', user?.uid, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsCollection);
      const notificationsData = notificationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const filterNotifications = () => {
    const currentDate = new Date();
    return notifications.filter(notification => {
      let eventDate;
      if (notification.date && notification.date.seconds) {
        eventDate = new Date(notification.date.seconds * 1000);
      } else {
        return false;
      }

      let reminderDate;
      switch (notification.reminderDate) {
        case '1month':
          reminderDate = new Date(eventDate);
          reminderDate.setMonth(eventDate.getMonth() - 1);
          break;
        case '1week':
          reminderDate = new Date(eventDate);
          reminderDate.setDate(eventDate.getDate() - 7);
          break;
        case '3days':
          reminderDate = new Date(eventDate);
          reminderDate.setDate(eventDate.getDate() - 3);
          break;
        default:
          return false;
      }

      return currentDate >= reminderDate && currentDate <= eventDate;
    });
  };

  const fetchExpenses = async () => {
    try {
      const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
      const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      calculateExpenseChartData(expensesData);
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
      calculateIncomeChartData(incomesData);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };
  const fetchCreditCards = async () => {
    try {
      if (!user) {
        return;
      }

      const creditCardsCollection = collection(db, 'users', user.uid, 'creditCards');
      const creditCardsSnapshot = await getDocs(creditCardsCollection);
      const creditCardsData = creditCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCreditCards(creditCardsData);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchIncomes();
      fetchCreditCards();
      fetchNotifications();
    }
  }, [user, refresh]);

  const relevantNotifications = filterNotifications();

  
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const toggleIncomeModal = () => {
    setIsIncomeModalVisible(!isIncomeModalVisible);
  };

  const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];

  const calculateExpenseChartData = async (expensesData) => {
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

    setExpenseChartData(newChartData);
  };

  const calculateIncomeChartData = async (incomesData) => {
    const typesData = incomesData.reduce((acc, income) => {
      acc[income.type] = (acc[income.type] || 0) + income.amount;
      return acc;
    }, {});

    const newChartData = Object.keys(typesData).map((type, index) => ({
      name: type,
      amount: typesData[type],
      color: colorScale[index % colorScale.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }));

    setIncomeChartData(newChartData);
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
  
  const addIncome = async () => {
    try {
      const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
      await addDoc(incomesCollection, {
        description: newIncome,
        amount: parseFloat(incomeAmount) || 0,
        date: incomeDate,
        type: selectedIncomeType,
        comment: incomeComment,
      });
      setNewIncome('');
      setIncomeAmount('');
      setIncomeDate(new Date().toISOString().split('T')[0]);
      setSelectedIncomeType('משכורת');
      setIncomeComment('');
      fetchIncomes();
      toggleIncomeModal();
    } catch (error) {
      console.error('Error adding income:', error);
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
  const deleteIncome = async (incomeId) => {
    try {
      const incomeDoc = doc(db, 'users', user?.uid, 'incomes', incomeId);
      await deleteDoc(incomeDoc);
      fetchIncomes();
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.signOutButton}>
          <MaterialCommunityIcons name="logout" size={24} color="#333" />
          <Text style={styles.signOutText}>התנתק</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{today}</Text>
      </View>


      <View style={styles.notificationsWrapper}>
        <Text style={styles.title}>התראות</Text>
        <ScrollView horizontal style={styles.notificationsContainer}>
        {relevantNotifications.map((notification) => (
          <View key={notification.id} style={styles.notificationItem}>
            <Text style={styles.notificationDate}>{new Date(notification.date.seconds * 1000).toLocaleDateString()}</Text>
            <Text style={styles.notificationTitle}>{notification.name}</Text>
            <Text style={styles.notificationDescription}>{notification.description}</Text>
          </View>
        ))}
        </ScrollView>
      </View>

      <Swiper style={styles.wrapper} showsButtons={false} loop={false} autoplay>
        <View style={styles.slide}>
          <Text style={styles.title}>הוצאות</Text>
          <PieChart
            data={expenseChartData}
            width={350}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            absolute
          />
          <TouchableOpacity onPress={toggleModal} style={styles.addButton}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
            <Text style={styles.addButtonText}>הוסף הוצאה</Text>
          </TouchableOpacity>
          <FlatList
            data={expenses}
            renderItem={({ item }) => (
              <View style={styles.expenseItem}>
                
                <TouchableOpacity onPress={() => deleteExpense(item.id)} style={styles.deleteButton}>
                  <Icon name="times" size={15} color="red" />
                </TouchableOpacity>
                <Text style={styles.expenseDate}>{formatDate(item.date)}</Text> 
                <Text style={styles.expenseDescription}>{item.description}</Text>
                <Text style={styles.expenseAmount}>{item.amount} ₪</Text>
                

              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        <View style={styles.slide}>
          <Text style={styles.title}>הכנסות</Text>
          <PieChart
            data={incomeChartData}
            width={350}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
          />
          <TouchableOpacity onPress={toggleIncomeModal} style={styles.addButton}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
            <Text style={styles.addButtonText}>הוסף הכנסה</Text>
          </TouchableOpacity>
          <FlatList
            data={incomes}
            renderItem={({ item }) => (
              <View style={styles.incomeItem}>
                
                <TouchableOpacity onPress={() => deleteIncome(item.id)} style={styles.deleteButton}>
                  <Icon name="times" size={15} color="red" />
                </TouchableOpacity>
                
                <Text style={styles.incomeDate}>{formatDate(item.date)}</Text> 
                <Text style={styles.incomeDescription}>{item.description}</Text>
                <Text style={styles.incomeAmount}>{item.amount} ₪</Text>
                
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
        
      </Swiper>
      

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>הוסף הוצאה</Text>
              <Input
                placeholder="תיאור"
                value={newExpense}
                onChangeText={setNewExpense}
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="סכום"
                keyboardType="numeric"
                value={newAmount}
                onChangeText={setNewAmount}
                containerStyle={styles.inputContainer}
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
                keyboardType="numeric"
                value={numPayments}
                onChangeText={setNumPayments}
                containerStyle={styles.inputContainer}
              />
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
                  <Picker.Item label="ביטוח" value="ביטוח" />
                  <Picker.Item label="ריהוט ובית" value="ריהוט ובית" />
                  <Picker.Item label="שונות" value="שונות" />
              </Picker>
              <Input
                placeholder="הערות"
                value={comment}
                onChangeText={setComment}
                containerStyle={styles.inputContainer}
              />
              <Picker
                selectedValue={selectedCreditCard}
                onValueChange={(itemValue) => setSelectedCreditCard(itemValue)}
                style={styles.picker}
              >
                {creditCards.map((card) => (
                  <Picker.Item key={card.id} label={card.nickname +"-"+ card.last4Digits} value={card.nickname} />
                ))}
                <Picker.Item label="מזומן" value="מזומן" />
              </Picker>
              <Button title="שמור" onPress={addExpense} buttonStyle={styles.saveButton} />
              <Button title="בטל" onPress={toggleModal} buttonStyle={styles.cancelButton} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={isIncomeModalVisible} transparent={true} animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>הוסף הכנסה</Text>
              <Input
                placeholder="תיאור"
                value={newIncome}
                onChangeText={setNewIncome}
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="סכום"
                keyboardType="numeric"
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                containerStyle={styles.inputContainer}
              />
              <DateTimePicker
                style={styles.inputContainer}
                value={new Date(incomeDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => setIncomeDate(formatDate(selectedDate))}
                />
              <Input
                placeholder="הערות"
                value={incomeComment}
                onChangeText={setIncomeComment}
                containerStyle={styles.inputContainer}
              />
              <Picker
                selectedValue={selectedIncomeType}
                onValueChange={(itemValue) => setSelectedIncomeType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="משכורת" value="משכורת" />
                <Picker.Item label="העברה" value="העברה" />
                <Picker.Item label="מתנה" value="מתנה" />
                <Picker.Item label="אחר" value="אחר" />
              </Picker>
              
              <Button title="שמור" onPress={addIncome} buttonStyle={styles.saveButton} />
              <Button title="בטל" onPress={toggleIncomeModal} buttonStyle={styles.cancelButton} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop:35,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    marginLeft: 5,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationsWrapper: {
    flexShrink: 1,
    alignItems : 'center',
  },
  notificationsContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'scroll',
    height: 70, 
  },
  notificationItem: {
    backgroundColor: '#e1e1e1',
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
    width: 75, 
    height: 70, 
    
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notificationDate: {
    fontSize: 10,
    color: '#555',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notificationDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  wrapper: {
  
    height: 220, 
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 5,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    direction:'rtl',
    marginVertical:5,
    alignContent: 'center',
    alignItems: 'center',
    width:'95%',
  },
  expenseDescription: {
    fontSize: 16,
    marginLeft:5,
    marginVertical:5,


  },
  expenseAmount: {
    fontSize: 16,
    color: '#FF5733',
    marginLeft:5,

  },
  incomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    direction:'rtl',
    marginVertical:5,
    alignContent: 'center',
    alignItems: 'center',
    width:'95%',


  },
  incomeDescription: {
    fontSize: 16,
    marginLeft:5,
    marginVertical:5,

  },
  incomeAmount: {
    fontSize: 16,
    color: '#33FF57',
    marginLeft:5,

  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    
  },
  modalTitle: {
    marginTop:20,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 10,
    alignSelf: 'center',
  },
  picker: {
    height: '20%',
    overflow: 'scroll',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
  },
  cancelButton: {
    marginTop: 5,
    backgroundColor: '#FFC107',
  },
});

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
};