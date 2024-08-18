import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Modal, TextInput, Button, TouchableWithoutFeedback, Keyboard,ScrollView  } from 'react-native';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { useFocusEffect } from '@react-navigation/native';
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
const prime = 6.0;
const index= 107.80;
export default function SimulationsScreen() {
  const { user } = useAuthentication();
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [modalVisible, setModalVisible] = useState(false);
  const [VATmodalVisible, setVATModalVisible] = useState(false);
  const [currentCPI, setCurrentCPI] = useState('');
  const [simulatedCPI, setSimulatedCPI] = useState('');
  const [debts, setDebts] = useState(0);

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

  const calculateRepayment = (principal, rate, monthsCount, loanType, repaymentMethod, newprimeadd, startDate) => {
    const principalAmount = parseFloat(principal);
    const numberOfMonths = parseInt(monthsCount);
    const currentDate = new Date();
    const loanStartDate = new Date(startDate);

    
    const monthsPaid = Math.floor((currentDate - loanStartDate) / (1000 * 60 * 60 * 24 * 30));
    const remainingMonths = numberOfMonths - monthsPaid;

   
    if (remainingMonths <= 0) {
        return { monthlyRepayment: 0, schedule: [] ,remainingMonths :0};
    }

   
    let remainingPrincipal = principalAmount;

    if (repaymentMethod === 'spitzer') {
       
        const effectiveRate = (parseFloat(rate) + prime + parseFloat(newprimeadd)) / 100 / 12;

        const originalMonthlyRepayment = principalAmount * (effectiveRate * Math.pow(1 + effectiveRate, numberOfMonths)) / (Math.pow(1 + effectiveRate, numberOfMonths) - 1);

        for (let i = 0; i < monthsPaid; i++) {
            const interestPaid = remainingPrincipal * effectiveRate;
            const principalPaid = originalMonthlyRepayment - interestPaid;
            remainingPrincipal -= principalPaid;
        }
    }

    let monthlyRepayment = 0;
    const schedule = [];
    const effectiveRate = (parseFloat(rate) + prime + parseFloat(newprimeadd)) / 100 / 12;

    if (repaymentMethod === 'spitzer') {
        monthlyRepayment = remainingPrincipal * (effectiveRate * Math.pow(1 + effectiveRate, remainingMonths)) / (Math.pow(1 + effectiveRate, remainingMonths) - 1);

        for (let i = monthsPaid; i < monthsPaid+remainingMonths; i++) {
            const interestPaid = remainingPrincipal * effectiveRate;
            const principalPaid = monthlyRepayment - interestPaid;
            remainingPrincipal -= principalPaid;
            schedule.push({
                month: i + 1,
                monthlyRepayment: monthlyRepayment.toFixed(2),
                principalPaid: principalPaid.toFixed(2),
                interestPaid: interestPaid.toFixed(2),
                remainingPrincipal: remainingPrincipal.toFixed(2)
            });
        }
    } else if (repaymentMethod === 'equal_principal') {
        const principalPayment = remainingPrincipal / remainingMonths;

        for (let i = monthsPaid; i < monthsPaid+remainingMonths; i++) {
            const interestPayment = remainingPrincipal * effectiveRate;
            monthlyRepayment = principalPayment + interestPayment;
            remainingPrincipal -= principalPayment;
            schedule.push({
                month: i + 1,
                monthlyRepayment: monthlyRepayment.toFixed(2),
                principalPaid: principalPayment.toFixed(2),
                interestPaid: interestPayment.toFixed(2),
                remainingPrincipal: remainingPrincipal.toFixed(2)
            });
           
        }
    }
    

    return {
        monthlyRepayment: monthlyRepayment.toFixed(2),
        schedule: schedule,
        remainingMonths: remainingMonths
    };
};

const simulateInterestRateChange = () => {
  const updatedLoans = loans.map((loan) => {
      const { monthlyRepayment, schedule ,remainingMonths} = calculateRepayment(
          loan.totalAmount,
          loan.primeRateAdjustment,
          loan.numMonths,
          loan.loanType, 
          loan.repaymentMethod,
          newInterestRate,
          loan.startDate
      );

      return {
          ...loan,
          newMonthlyPay: monthlyRepayment, 
          paymentSchedule: schedule, 
          remainingMonths: remainingMonths    
      };
  });

  setSimulatedLoans(updatedLoans);
  setIsModalVisible(true);
};


  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);
  };

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
  const LoansComparison = (newPayment, oldPayment,remainingMonths) => {
    const result = oldPayment - newPayment;
    const textColor = result > 0 ? 'green' : 'red';
    const formattedDebts = result < 0 ? Math.abs(result).toFixed(2) : result.toFixed(2);
    const total = remainingMonths * result;
    return (
      
        <Text style={{ fontWeight: 'bold' }}>
          {'\n'}
          {result > 0 ? 'ירידה של ' : 'עליה של '}
          <Text style={[styles.text, { color: textColor }]}>
            כ{formattedDebts}₪  
          </Text>
          <Text> בתשלום החודשי {'\n'} </Text>
          <Text> ושל </Text>
          <Text style={[styles.text, { color: textColor }]}> כ{Math.abs(total).toFixed(2)}₪</Text>
          <Text>  בסך הכל  </Text>
          <Text> {'\n'} ביחס לתשלום החודשי הישן</Text>
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
          <Text style={{fontSize: 30, marginBottom: 5,marginRight:5,color:'#007BFF'}}>סימולציית שינוי ריבית פריים</Text>
          <MaterialCommunityIcons name="trending-up" size={30} color="#007BFF" />
        </TouchableOpacity>
     </View>
      
      
    

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
              placeholder="הזן מעמ סימולציה (%)"
              keyboardType="numeric"
              value={simulatedCPI}
              onChangeText={setSimulatedCPI}
              placeholderTextColor="black"
            />
            
            <View style={styles.dropdownContainer}>
            <Text style={{marginVertical:15 , marginLeft:15}}>בחר חודש:</Text>
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
          <Button title="חשב" onPress={calculateFinancialIndicators} style={styles.saveButton} />
          <Button title="סגור" type="outline" onPress={toggleVATModal} style={styles.cancelButton}/>
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
            <Text>סימולציית שינוי ריבית פריים</Text>
            <TextInput
              style={styles.input}
              placeholder="הזן תוספת לריבית פריים חדשה (%)"
              keyboardType="numeric"
              value={newInterestRate}
              onChangeText={setNewInterestRate}
              placeholderTextColor="black"

            />
            <Button title="חשב" onPress={() => {simulateInterestRateChange();  Keyboard.dismiss();}} />
            <Button title="סגור" onPress={toggleInterestRateModal} />
            {simulatedLoans.length > 0 && (
              <ScrollView style={styles.simulationResultContainer}>
                {simulatedLoans
                  .filter((loan) => loan.loanType === 'prime')
                  .map((loan) => (
                    <View key={loan.id} style={styles.simulationResultItem}>
                      <Text style={{ fontWeight: 'bold' }}>{loan.name}</Text>
                      <Text>תשלום חודשי ישן: {loan.monthlyPay}₪</Text>
                      <Text>תשלום חודשי חדש: {loan.newMonthlyPay}₪</Text>
                      <Text style={{textAlign:'center'}}>{LoansComparison(loan.newMonthlyPay, loan.monthlyPay,loan.remainingMonths)}</Text>

                      <Text style={{ marginBottom: 10,marginTop: 10  }} >לוח סילוקין:</Text>
                      
                        
                        <View style={{ flexDirection: 'row-reverse',  marginBottom: 5 }}>
                          <Text style={{ textAlign: 'center', fontWeight: 'bold', flex: 1 }}>חודש</Text>
                          <Text style={{ textAlign: 'center', fontWeight: 'bold', flex: 2 }}>תשלום קרן</Text>
                          <Text style={{ textAlign: 'center', fontWeight: 'bold', flex: 2 }}>תשלום ריבית</Text>
                          <Text style={{ textAlign: 'center', fontWeight: 'bold', flex: 2 }}>תשלום כולל</Text>
                          <Text style={{ textAlign: 'center', fontWeight: 'bold', flex: 2 }}>יתרה</Text>
                        </View>

                        
                        {loan.paymentSchedule && loan.paymentSchedule.map((payment, index) => (
                          <View key={index} style={{ flexDirection: 'row-reverse', marginBottom: 5 }}>
                            <Text style={{ textAlign: 'center', flex: 1 }}> {payment.month}</Text>
                            <Text style={{ textAlign: 'center', flex: 2 }}>{payment.principalPaid}₪</Text>
                            <Text style={{ textAlign: 'center', flex: 2 }}>{payment.interestPaid}₪</Text>
                            <Text style={{ textAlign: 'center', flex: 2 }}>{payment.monthlyRepayment}₪</Text>
                            <Text style={{ textAlign: 'center', flex: 2 }}>{payment.remainingPrincipal}₪</Text>
                          </View>
                        ))}
                      
                  
                      
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
    width: '90%',
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
  dropdownContainer:{
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    
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