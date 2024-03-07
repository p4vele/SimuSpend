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
import { RefreshControl } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { FontAwesome } from '@expo/vector-icons';

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
  const [datetime, setDatetime] = useState(new Date().toISOString());
  const [numPayments, setNumPayments] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('food');
  const [comment, setComment] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [documentContent, setDocumentContent] = useState('');
  const [chartData, setChartData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCreditCard, setSelectedCreditCard] = useState('cash');
  const [creditCards, setCreditCards] = useState([]); 

  const fetchExpenses = async () => {
    try {
      if (!user) {
        console.log("no user");
        return;
      }

      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);

      if (expensesSnapshot && expensesSnapshot.docs) {
        const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExpenses(expensesData);
        console.log("fetch expenses - expenses screen");
        await calculateChartData(expensesData);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };
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

  useEffect(() => {
    const loadData = async () => {
      await fetchExpenses();
      await fetchCreditCards();
    };
  
    loadData();
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (expenses.length > 0) {
        const newData = await calculateChartData(expenses);
        setChartData(newData);
      }
    };

    loadData();
  }, [expenses]);

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

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
    <View style={styles.container}>
      
      {chartData.length > 0 && (
          <PieChart
            data={chartData}
            width={350}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#1E2923',
              backgroundGradientTo: '#08130D',
              color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            
          />
        )}

        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleModal}>
                <FontAwesome name="plus" size={20} color="white" />
                <Text style={styles.buttonText}>הוסף הוצאה</Text>
            </TouchableOpacity>
      
            <TouchableOpacity 
                style={styles.button} 
                onPress={() => navigation.navigate('יבא מאקסל')}>
                <FontAwesome name="plus" size={20} color="white" />
                <Text style={styles.buttonText}>יבא מאקסל</Text>
            </TouchableOpacity>

        </View>
      {/**expense modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { flexDirection: 'row' }]}>
              {/* First Column */}
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle}>Enter Expense</Text>
                <Input
                  placeholder="תיאור"
                  value={newExpense}
                  onChangeText={(text) => setNewExpense(text)}
                  containerStyle={styles.inputContainer}
                />
                <Input
                  placeholder="סכום"
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
                  placeholder="מספר תשלומים"
                  value={numPayments}
                  onChangeText={(text) => setNumPayments(text)}
                  keyboardType="numeric"
                  containerStyle={styles.inputContainer}
                />
                <Input
                  placeholder="הערה"
                  value={comment}
                  onChangeText={(text) => setComment(text)}
                  containerStyle={styles.inputContainer}
                />
              </View>

              {/* Second Column */}
              <View style={{ flex: 1, paddingLeft: 10 }}>
                <Text style={{ fontSize:18, paddingLeft: 50 }}>סוג הוצאה</Text>
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
                <Text style={{ fontSize:18, paddingLeft: 45 }}>אמצעי תשלום</Text>

                <Picker
                  selectedValue={selectedCreditCard}
                  onValueChange={(itemValue) => setSelectedCreditCard(itemValue)}
                >
                  <Picker.Item label="Cash" value="cash" />
                    {creditCards.map((card) => (
                      <Picker.Item key={card.id} label={card.nickname} value={card.id} />
                    ))}
                </Picker>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>

                  <Button title="Add Expense" onPress={addExpense} />
                  <Button title="Cancel" type="outline" onPress={toggleModal} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
             
          
      <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.entryGridItem]}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: 20,
    marginTop:25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color:'white',
    marginLeft:145,
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  uploadedImage: {
    width: 200, 
    height: 200, 
    resizeMode: 'cover',
    marginTop: 10,
  },
  gridItem: {
    direction: 'rtl',
    flex: 1,
    flexDirection: 'column',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  entryInfo: {
    flexDirection: 'column',
    flex: 1,
    textAlign: 'right',
  },
  entryDescription: {
    marginRight:10,
    direction: 'ltr',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  entryAmount: {
    marginRight:10,
    direction: 'ltr',
    textAlign: 'right',
  },
  entryComment: {
    
    direction: 'ltr',
    textAlign: 'right',
  },
  entryGridItem: {
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
});
