import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, Keyboard ,ScrollView,Dimensions} from 'react-native';
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
const getMonthName = (monthIndex) => {
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  return monthNames[monthIndex];
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [totalExpenses, setTotalExpenses] = useState(0);

  const filterExpensesByMonth = (expenses, month) => {
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() == month;
    });
};

const fetchExpenses = async () => {
    try {
      if (!user) return;

      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
      const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filteredExpenses = filterExpensesByMonth(expensesData, selectedMonth);
      setExpenses(filteredExpenses);
      const newData = await calculateChartData(filteredExpenses);
      setChartData(newData);
      calculateTotalExpenses(filteredExpenses);
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
  }, [user,selectedMonth]);

  const calculateTotalExpenses = (expenses) => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalExpenses(total);
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const addExpense = async () => {
    try {
      const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
      const numPaymentsInt = parseInt(numPayments, 10) || 0;
      const amountPerPayment = parseFloat(newAmount) / numPaymentsInt || 0;
      if (numPaymentsInt > 0){
        for (let i = 0; i < numPaymentsInt; i++) {
          const paymentDate = new Date(date);
          paymentDate.setMonth(paymentDate.getMonth() + i);
    
          await addDoc(expensesCollection, {
            description: newExpense,
            amount: amountPerPayment,
            date: paymentDate.toISOString().split('T')[0],
            numPayments: numPaymentsInt,
            type: selectedExpenseType,
            comment: `${i + 1} / ${numPaymentsInt} תשלומים`,
            creditCard: selectedCreditCard,
          });
        }
      }
      else{
        await addDoc(expensesCollection, {
          description: newExpense,
          amount: parseFloat(newAmount) || 0,
          date,
          numPayments: parseInt(numPayments, 10) || 0,
          type: selectedExpenseType,
          comment,
          creditCard: selectedCreditCard,
        });
      }
  
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
  const dateView = (date) => {
    const isoDateRegexFull = /^\d{4}-\d{2}-\d{2}$/;

    const isoDateRegexShort = /^\d{2}-\d{2}-\d{2}$/;

    const shortDateRegex = /^\d{2}-\d{1,2}-\d{1,2}$/;

    const reformatDate = (year, month, day) => {
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${fullYear}`;
    };

    if (isoDateRegexFull.test(date)) {
        const [year, month, day] = date.split('-');
        return reformatDate(year, month, day);
    }

    if (isoDateRegexShort.test(date)) {
        const [year, month, day] = date.split('-');
        return reformatDate(year, month, day);
    }

    if (shortDateRegex.test(date)) {
        const [year, month, day] = date.split('-');
        return reformatDate(year, month.padStart(2, '0'), day.padStart(2, '0'));
    }

    return date;
  }

  const [isVisible, setIsVisible] = useState(false);
  
  const toggleModalMonth = () => setIsVisible(!isVisible);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedMonth === item && styles.selectedItem]}
      onPress={() => {
        setSelectedMonth(item);
        toggleModalMonth();
      }}
    >
      <Text style={[styles.text, selectedMonth === item && styles.selectedText]}>
        {getMonthName(item)}
      </Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleModalMonth} style={styles.textBox}>
          <Text style={{fontSize:26,marginBottom:5}}>הוצאות עבור חודש </Text>
          <Text style={{fontWeight:'bold',fontSize:26,direction:'rtl'}}>{getMonthName(selectedMonth)}</Text>

          <Text></Text>
          <Text style={{fontSize:12}}>לחץ על על מנת לבחור חודש אחר</Text> 
      </TouchableOpacity>
      <Text style={{fontSize:26,marginTop:10,marginBottom:10,textAlign:'center'}}>סה"כ הוצאות לחודש {getMonthName(selectedMonth)}: {totalExpenses.toFixed(2)}₪</Text>
      
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
      
      <Modal
        transparent
        visible={isVisible}
        animationType="slide"
        onRequestClose={toggleModalMonth}
      >
        <View style={styles.modalBackground2}>
          <View style={styles.modalContainer2}>
            <FlatList
              data={[...Array(12).keys()]}
              renderItem={renderItem}
              keyExtractor={(item) => item.toString()}
            />
          </View>
        </View>
      </Modal>
      
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
              <Button title="בטל" type="outline" onPress={toggleModal} buttonStyle={styles.cancelButton} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <View>
      
    </View>
      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={{ color: 'red' }}>{item.amount}</Text>
            <View style={styles.expensesData}>
              <Text style={{ fontWeight: 'bold' }}>{item.description}</Text>
              <Text>{item.comment}</Text>
            </View>
            <Text>{dateView(item.date)}</Text>
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
    marginTop:50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 5,
    color: '#007BFF',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
  },
  
  modalTitle2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  
  input: {
    width: '100%',
  },
  
  
  pai: {
    alignSelf: 'center',
  },

  modalBackground2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer2: {
    width: Dimensions.get('window').width - 40,
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    
  },
  selectedItem: {
    backgroundColor: '#e6e6e6',
    
  },
  text: {
    fontSize: 16,
    textAlign:'center',
  },
  selectedText: {
    fontWeight: 'bold',
  },
  textBox: {
     
    alignItems: 'center',
    direction:'rtl',
 },
});
