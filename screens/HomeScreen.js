import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TouchableOpacity, Image,ImageBackground,TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { Button, Input} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 
import { FontAwesome } from '@expo/vector-icons';

import { LineChart, PieChart } from 'react-native-chart-kit';
import  Swiper from 'react-native-swiper'
import OperationsScreen from './OperationsScreen';

const auth = getAuth();
const db = getFirestore();



export default function HomeScreen({navigation }) {
  const { user } = useAuthentication();

  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [datetime, setDatetime] = useState(new Date().toISOString());
  const [numPayments, setNumPayments] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('מזון ומשקאות');
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState('מזומן');
  const [creditCards, setCreditCards] = useState([]); 

  const [incomes, setIncomes] = useState([]);
  const [newIncome, setNewIncome] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDatetime, setIncomeDatetime] = useState(new Date().toISOString());
  const [selectedIncomeType, setSelectedIncomeType] = useState('משכורת');
  const [incomeComment, setIncomeComment] = useState('');
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);

  const [expenseChartData, setExpenseChartData] = useState([]);
  const [incomeChartData, setIncomeChartData] = useState([]);


  const fetchExpenses = async () => {
    try {
      const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
      const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      calculateExpenseChartData(expensesData);
      console.log("fetch expenses home ");
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
      console.log("fetch income home ");
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };
  useEffect(() => {

    if (user) {
      fetchExpenses();
      fetchIncomes();
      fetchCreditCards();

    }
  }, [user]);
  const fetchCreditCards = async () => {
    try {
      if (!user) {
        console.log("no user");
        return;
      }

      const creditCardsCollection = collection(db, 'users', user.uid, 'creditCards');
      const creditCardsSnapshot = await getDocs(creditCardsCollection);

      if (creditCardsSnapshot && creditCardsSnapshot.docs) {
        const creditCardsData = creditCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCreditCards(creditCardsData);
      }
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  };
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
        datetime,
        numPayments: parseInt(numPayments, 10) || 0,
        type: selectedExpenseType,
        comment,
        creditCard: selectedCreditCard,
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
        <View style={styles.logoContainer}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
            />
        </View>
        <TouchableOpacity style={styles.operationsScreenContainer} onPress={() => navigation.navigate('כל התנועות')}>
          <View style={styles.operationsScreenContainer}>
            <OperationsScreen 
              data={expenses.concat(incomes).sort((a, b) => new Date(b.datetime) - new Date(a.datetime))}
            />
          </View>
        </TouchableOpacity>
      <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleModal}>
              <FontAwesome name="plus" size={20} color="white" />
              <Text style={styles.buttonText}>הוסף הוצאה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleIncomeModal}>
              <FontAwesome name="plus" size={20} color="white" />
              <Text style={styles.buttonText}>הוסף הכנסה</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('יבא מאקסל')}>
              <FontAwesome name="plus" size={20} color="white" />
              <Text style={styles.buttonText}>יבא מאקסל</Text>
          </TouchableOpacity>

      </View>


      {/**expense modal */}
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
              />
              <Input
                placeholder="סכום"
                value={newAmount}
                onChangeText={(text) => setNewAmount(text)}
                keyboardType="numeric"
              />
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <DateTimePicker
                value={new Date(datetime)}
                mode="date"
                display="default"
                onChange={(event, date) => setDatetime(date.toISOString())}
              />
              </View>
              <Input
                placeholder="מספר תשלומים"
                value={numPayments}
                onChangeText={(text) => setNumPayments(text)}
                keyboardType="numeric"
              />
              <Input
                placeholder="הערה"
                value={comment}
                onChangeText={(text) => setComment(text)}
              />
            </View>
            <View style={styles.pickerTextBox}>
            <Text style={styles.pickerLabel}>אמצעי תשלום</Text>
            <Text style={styles.pickerLabel}>סוג הוצאה</Text>
            </View>
            <View style={styles.pickerContainer}>
              
              <Picker
                selectedValue={selectedExpenseType}
                onValueChange={(itemValue) => setSelectedExpenseType(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
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
              <Picker
                  selectedValue={selectedCreditCard}
                  onValueChange={(itemValue) => setSelectedCreditCard(itemValue)}
                  style={styles.picker}
              >
                  <Picker.Item label="מזומן" value="מזומן" />
                     {creditCards.map((card) => (
                        <Picker.Item key={card.id} label={card.nickname} value={card.id} />
                      ))}
                  </Picker>
            </View>
              <View style={styles.buttonContainer}>
                <Button title="הוספה" onPress={addExpense} />
                <Button title="ביטול" type="outline" onPress={toggleModal} />
              </View>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </Modal>
             
      
       {/* Income Modal */}
       <Modal visible={isIncomeModalVisible} animationType="slide" transparent={true}>
       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '80%' }]}>
            <Text style={styles.modalTitle}>הוסף הכנסה</Text>
            <Input
              placeholder="תיאור"
              value={newIncome}
              onChangeText={(text) => setNewIncome(text)}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="סכום"
              value={incomeAmount}
              onChangeText={(text) => setIncomeAmount(text)}
              keyboardType="numeric"
              containerStyle={styles.inputContainer}
            />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <DateTimePicker
              style={styles.inputContainer}
              value={new Date(incomeDatetime)}
              mode="date"
              display="default"
              onChange={(event, date) => setIncomeDatetime(date.toISOString())}
            />
            </View>
            <Picker
              selectedValue={selectedIncomeType}
              onValueChange={(itemValue) => setSelectedIncomeType(itemValue)}
            >
              <Picker.Item label="משכורת" value="משכורת" />
              <Picker.Item label="העברה" value="העברה" />
              <Picker.Item label="מתנה" value="מתנה" />
              <Picker.Item label="אחר" value="אחר" />
            </Picker>
            <Input
              placeholder="הערות"
              value={incomeComment}
              onChangeText={(text) => setIncomeComment(text)}
              containerStyle={styles.inputContainer}
            />

            <Button title="הוספה" onPress={addIncome} />
            <Button title="ביטול" type="outline" onPress={toggleIncomeModal} />
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
      

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.signOutButton}>
            <FontAwesome name="sign-out" size={20} color="white" />
            <Text style={styles.signOutText}>התנתק</Text>
            <Text style={styles.greetingText}>שלום {user?.email}!</Text>
        </TouchableOpacity>

      </View>
      <View style={styles.slidecontainer}>
        <Swiper>
          <View style={styles.slideDeafault}>
            {/* Display expense chart */}
            <Text style={styles.chartTitle}>הוצאות</Text>
            {expenseChartData.length > 0 ? (
              <PieChart
                data={expenseChartData}
                width={350}
                height={150}
                chartConfig={{
                  backgroundGradientFrom: '#1E2923',
                  backgroundGradientTo: '#08130D',
                  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
              />
            ) : (
              <Text>No expense data available</Text>
            )}
          </View>
          <View style={styles.slideDeafault}>
            {/* Display income chart */}
            <Text style={styles.chartTitle}>הכנסות</Text>
            {incomeChartData.length > 0 ? (
              <PieChart
                data={incomeChartData}
                width={350}
                height={150}
                chartConfig={{
                  backgroundGradientFrom: '#1E2923',
                  backgroundGradientTo: '#08130D',
                  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
              />
            ) : (
              <Text>No income data available</Text>
            )}
          </View>
        </Swiper>
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
  operationsScreenContainer: {
    flex: 1,
    width:'100%',
    justifyContent: 'flex-end', 
    marginBottom:15,
    
  },
  container: {
    flex: 1,
    marginTop:25,
    backgroundColor: 'rgba(255, 255, 255, 0.01)', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  slidecontainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.01)', 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom:15,

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
  
  headerContainer: {
    direction:'rtl',
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
    justifyContent: 'center',
    alignItems:'flex-start',
  },
  signOutText: {
    color: 'white',
    fontSize:10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    direction:'rtl',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
      marginLeft: 5,
      color: 'white',
      fontSize: 16,
  },
  
  chartTitle: {
    direction:'rtl',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    right: 0, 
    color:'white',
  },
  slideDeafault:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 250,
  },
  logo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
      shadowColor: 'white',
      shadowOffset: {
        width: 1,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 220,
      
  },
  greetingText: {
      fontSize: 10,
      marginTop: 10,
      color: 'white',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row', 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerTextBox:{
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  pickerLabel: {
    fontSize: 18,
    textAlign: 'right',
    marginRight: 10,
    fontWeight: 'bold',
  },
  pickerItem: {
    fontSize: 12, 
  },
  picker: {
    width: '45%',
    marginLeft: 10,
  },
  
});
            