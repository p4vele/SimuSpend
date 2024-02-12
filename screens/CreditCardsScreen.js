import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Button, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';


const db = getFirestore();

export default function CreditCardsScreen({ navigation }) {
  const { user } = useAuthentication();
  const [creditCards, setCreditCards] = useState([]);
  const [newNickname, setNewNickname] = useState('');
  const [newLast4Digits, setNewLast4Digits] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState('');
  const [newAmountLimit, setNewAmountLimit] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  useEffect(() => {
    const loadData = async () => {
      await fetchCreditCards();
    };

    loadData();
  }, [user]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credit Cards</Text>
      <Button style={{ marginBottom: 25 }} title="Add Credit Card" onPress={toggleModal} />

      {/**credit card modal */}
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

      <FlatList
        data={creditCards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
            <TouchableOpacity
            style={styles.creditCardItem}
          >
            <Icon name="credit-card" size={30} color="#fff" style={styles.creditCardIcon} />
            <Text style={styles.creditCardNickname}>{item.nickname}</Text>
            <Text style={styles.creditCardLast4Digits}>**** **** **** {item.last4Digits}</Text>
            <Text style={styles.creditCardPaymentDate}>Payment Date: {item.paymentDate}</Text>
            <Text style={styles.creditCardAmountLimit}>Amount Limit: ${item.amountLimit}</Text>
            <TouchableOpacity
              onPress={() => deleteCreditCard(item.id)}
              style={styles.deleteButton}
            >
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  creditCardItem: {
    flex: 1,
    flexDirection: 'column', 
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#3498db', 
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2980b9', 
    width: '45%', 
  },
  creditCardNickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', 
  },
  creditCardLast4Digits: {
    fontSize: 14,
    color: '#fff', 
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
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#c0392b', 
    borderRadius: 5,
    marginTop: 10,
  },
  creditCardIcon: {
    marginBottom: 10,
  },
});
