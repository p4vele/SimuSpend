import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity ,Modal,ScrollView,TouchableWithoutFeedback,Keyboard} from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc,addDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Button, Input} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { RefreshControl } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontAwesome } from '@expo/vector-icons';

const db = getFirestore();

const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];

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

    return newChartData;
  };

export default function IncomesScreen({ navigation }) {
  const { user } = useAuthentication();
  const [incomes, setIncomes] = useState([]);
  const [newIncome, setNewIncome] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIncomeType, setSelectedIncomeType] = useState('משכורת');
  const [incomeComment, setIncomeComment] = useState('');
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [incomeChartData, setIncomeChartData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const toggleIncomeModal = () => {
    setIsIncomeModalVisible(!isIncomeModalVisible);
  };

  
  const fetchIncomes = async () => {
    try {
      if (!user) {
        // If user is not defined, do nothing or handle accordingly
        return;
      }
      const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
      const incomesSnapshot = await getDocs(incomesCollection);
      if(incomesCollection && incomesSnapshot.docs){
        const incomesData = incomesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setIncomes(incomesData);
        console.log("fetch income - income screen");
        await calculateIncomeChartData(incomesData);
    }
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };
 

  useEffect(() => {
    const fetchData = async () => {
        await fetchIncomes();
    };
  
    fetchData();
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (incomes.length > 0) {
        const newData = await calculateIncomeChartData(incomes);
        setIncomeChartData(newData);
      }
    };

    loadData();
  }, [incomes]);

  const addIncome = async () => {
    try {
      const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
      await addDoc(incomesCollection, {
        description: newIncome,
        amount: parseFloat(incomeAmount) || 0,
        date,
        type: selectedIncomeType,
        comment: incomeComment,
      });
      setNewIncome('');
      setIncomeAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedIncomeType('salary');
      setIncomeComment('');
      fetchIncomes();
      toggleIncomeModal();
    } catch (error) {
      console.error('Error adding income:', error);
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
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncomes();
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
    
      {incomeChartData.length > 0 && (
        <PieChart
          data={incomeChartData}
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
            <TouchableOpacity style={styles.button} onPress={toggleIncomeModal}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
            <Text style={styles.buttonText}>הוסף הכנסה</Text>
            </TouchableOpacity>
      </View>
      {/* Income Modal */}
      <Modal visible={isIncomeModalVisible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '80%' }]}>
            <Text style={styles.modalTitle}>הזן הכנסה</Text>
            <Input
              placeholder="הזן תיאור"
              value={newIncome}
              onChangeText={(text) => setNewIncome(text)}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="הזן סכום"
              value={incomeAmount}
              onChangeText={(text) => setIncomeAmount(text)}
              keyboardType="numeric"
              containerStyle={styles.inputContainer}
            />
            <View style={{marginRight:50, justifyContent: 'center', alignItems: 'center' }}>
            <DateTimePicker
                    style={styles.inputContainer}
                    value={new Date(date)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => setDate(formatDate(selectedDate))}
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
      <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.expensesContainer}
        >
          <FlatList
            data={incomes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.expenseItem}>
                <Text style={styles.expenseAmount}>{item.amount} ₪</Text>
                <Text style={styles.expenseText}>{item.description}</Text>
                <Text style={styles.expenseText}>{formatDate(item.date)}</Text>
                <TouchableOpacity onPress={() => deleteIncome(item.id)} style={styles.deleteButton}>
                  <FontAwesome name="times" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
          />
        </ScrollView>

            
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
    marginTop:25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  expensesContainer: {
    paddingBottom: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical:5,
    alignContent: 'center',
  },
  expenseText: {
    fontSize: 16,
    marginLeft:5,
    marginVertical:5,
  },
  expenseAmount: {
    fontSize: 16,
    color: 'green',
    marginLeft:5,

  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginLeft:100,
  },
  inputContainer: {
    width: '80%',
    marginTop: 10,
  },
  incomeGridItem: {
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
      fontSize: 16,
      color:"#007BFF",
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
});
