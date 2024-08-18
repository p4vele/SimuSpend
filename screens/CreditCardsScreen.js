import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal , ImageBackground} from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Button, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FontAwesome } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNPickerSelect from 'react-native-picker-select';

const db = getFirestore();
const getMonthName = (monthIndex) => {
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  return monthNames[monthIndex];
};
export default function CreditCardsScreen({ navigation }) {
  const { user } = useAuthentication();
  const [creditCards, setCreditCards] = useState([]);
  const [newNickname, setNewNickname] = useState('');
  const [newLast4Digits, setNewLast4Digits] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState('');
  const [newAmountLimit, setNewAmountLimit] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [selectedCreditCard, setSelectedCreditCard] = useState(null);
  const [isExpensesModalVisible, setIsExpensesModalVisible] = useState(false);
  const [creditCardExpenses, setCreditCardExpenses] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const filterExpensesByMonth = (expenses, month) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === month;
    });
  };
  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);
  };
  const fetchCreditCards = async () => {
    try {
      if (!user) {
        return;
      }

      const creditCardsCollection = collection(db, 'users', user.uid, 'creditCards');
      const creditCardsSnapshot = await getDocs(creditCardsCollection);

      if (creditCardsSnapshot && creditCardsSnapshot.docs) {
        const creditCardsData = creditCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCreditCards(creditCardsData);
        console.log("fetch credit cards - credit cards screen");
      }
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  };
  const fetchCreditCardExpenses = async (creditCardId) => {
    try {
      if (!user) {
        return;
      }
  
      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
  
      if (expensesSnapshot && expensesSnapshot.docs) {
        const expensesData = expensesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((expense) => expense.creditCard === creditCardId);
      
        
        setCreditCardExpenses(filterExpensesByMonth(expensesData,selectedMonth));
      }
    } catch (error) {
      console.error('Error fetching credit card expenses:', error);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      await fetchCreditCards();
    };
    
    loadData();
  }, [user]);
  useEffect(() => {
    fetchCreditCardExpenses(selectedCreditCard,selectedMonth);
  }, [selectedCreditCard,selectedMonth]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  const toggleExpensesModal = () => {
    setIsExpensesModalVisible(!isExpensesModalVisible);
  };
  const handleCreditCardPress = (creditCardId) => {
    console.log("Credit card pressed:", creditCardId);
    setSelectedCreditCard(creditCardId);
    fetchCreditCardExpenses(creditCardId);
    toggleExpensesModal();
    console.log("done:", creditCardId);

  };
  
  const addCreditCard = async () => {
    try {
      const creditCardsCollection = collection(db, 'users', user?.uid, 'creditCards');
      await addDoc(creditCardsCollection, {
        nickname: newNickname,
        last4Digits: newLast4Digits,
        paymentDate: newPaymentDate,
        amountLimit: parseFloat(newAmountLimit) || 0,
      });
      setNewNickname('');
      setNewLast4Digits('');
      setNewPaymentDate('');
      setNewAmountLimit('');
      fetchCreditCards();
      toggleModal();
    } catch (error) {
      console.error('Error adding credit card:', error);
    }
  };

  const deleteCreditCard = async (creditCardId) => {
    try {
      const creditCardDoc = doc(db, 'users', user?.uid, 'creditCards', creditCardId);
      await deleteDoc(creditCardDoc);
      fetchCreditCards();
    } catch (error) {
      console.error('Error deleting credit card:', error);
    }
  };
  const calculateTotalExpenses = (creditCardId) => {
    const expensesForCard = creditCardExpenses.filter((expense) => expense.creditCard === creditCardId);
    const totalExpenses = expensesForCard.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    return totalExpenses;
  };
  
  return (
      <View style={styles.container}>
        <View style={styles.textBox}>
          <Text style={{fontWeight:'bold',fontSize:26,direction:'rtl'}}>במסך זה תוכל לראות חיובים   </Text>
          <Text style={{fontWeight:'bold',fontSize:26,direction:'rtl'}}>לפי כרטיס אשראי</Text>
          <Text></Text>
          <Text>לחץ על כרטיס האשראי לתצוגה או הוסף כרטיס</Text>
        </View>
         <Modal visible={isModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { width: '80%' }]}>
              <Text style={styles.modalTitle}>הוסף כרטיס אשראי</Text>
              <Input
                placeholder="כינוי"
                value={newNickname}
                onChangeText={(text) => setNewNickname(text)}
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="4 ספרות אחרונות"
                value={newLast4Digits}
                onChangeText={(text) => setNewLast4Digits(text)}
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="תאריך תשלום 1-31"
                value={newPaymentDate}
                onChangeText={(text) => setNewPaymentDate(text)}
                 keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="מסגרת"
                value={newAmountLimit}
                onChangeText={(text) => setNewAmountLimit(text)}
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />

              <Button title="הוסף כרטיס אשראי" onPress={addCreditCard} />
              <Button title="בטל" type="outline" onPress={toggleModal} />
            </View>
          </View>
        </Modal>

        <Modal visible={isExpensesModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { width: '80%' }]}>
                
              <Text style={styles.modalTitle}> הוצאות עבור כרטיס זה בחודש</Text>
              <View style={styles.dropdownContainer}>
                
                <RNPickerSelect
                  onValueChange={(value) => handleMonthSelect(value)}
                  items={[
                    { label: 'ינואר', value: 0 },
                    { label: 'פברואר', value: 1 },
                    { label: 'מרץ', value: 2 },
                    { label: 'אפריל', value: 3 },
                    { label: 'מאי', value: 4 },
                    { label: 'יוני', value: 5 },
                    { label: 'יולי', value: 6 },
                    { label: 'אוגוסט', value: 7 },
                    { label: 'ספטמבר', value: 8 },
                    { label: 'אוקטובר', value: 9 },
                    { label: 'נובמבר', value: 10 },
                    { label: 'דצמבר', value: 11 }
                  ]}
                  value={selectedMonth}
                  style={pickerSelectStyles}
                />
                </View>
              <FlatList
                data={creditCardExpenses}
                keyExtractor={(item) => item.id}
                numColumns={1}
                renderItem={({ item }) => (
                  <View key={item.id} style={styles.expenseGridItem}>
                    
                      
                        <Text style={styles.entryDescription}>{item.date}</Text>
                        <Text style={styles.entryDescription}>{item.description}</Text>
                        <Text style={styles.entryAmount}>{item.amount}</Text>
                        <Text style={styles.entryComment}>{item.comment}</Text>

                  </View>
                )}
                contentContainerStyle={styles.expenseGridContainer}
              />
              <Button title="סגירה" type="outline" onPress={toggleExpensesModal} />
            </View>
          </View>
        </Modal>


        <FlatList
          data={creditCards}
          keyExtractor={(item) => item.id}
          numColumns={1}
          renderItem={({ item }) => (
            <TouchableOpacity
            style={styles.creditCardItem}
            onPress={() => handleCreditCardPress(item.id)}>
              <ImageBackground source={require('../assets/credit_card_background.png')} style={styles.cardBackground}>
                
                <Text style={styles.creditCardLast4Digits}>**** **** **** {item.last4Digits}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.creditCardPaymentDate}>תאריך חיוב: {item.paymentDate}</Text>
                  <Text style={styles.creditCardAmountLimit}>תפוסת מסגרת: {item.amountLimit}</Text>
                  
                </View>
                <Text style={styles.creditCardNickname}> {item.nickname}</Text>
                <TouchableOpacity onPress={() => deleteCreditCard(item.id)} style={styles.deleteButton}>
                  <Icon name="times" size={15} color="red" />
                </TouchableOpacity>
              </ImageBackground>
            </TouchableOpacity>

          )}
        />
        <TouchableOpacity style={styles.button} onPress={toggleModal}>
        <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
        <Text style={styles.buttonText}>הוסף כרטיס אשראי</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: 20,
    marginTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  inputContainer: {
    width: '80%',
    marginTop: 10,
  },
  creditCardItem: {
    marginVertical: 10,
    padding:'auto',
    borderRadius: 10,
    elevation: 5,
    
  },
  creditCardNickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    marginRight: 140,
  },
  creditCardLast4Digits: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  creditCardPaymentDate: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  creditCardAmountLimit: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderColor: '#c0392b',
    borderRadius: 5,
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
    color: '#007BFF',
    fontSize: 16,
    marginLeft: 5,
  },
  cardBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    },
  visaIcon: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  creditCardLast4Digits: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'right',
    marginRight: 20,
    marginTop: 120,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  creditCardPaymentDate: {
    fontSize: 12,
    color: '#fff',
  },
  creditCardAmountLimit: {
    fontSize: 12,
    color: '#fff',
  },
  deleteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  expenseGridContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    
  },
  expenseGridItem: {
    direction: 'rtl',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor:'#fff',
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    textAlign: 'center',
  },
  entryComment:{
    direction: 'ltr',
    textAlign: 'center',
    
  },
  entryDescription: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  entryAmount: {
    textAlign: 'center',
    color:'red',
  },
 
  deleteButton: {
    direction: 'ltr',
    padding: 5,
    alignSelf:'flex-start',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingAmount: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  textBox: {
     
    alignItems: 'center',
    direction:'rtl',
    marginBottom: 5,
 },
 dropdownContainer:{
  flexDirection: 'row-reverse',
  justifyContent: 'center',
  
}
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
  
});