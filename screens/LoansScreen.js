import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ImageBackground, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Button, Input ,TextInput} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const db = getFirestore();
const prime = 6.0;
const index= 107.80;
export default function LoansScreen({ navigation }) {
  const { user } = useAuthentication();
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedLoanType, setSelectedLoanType] = useState('משכנתא');
  const [monthlyPay, setMonthlyPay] = useState('');
  
  const [loanType, setLoanType] = useState('fixed');
  const [interestRate, setInterestRate] = useState('');
  const [primeRateAdjustment, setPrimeRateAdjustment] = useState('');
  const [initialRate, setInitialRate] = useState('');
  const [repaymentMethod, setRepaymentMethod] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [months, setMonths] = useState('');
  const [modalVisible, setModalVisible] = useState(false);


  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [chosenDate, setChosenDate] = useState('');
  const [loanToAddNotification, setLoanToAddNotification] = useState(null);

  const fetchLoans = async () => {
    try {
      if (!user) {
        console.log("no user");
        return;
      }

      const loansCollection = collection(db, 'users', user.uid, 'loans');
      const loansSnapshot = await getDocs(loansCollection);

      if (loansSnapshot && loansSnapshot.docs) {
        const loansData = loansSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLoans(loansData);
        console.log("fetch loans - loans screen");
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchLoans();
    };
  
    loadData();
  }, [user]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  const calculateRepayment = (principall,ratee,monthsCountt,loanType) => {
    const principal = parseFloat(principall); // סכום הקרן
    const monthsCount = parseInt(monthsCountt); // מספר החודשים
    let rate;
    if (loanType === 'fixed') {
      rate = parseFloat(ratee) / 100 / 12;
  } else if (loanType === 'prime') {
      rate = (parseFloat(ratee) + prime) / 100 / 12;
  } else if (loanType === 'index') {
      rate = (parseFloat(ratee) + index) / 100 / 12;
  }
        
    let monthlyRepayment = 0;
  
    if (repaymentMethod === 'spitzer') {
      // חישוב לפי שיטת שפיצר
      monthlyRepayment = principal * (rate * Math.pow(1 + rate, monthsCount)) / (Math.pow(1 + rate, monthsCount) - 1);
    } else if (repaymentMethod === 'equal_principal') {
      // חישוב לפי קרן שווה (תשלום חודשי ראשון)
      monthlyRepayment = (principal / monthsCount) + (principal * rate);
    } else if (repaymentMethod === 'grace') {
      // חישוב לפי גרייס (תשלום חודשי בזמן תקופת הגרייס)
      monthlyRepayment = principal * rate;
      // לאחר תקופת הגרייס (הנחה שאין גרייס):
      // monthlyRepayment = principal * (rate * Math.pow(1 + rate, monthsCount)) / (Math.pow(1 + rate, monthsCount) - 1);
    } else if (repaymentMethod === 'balloon') {
      // חישוב לפי בלון (תשלום חודשי על הריבית בלבד)
      monthlyRepayment = principal * rate;
      // בסוף התקופה: 
      // let finalPayment = principal + principal * rate * monthsCount;
    }
  
    return monthlyRepayment.toFixed(2);
  };

  const [amortizationSchedule, setAmortizationSchedule] = useState(null);

  const generateAmortizationSchedule = (principal, ratee, monthsCount, repaymentMethod,monthlyPay) => {
    const schedule = [];
    console.log('rate defult',ratee);
    let rate = ratee/12/100;
    console.log('rate ',rate);
    const principalAmount = parseFloat(principal);
    console.log('principal: ' + principalAmount);
    const months = parseInt(monthsCount);
    console.log('months: ' + months);
    let currentBalance = principalAmount;
    console.log('currentBalance: ' + currentBalance);
    let monthlyPayment = parseFloat(monthlyPay);
    console.log('monthlyPayment: ' + monthlyPayment);
    console.log('repaymentMethod: ', repaymentMethod);
    if (repaymentMethod === 'spitzer') {
     
      for (let i = 0; i < months; i++) {
        const interestPayment = currentBalance * rate;
        const principalPayment = monthlyPayment - interestPayment;
        currentBalance -= principalPayment;
        schedule.push({
          month: i + 1,
          payment: monthlyPayment,
          principalPayment: principalPayment.toFixed(2),
          interestPayment: interestPayment.toFixed(2),
          balance: currentBalance < 0 ? 0 : currentBalance.toFixed(2),
        });
      }
    } else if (repaymentMethod === 'equal_principal') {
      for (let i = 0; i < months; i++) {
        const principalPayment = principalAmount / months;
        const interestPayment = currentBalance * rate;
        monthlyPayment = principalPayment + interestPayment;
        currentBalance -= principalPayment;
        schedule.push({
          month: i + 1,
          payment: monthlyPayment.toFixed(2),
          principalPayment: principalPayment.toFixed(2),
          interestPayment: interestPayment.toFixed(2),
          balance: currentBalance < 0 ? 0 : currentBalance.toFixed(2),
        });
      }
    } else if (repaymentMethod === 'grace') {
      for (let i = 0; i < months; i++) {
        const interestPayment = principalAmount * rate;
        monthlyPayment = interestPayment;
        if (i === months - 1) {
          monthlyPayment += principalAmount;
        }
        schedule.push({
          month: i + 1,
          payment: monthlyPayment.toFixed(2),
          principalPayment: i === months - 1 ? principalAmount.toFixed(2) : '0.00',
          interestPayment: interestPayment.toFixed(2),
          balance: i === months - 1 ? '0.00' : principalAmount.toFixed(2),
        });
      }
    } else if (repaymentMethod === 'balloon') {
      for (let i = 0; i < months; i++) {
        const interestPayment = principalAmount * rate;
        monthlyPayment = interestPayment;
        if (i === months - 1) {
          monthlyPayment += principalAmount;
        }
        schedule.push({
          month: i + 1,
          payment: monthlyPayment.toFixed(2),
          principalPayment: i === months - 1 ? principalAmount.toFixed(2) : '0.00',
          interestPayment: interestPayment.toFixed(2),
          balance: i === months - 1 ? '0.00' : principalAmount.toFixed(2),
        });
      }
    }
    setAmortizationSchedule(schedule);
    setModalVisible(true);
    return schedule;
  };
  
  const addLoan = async () => {
    try {
      const loansCollection = collection(db, 'users', user?.uid, 'loans');
      await addDoc(loansCollection, {
        name: newLoan,
        totalAmount: parseFloat(principalAmount) || 0,
        interest: parseFloat(interestRate) || 0,
        startDate: startDate.toISOString(),
        numMonths: parseInt(months, 10) || 0,
        type: selectedLoanType,
        fixedInterest: loanType === 'fixed' ? true : false,
        primeRateAdjustment: loanType === 'prime' ? parseFloat(primeRateAdjustment) || 0 : null,
        initialRate: loanType === 'index' ? parseFloat(initialRate) || 0 : null,
        repaymentMethod: repaymentMethod || 'spitzer', 
        monthlyPay: loanType === 'fixed' 
        ? calculateRepayment(principalAmount, interestRate, months,loanType) 
        : loanType === 'prime' 
        ? calculateRepayment(principalAmount, primeRateAdjustment, months,loanType) 
        : loanType === 'index' 
        ? calculateRepayment(principalAmount, initialRate, months,loanType) 
        : 0, 
        loanType : loanType,
        //amortizationSchedule: generateAmortizationSchedule(principalAmount, loanType === 'fixed' ? interestRate / 100 / 12 : loanType === 'prime' ? (prime + parseFloat(primeRateAdjustment)) / 100 / 12 : (index + parseFloat(initialRate)) / 100 / 12, months, repaymentMethod),
      });
      setNewLoan('');
      setPrincipalAmount('');
      setStartDate(new Date());
      setMonths('');
      setMonthlyPay('');
      setSelectedLoanType('משכנתא');
      setLoanType('fixed');
      setInterestRate('');
      setPrimeRateAdjustment('');
      setInitialRate('');
      setRepaymentMethod('spitzer');
      fetchLoans();
      toggleModal();
    } catch (error) {
      console.error('Error adding loan:', error);
    }
  };
  

  const deleteLoan = async (loanId) => {
    try {
      const loanDoc = doc(db, 'users', user?.uid, 'loans', loanId);
      await deleteDoc(loanDoc);
      fetchLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  };

  const addNotification = async (loan) => {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; 
  
      const notificationDate = new Date(currentYear, currentMonth, chosenDate);
      
      const notificationsCollection = collection(db, 'users', user?.uid, 'notifications');
      await addDoc(notificationsCollection, {
        name: loan.name,
        description: `תשלום חודשי ${loan.name}`,
        date: notificationDate, 
        amount: loan.monthlyPay,
        isYearly: true,
        reminderDate: '1month',
      });
      console.log('Notification added');
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };
  
  const handleBellPress = (loan) => {
    setChosenDate('');
    setIsDateModalVisible(true);
    setLoanToAddNotification(loan);
  };

  const handleDateSelection = () => {
    addNotification(loanToAddNotification,chosenDate);
    setIsDateModalVisible(false);
  };

  
  
  

  return (
      <View style={styles.container}>
        <View style={styles.textBox}>
          <Text style={{fontWeight:'bold',fontSize:26,direction:'rtl'}}>במסך זה תוכל להוסיף הלוואות  </Text>
          <Text style={{fontWeight:'bold',fontSize:26,direction:'rtl'}}>קיימות </Text>
          <Text></Text>
          <Text>לחיצה על הפעמון תייצר תזכורת עבור תשלום ההלוואה</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleModal}>
            <Text style={styles.buttonText}>  הוסף הלוואה    </Text> 
            <MaterialCommunityIcons name="plus-circle" size={24} color="#007BFF" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>הוסף הלוואה</Text>
                <ScrollView style={styles.inputContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Input
                    placeholder="שם הלוואה"
                    value={newLoan}
                    onChangeText={(text) => setNewLoan(text)}
                  />
                  <Input
                    placeholder="סכום קרן"
                    value={principalAmount}
                    onChangeText={(text) => setPrincipalAmount(text)}
                    keyboardType="numeric"
                  />
                  <View style={styles.datePicker}>
                    <Text style={styles.text}>תאריך התחלה</Text>
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => setStartDate(date || new Date())}
                    />
                  </View>
                
                  <Input
                    placeholder="הזן את מספר החודשים"
                    keyboardType="numeric"
                    value={months}
                    onChangeText={setMonths}
                    style={styles.input}
                  />
                  <Text style={styles.text}>סוג מסלול:</Text>
                  <Picker
                    selectedValue={loanType}
                    onValueChange={(itemValue) => setLoanType(itemValue)}
                  >
                    <Picker.Item label="ריבית קבועה ללא הצמדה" value="fixed" />
                    <Picker.Item label="ריבית צמודה למדד פריים" value="prime" />
                    <Picker.Item label="ריבית צמודת מדד" value="index" />
                  </Picker>
                  {loanType === 'fixed' && (
                    <View>
                      <Input
                        placeholder="הזן את אחוז הריבית"
                        keyboardType="numeric"
                        value={interestRate}
                        onChangeText={setInterestRate}
                        style={styles.input}
                      />
                    </View>
                  )}
                  {loanType === 'prime' && (
                    <View>
                      <Input
                        placeholder=" הזן את הריבית הנוספת לפריים"
                        keyboardType="numeric"
                        value={primeRateAdjustment}
                        onChangeText={setPrimeRateAdjustment}
                        style={styles.input}
                      />
                    </View>
                  )}
                  {loanType === 'index' && (
                    <View>
                      <Input
                        placeholder="הזן את הריבית התחלתית"
                        keyboardType="numeric"
                        value={initialRate}
                        onChangeText={setInitialRate}
                        style={styles.input}
                      />
                    </View>
                  )}
                  <Text style={styles.text}>סוג שיטה:</Text>
                  <Picker
                    selectedValue={repaymentMethod}
                    onValueChange={(itemValue) => setRepaymentMethod(itemValue)}
                  >
                    <Picker.Item label="שפיצר" value="spitzer" />
                    <Picker.Item label="קרן שווה" value="equal_principal" />
                    <Picker.Item label="גרייס" value="grace" />
                    <Picker.Item label="בלון" value="balloon" />
                  </Picker>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>סוג הלוואה</Text>
                    <Picker
                      selectedValue={selectedLoanType}
                      onValueChange={(itemValue) => setSelectedLoanType(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="משכנתא" value="משכנתא" />
                      <Picker.Item label="הלוואת רכב" value="הלוואת רכב" />
                      <Picker.Item label="הלוואת סטודנטים" value="הלוואת סטודנטים" />
                      <Picker.Item label="הלוואת אשראי" value="הלוואת אשראי" />
                      <Picker.Item label="אחר" value="אחר" />
                    </Picker>
                  </View>
                </ScrollView>
                <View style={styles.buttonContainer}>
                  <Button title="הוספה" onPress={addLoan} />
                  <Button title="ביטול" type="outline" onPress={toggleModal} />
        
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>


        <Text style={styles.entryDescription}>{"ריבית פריים עדכנית : " + prime + "%"} </Text>
        <Text style={styles.entryDescription}>{"מדד מעודכן : " + index }</Text>            
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            const formattedStartDate = startDate.toLocaleDateString('he-IL');
            const formattedEndDate = endDate.toLocaleDateString('he-IL');
            
            return (
              <TouchableOpacity style={styles.entryGridItem}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryDescription}>{item.name}</Text>
                  <Text style={styles.entryAmount}>סכום כולל: {item.totalAmount}</Text>
                  <Text style={styles.entryAmount}>
                    ריבית: {item.loanType === 'prime'
                      ? item.primeRateAdjustment + "% + פריים"
                      : item.loanType === 'index'
                      ? item.initialRate +"%"
                      : item.interest+"%"}
                  </Text>
                  <Text style={styles.entryAmount}>תאריך התחלה: {formattedStartDate}</Text>
                  <Text style={styles.entryAmount}>מספר חודשים: {item.numMonths}</Text>
                  <Text style={styles.entryAmount}>סוג: {item.type}</Text>
                  <Text style={styles.entryAmount}>שיטת תשלום: {item.repaymentMethod}</Text>
                  <Text style={styles.entryAmount}>מסלול : {item.loanType}</Text>
                  <Text style={styles.entryAmount}>תשלום חודשי: {item.monthlyPay}</Text>
                  <TouchableOpacity style={styles.bellButton}
                    onPress={() => {
                      let interestRate;
                      if (item.loanType === 'fixed') {
                        interestRate = item.interest; 
                      } else if (item.loanType === 'prime') {
                        interestRate = item.primeRateAdjustment + prime; 
                      } else if (item.loanType === 'index') {
                        interestRate = item.initialRate + index;
                      }
                
                    generateAmortizationSchedule(item.totalAmount, interestRate, item.numMonths, item.repaymentMethod, item.monthlyPay);
                    }}
                  >
                    <Text style={styles.entryDescription}>לחץ כאן כדי לראות לוח סילוקין </Text>
                  </TouchableOpacity>
                </View>
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(!modalVisible);
                  }}
                >
                  <View style={styles.modalContainer2}>
                    <View style={styles.modalContent2}>
                      <ScrollView>
                        <Text style={styles.modalTitle}>לוח סילוקין</Text>
                        <View style={{ marginBottom: 10 }}>
                         
                          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={{ textAlign:'center',fontWeight: 'bold', flex: 1 }}>חודש</Text>
                            <Text style={{ textAlign:'center',fontWeight: 'bold', flex: 1 }}>תשלום  קרן</Text>
                            <Text style={{ textAlign:'center',fontWeight: 'bold', flex: 1 }}>תשלום ריבית</Text>
                            <Text style={{ textAlign:'center',fontWeight: 'bold', flex: 1 }}>תשלום כולל</Text>
                            <Text style={{ textAlign:'center',fontWeight: 'bold', flex: 1 }}>יתרה</Text>
                          </View>

                          {amortizationSchedule && amortizationSchedule.map((entry, index) => (
                            <View key={index} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 5 }}>
                              <Text style={{ textAlign:'center', flex: 1 }}>חודש {entry.month}</Text>
                              <Text style={{ textAlign:'center', flex: 1 }}>{entry.principalPayment}</Text>
                              <Text style={{ textAlign:'center', flex: 1 }}>{entry.interestPayment}</Text>
                              <Text style={{ textAlign:'center', flex: 1 }}>{entry.payment}</Text>
                              <Text style={{ textAlign:'center', flex: 1 }}>{entry.balance}</Text>
                            </View>
                          ))}
                        </View>


                      </ScrollView>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.closeButtonText}>סגור</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
                <TouchableOpacity style={styles.bellButton} onPress={() => handleBellPress(item)}>
                    <FontAwesome name="bell" size={24} color="blue" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => deleteLoan(item.id)}
                  style={styles.deleteButton}
                >
                  <FontAwesome name="times" size={15} color="red" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
                

            <Modal visible={isDateModalVisible} animationType="slide" transparent={true}>
            <View style={styles.dateModalContainer}>
                <View style={styles.dateModalContent}>
                <Text style={styles.dateModalTitle}>בחר יום תשלום (1-31)</Text>
                <View style={styles.dayButtonsContainer}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                        key={day}
                        style={[
                        styles.dayButton,
                        chosenDate === day.toString() && styles.selectedDayButton,
                        ]}
                        onPress={() => setChosenDate(day.toString())}
                    >
                        <Text style={styles.dayButtonText}>{day}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.dateModalButtons}>
                    <Button
                    title="אישור"
                    onPress={handleDateSelection}
                    buttonStyle={styles.dateModalButton}
                    />
                    <Button
                    title="ביטול"
                    onPress={() => setIsDateModalVisible(false)}
                    buttonStyle={styles.dateModalCancelButton}
                    />
                </View>
                </View>
            </View>
            </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 16,
    marginTop: 50,
  },
  entryGridItem: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  entryInfo: {
    flex: 1,
    alignSelf: 'center',
    
  },
  entryDescription: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
     
  },
  entryAmount: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#888',  
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#007BFF',
    fontSize: 16,
    marginLeft: 5,
  },
  text:{
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#888',    
},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: '100%',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    height: '93%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  pickerContainer: {
    
   
  },
  pickerLabel: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#888',
  },
  picker: {
    height: 'auto',
    width: '100%',
    overflow: 'hidden',
  },
  pickerItem: {
    height: 50,
  },
  datePicker: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  dateModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dateModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '50%',
  },
  dateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  dayButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    margin: 5,
  },
  selectedDayButton: {
    backgroundColor: 'lightblue', 
  },
  dayButtonText: {
    color: 'white',
    fontSize: 16,
  },
  textBox: {
     
    alignItems: 'center',
    direction:'rtl',
 },


 //silukin
 modalContainer2: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
modalContent2: {
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 20,
  width: '90%',
  maxHeight: '80%',
},

closeButtonText: {
  color: 'blue',
  fontSize: 16,
  fontWeight: 'bold',
}
});
