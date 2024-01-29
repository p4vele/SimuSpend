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

const db = getFirestore();

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
    }
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };
  const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];

  const calculateIncomeChartData = async () => {
    const typesData = incomes.reduce((acc, income) => {
      acc[income.type] = (acc[income.type] || 0) + income.amount;
      return acc;
    }, {});

    const newChartData = Object.keys(typesData).map((type, index) => ({
      name: type,
      amount: typesData[type],
      color: colorScale[index % colorScale.length], // Use modulo to cycle through the color scale
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }));

    setIncomeChartData(newChartData);
  };

  useEffect(() => {
    const fetchData = async () => {
        await fetchIncomes();
        await calculateIncomeChartData();
    };
  
    fetchData();
  }, [user, incomes]);

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

  
  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
    <View style={styles.container}>
      <Text style={styles.title}>Incomes</Text>
      <Button style={{ marginBottom: 25 }} title="Enter Income" onPress={toggleIncomeModal} />
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
          absolute
        />
      )}

      {/* Income Modal */}
      <Modal visible={isIncomeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '80%' }]}>
            <Text style={styles.modalTitle}>Enter Income</Text>
            <Input
              placeholder="Income Description"
              value={newIncome}
              onChangeText={(text) => setNewIncome(text)}
              containerStyle={styles.inputContainer}
            />
            <Input
              placeholder="Income Amount"
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
              <Picker.Item label="Salary" value="salary" />
              <Picker.Item label="Side Job" value="sidejob" />
              <Picker.Item label="Transaction" value="transaction" />
              <Picker.Item label="Gift" value="gift" />
              <Picker.Item label="Other" value="other" />
            </Picker>
            <Input
              placeholder="Comment"
              value={incomeComment}
              onChangeText={(text) => setIncomeComment(text)}
              containerStyle={styles.inputContainer}
            />

            <Button title="Add Income" onPress={addIncome} />
            <Button title="Cancel" type="outline" onPress={toggleIncomeModal} />
          </View>
        </View>
      </Modal>
      <FlatList
        data={incomes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.incomeItem}
            onPress={() => navigation.navigate('IncomeDetails', { income: item })}
          >
            <Text style={styles.incomeDescription}>{item.description}</Text>
            <Text style={styles.incomeAmount}>{item.amount}</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
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
    flex: 2,
  },
  incomeAmount: {
    flex: 1,
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
  },
  inputContainer: {
    width: '80%',
    marginTop: 10,
  },
});
