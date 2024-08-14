import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Modal, TextInput, Button, TouchableWithoutFeedback, Keyboard,ScrollView  } from 'react-native';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const db = getFirestore();

const getMonthName = (monthIndex) => {
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  return monthNames[monthIndex];
};

export default function SimulationsScreen() {
  const { user } = useAuthentication();
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [modalVisible, setModalVisible] = useState(false);
  const [VATmodalVisible, setVATModalVisible] = useState(false);
  const [currentCPI, setCurrentCPI] = useState('');
  const [simulatedCPI, setSimulatedCPI] = useState('');
  const [debts, setDebts] = useState(0);
  const [modalMonthVisible, setModalMonthVisible] = useState(false);

  const [loans, setLoans] = useState([]);
  const [simulatedLoans, setSimulatedLoans] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newInterestRate, setNewInterestRate] = useState('');

  const filterExpensesByMonth = (expenses, month) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === month;
    });
  };
 const fetchLoans = async () => {
    try {
      if (!user) return;

      const loansCollection = collection(db, 'users', user.uid, 'loans');
      const loansSnapshot = await getDocs(loansCollection);
      const loansData = loansSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLoans(loansData);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };
  const fetchExpenses = async () => {
    try {
      if (!user) return;

      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);
      const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filteredExpenses = filterExpensesByMonth(expensesData, selectedMonth);
      setExpenses(filteredExpenses);
      
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const calculateFinancialIndicators = () => {
    let debts = 0;
    const currentCPIValue = 17;
    const simulatedCPIValue = parseFloat(simulatedCPI);
  
    const updatedExpenses = expenses.map(expense => {
      const originalPriceWithVAT = expense.amount;
      const originalPriceWithoutVAT = originalPriceWithVAT / (1 + currentCPIValue / 100);
      const newPriceWithSimulatedVAT = originalPriceWithoutVAT * (1 + simulatedCPIValue / 100);
  
      debts += newPriceWithSimulatedVAT - originalPriceWithVAT;
      return {
        ...expense,
        newPriceWithSimulatedVAT,
      };
    });
  
    setExpenses(updatedExpenses);
    setDebts(debts);
  };
  
  useEffect(() => {
    fetchExpenses();
  }, [user, selectedMonth]);

  useEffect(() => {
    fetchLoans();
  }, [user,isModalVisible]);

  const calculateNewMonthlyPay = (loan, newRate) => {
    const principal = loan.totalAmount;
    const monthlyRate = newRate / 100 / 12;  
    const numMonths = loan.numMonths;
  
    const newMonthlyPay = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numMonths));
    return newMonthlyPay.toFixed(2);
  };

  const simulateInterestRateChange = () => {
    const updatedLoans = loans.map((loan) => ({
      ...loan,
      newMonthlyPay: calculateNewMonthlyPay(loan, parseFloat(newInterestRate)),
    }));
    setSimulatedLoans(updatedLoans);
    setIsModalVisible(true);
  };

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setModalMonthVisible(false);
  };

  const toggleModalMonth = () => setModalMonthVisible(!modalMonthVisible);
  const toggleVATModal = () => setVATModalVisible(!VATmodalVisible);
  const toggleInterestRateModal = () => {
    setIsModalVisible(!isModalVisible);
    setSimulatedLoans([]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <Text style={styles.expenseText}>{item.description}</Text>
      <Text style={styles.expenseAmount}>{item.amount}₪</Text>
      {item.newPriceWithSimulatedVAT !== undefined && (
        <Text style={styles.newPriceText}>{item.newPriceWithSimulatedVAT.toFixed(2)}₪</Text>
      )}
    </View>
  );

  const ExpensesComparison = ({ debts, selectedMonth }) => {
    const textColor = debts < 0 ? 'green' : 'red';
  const formattedDebts = debts < 0 ? Math.abs(debts).toFixed(2) : debts.toFixed(2);

  return (
    <Text style={styles.text}>
      {debts < 0 ? 'ירידה של ' : 'עליה של '}
      <Text style={[styles.text, { color: textColor }]}>
        {formattedDebts}₪
      </Text>
      {' בהוצאות לחודש '}{getMonthName(selectedMonth)}{' ביחס למעמ'}
    </Text>

      
    );
  };
  const LoansComparison = ( neww, old ) => {
    console.log('neww',neww);
    console.log('old',old);
    const result = old - neww;
    console.log('result',result);
    const textColor = result < 0 ? 'green' : 'red';
    const formattedDebts = result < 0 ? Math.abs(result).toFixed(2) : result.toFixed(2);
    console.log('formattedDebts', formattedDebts);
    return (
      <Text style={{fontWeight:'bold'}}>
        {debts < 0 ? 'ירידה של ' : 'עליה של '}
        <Text style={[styles.text, { color: textColor }]}>
          {formattedDebts}₪
        </Text>
      
      </Text>

        
      );
  };
  return (
    <View style={styles.container}>
      <View style={styles.textBox}>
        <Text style={{fontWeight: 'bold', fontSize: 26, direction: 'rtl'}}>סימולציות</Text>
        <Text></Text>
        <Text> במסך זה תוכל להריץ סימולציות וירטואליות של תרחישים פיננסיים </Text>
        <Text> שונים כמו: </Text>
        <Text> שינויים בריבית פריים </Text>
        <Text> שינויים במעמ </Text>
        <Text> הוצאות גדולות</Text>
        <Text></Text>
        
      </View>

      

      <View style={styles.buttonContainer}>
        <Text style={{fontWeight: 'bold', fontSize: 20, direction: 'rtl',marginBottom:10,}}> לחץ על הסימולציה הרצויה</Text>
        <TouchableOpacity onPress={toggleVATModal} style={styles.button}>
          <Text style={{fontSize: 30, marginBottom: 5,marginRight:5,color:'#007BFF'}}>סימולציית שינוי במעמ</Text>
          <MaterialCommunityIcons name="finance" size={30} color="#007BFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleInterestRateModal} style={styles.button}>
          <Text style={{fontSize: 30, marginBottom: 5,marginRight:5,color:'#007BFF'}}>סימולציית שינוי ריבית </Text>
          <MaterialCommunityIcons name="trending-up" size={30} color="#007BFF" />
        </TouchableOpacity>
     </View>
      
      
      <Modal
        visible={modalMonthVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalMonthVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {Array.from({ length: 12 }, (_, i) => (
              <TouchableOpacity
                key={i}
                style={styles.monthOption}
                onPress={() => handleMonthSelect(i)}
              >
                <Text style={styles.monthText}>{getMonthName(i)}</Text>
              </TouchableOpacity>
            ))}
            <Button title="סגור" onPress={() => setModalMonthVisible(false)} style={styles.cancelButton} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={VATmodalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVATModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>סימולציית שינוי במעמ</Text>
            <TextInput
              style={styles.input}
              placeholder="מעמ סימולציה (%)"
              keyboardType="numeric"
              value={simulatedCPI}
              onChangeText={setSimulatedCPI}
            />
            <Button title="חשב" onPress={calculateFinancialIndicators} style={styles.saveButton} />
            <Button title="סגור" type="outline" onPress={toggleVATModal} style={styles.cancelButton}/>
            <TouchableOpacity onPress={toggleModalMonth} style={styles.textBox2}>
              <Text style={{fontSize: 26}}>הוצאות עבור חודש </Text>
              <Text style={{fontWeight: 'bold', fontSize: 26, direction: 'rtl'}}>{getMonthName(selectedMonth)}</Text>
              <Text style={{fontSize: 12}}>לחץ על על מנת לבחור חודש אחר</Text>
            </TouchableOpacity>
            <Text style={{fontWeight: 'bold', fontSize: 14, direction: 'rtl',marginTop:5,textAlign:'center'}}> מחירים לאחר שינוי יוצגו בירוק</Text>
            <FlatList
              data={expenses}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
              <Text  style={{fontWeight: 'bold', fontSize: 26, direction: 'rtl',textAlign:'center'}}>
                <ExpensesComparison debts={debts} selectedMonth={selectedMonth} />
              </Text>
          </View>
        </View>
      </Modal>

      <Modal
    visible={isModalVisible}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setIsModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text>סימולציית שינוי ריבית</Text>
        <TextInput
          style={styles.input}
          placeholder="ריבית חדשה (%)"
          keyboardType="numeric"
          value={newInterestRate}
          onChangeText={setNewInterestRate}
        />
        <Button title="חשב" onPress={simulateInterestRateChange} />
        <Button title="סגור" onPress={toggleInterestRateModal} />
        {simulatedLoans.length > 0 && (
          <ScrollView style={styles.simulationResultContainer}>
            {simulatedLoans.map((loan) => (
              <View key={loan.id} style={styles.simulationResultItem}>
                <Text style={{fontWeight:'bold',}}>{loan.name}</Text>
                <Text>תשלום חודשי ישן: {loan.monthlyPay}₪</Text>
                <Text>תשלום חודשי חדש: {loan.newMonthlyPay}₪</Text>
                <Text>{LoansComparison(loan.newMonthlyPay,loan.monthlyPay)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  </Modal>

    <Text style={{fontWeight: 'bold', fontSize: 10, direction: 'rtl',textAlign:'center',marginTop:'auto'}}>
      הסימולטור הפיננסי מספק הערכה כללית של תשלומים עתידיים בהתבסס על הנתונים המוזנים,
       אך אין לראותו כהמלצה פיננסית מקצועית.
       השימוש בסימולטור הוא באחריות המשתמש בלבד,
        והוא אחראי על דיוק הנתונים ולקבל ייעוץ מקצועי במידת הצורך.
    </Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 50,
  },
  textBox: {
    alignItems: 'center',
    direction: 'rtl',
  },
  textBox2: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    marginTop:10,
    alignItems: 'center',
    direction: 'rtl',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  selectMonthText: {
    fontSize: 18,
    color: 'blue',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 18,
    marginVertical: 10,
  },
  expenseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseText: {
    fontSize: 16,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  monthOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: '100%',
  },
  monthText: {
    fontSize: 18,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
  },
  cancelButton: {
    marginTop: 5,
  },
  
  newPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    color:'black',
  },
  simulationResultContainer: {
    marginTop: 10,
    width: '100%',
    },

  simulationResultItem: {
    
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  button: {
    flexDirection: 'column-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
  },
});
