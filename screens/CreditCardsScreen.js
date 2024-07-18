import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal , ImageBackground} from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Button, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FontAwesome } from '@expo/vector-icons';

const db = getFirestore();

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
  
        setCreditCardExpenses(expensesData);
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
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <View style={styles.container}>
        
         <Modal visible={isModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { width: '80%' }]}>
              <Text style={styles.modalTitle}>Add Credit Card</Text>
              <Input
                placeholder="Nickname"
                value={newNickname}
                onChangeText={(text) => setNewNickname(text)}
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="Last 4 Digits"
                value={newLast4Digits}
                onChangeText={(text) => setNewLast4Digits(text)}
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="Payment Date"
                value={newPaymentDate}
                onChangeText={(text) => setNewPaymentDate(text)}
                containerStyle={styles.inputContainer}
              />
              <Input
                placeholder="Amount Limit"
                value={newAmountLimit}
                onChangeText={(text) => setNewAmountLimit(text)}
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />

              <Button title="Add Credit Card" onPress={addCreditCard} />
              <Button title="Cancel" type="outline" onPress={toggleModal} />
            </View>
          </View>
        </Modal>

        <Modal visible={isExpensesModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { width: '80%' }]}>
              <Text style={styles.modalTitle}>הוצאות עבור כרטיס זה</Text>
              <FlatList
                data={creditCardExpenses}
                keyExtractor={(item) => item.id}
                numColumns={1}
                renderItem={({ item }) => (
                  <View key={item.id} style={styles.expenseGridItem}>
                    <View style={styles.amountContainer}>
                        <Icon
                          name='arrow-down'
                          size={20}
                          color='red'
                          
                        />
                      </View>
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryDescription}>{item.description}</Text>
                        <Text style={styles.entryAmount}>
                          {item.amount}
                        </Text>
                        <Text style={styles.entryComment}>{item.comment}</Text>
                      </View>

                      <TouchableOpacity
                      onPress={() => deleteExpense(item.id)}
                      style={styles.deleteButton}
                    >
                      <Icon name="times" size={15} color="red" />
                    </TouchableOpacity>
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
              <FontAwesome name="plus" size={20} color="white" />
              <Text style={styles.buttonText}>הוסף כרטיס אשראי</Text>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: 20,
    marginTop: 25,
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
      marginLeft: 5,
      color: 'white',
      fontSize: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor:'#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryComment:{
    direction: 'ltr',
    textAlign: 'right',
    
  },
  deleteButton: {
    direction: 'ltr',
    padding: 5,
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
});
