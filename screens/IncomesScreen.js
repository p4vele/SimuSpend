import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity ,Modal,ImageBackground} from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc,addDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Button, Input} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { RefreshControl } from 'react-native';
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
  const [incomeDatetime, setIncomeDatetime] = useState(new Date().toISOString());
  const [selectedIncomeType, setSelectedIncomeType] = useState('salary');
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
  
  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
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
                <FontAwesome name="plus" size={20} color="white" />
                <Text style={styles.buttonText}>הוסף הכנסה</Text>
            </TouchableOpacity>
      </View>
      {/* Income Modal */}
      <Modal visible={isIncomeModalVisible} animationType="slide" transparent={true}>
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
            <DateTimePicker
              style={styles.inputContainer}
              value={new Date(incomeDatetime)}
              mode="date"
              display="default"
              onChange={(event, date) => setIncomeDatetime(date.toISOString())}
            />
            <Picker
              selectedValue={selectedIncomeType}
              onValueChange={(itemValue) => setSelectedIncomeType(itemValue)}
            >
              <Picker.Item label="משכורת" value="salary" />
              <Picker.Item label="העברה" value="transaction" />
              <Picker.Item label="מתנה" value="gift" />
              <Picker.Item label="אחר" value="other" />
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
      </Modal>
      <FlatList
        data={incomes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.incomeGridItem}>
            <View style={styles.amountContainer}>
                <Icon
                  name='arrow-up'
                  size={20}
                  color='green'
                  
                />
            </View>
            <View style={styles.entryInfo}>
                <Text style={styles.incomeDescription}>{item.description}</Text>
                <Text style={styles.incomeAmount}>{item.amount}</Text>
                <Text style={styles.entryComment}>{item.comment}</Text>
            </View>
            <TouchableOpacity
              onPress={() => deleteIncome(item.id)}
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
  },
  incomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
  },
  incomeDescription: {
    marginRight:10,
    direction: 'ltr',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  incomeAmount: {
    marginRight:10,
    direction: 'ltr',
    textAlign: 'right',
  },
  entryComment: {
    
    direction: 'ltr',
    textAlign: 'right',
  },
  deleteButton: {
    padding: 5,
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
});
