import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity ,Modal,ScrollView,TouchableWithoutFeedback,Keyboard,Dimensions} from 'react-native';
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

  const getMonthName = (monthIndex) => {
    const monthNames = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return monthNames[monthIndex];
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [totalIncomes, setTotalIncomes] = useState(0);

  const filterIncomesByMonth = (incomes, month) => {
    return incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate.getMonth() == month;
    });
};

  const toggleIncomeModal = () => {
    setIsIncomeModalVisible(!isIncomeModalVisible);
  };

  
  const fetchIncomes = async () => {
    try {
      if (!user) {
        return;
      }
      const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
      const incomesSnapshot = await getDocs(incomesCollection);
      if(incomesCollection && incomesSnapshot.docs){
        const incomesData = incomesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const filteredIncomes = filterIncomesByMonth(incomesData, selectedMonth);
        setIncomes(filteredIncomes);
        const newData = await calculateIncomeChartData(filteredIncomes);
        setIncomeChartData(newData);
        calculateTotalIncomes(filteredIncomes);
       
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
  }, [user,selectedMonth]);

  const calculateTotalIncomes = (incomes) => {
    const total = incomes.reduce((sum, income) => sum + income.amount, 0);
    setTotalIncomes(total);
  };

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
          <Text style={{fontSize:26,marginBottom:5}}>הכנסות עבור חודש </Text>
          <Text style={{fontWeight:'bold',fontSize:26,direction:'rtl'}}>{getMonthName(selectedMonth)}</Text>

          <Text></Text>
          <Text style={{fontSize:12}}>לחץ על על מנת לבחור חודש אחר</Text> 
      </TouchableOpacity>
      <Text style={{fontSize:26,marginTop:10,marginBottom:10,textAlign:'center'}}>סה"כ הכנסות לחודש {getMonthName(selectedMonth)}: {totalIncomes}₪</Text>
      <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleIncomeModal}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
            <Text style={styles.buttonText}>הוסף הכנסה</Text>
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
     
          <FlatList
            data={incomes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.expenseItem}>
                <Text style={styles.expenseAmount}>{item.amount} ₪</Text>
                <View style={styles.expensesData}>
                  <Text style={{fontWeight:'bold'}}>{item.description}</Text>
                  <Text>{item.comment}</Text> 
                </View>
                <Text style={styles.expenseText}>{formatDate(item.date)}</Text>
                <TouchableOpacity onPress={() => deleteIncome(item.id)} style={styles.deleteButton}>
                  <FontAwesome name="times" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

          />

            
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
    marginTop:40,
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
    flexDirection: 'row',
    alignItems: 'center',
   
  },
  buttonText: {
      marginLeft: 5,
    
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
