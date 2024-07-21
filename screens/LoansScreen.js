import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ImageBackground, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { Button, Input } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const db = getFirestore();

export default function LoansScreen({ navigation }) {
  const { user } = useAuthentication();
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [numMonths, setNumMonths] = useState('');
  const [selectedLoanType, setSelectedLoanType] = useState('משכנתא');
  const [provider, setProvider] = useState('');
  const [monthlyPay, setMonthlyPay] = useState('');
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

  const addLoan = async () => {
    try {
      const loansCollection = collection(db, 'users', user?.uid, 'loans');
      await addDoc(loansCollection, {
        name: newLoan,
        totalAmount: parseFloat(totalAmount) || 0,
        interest: parseFloat(interest) || 0,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        numMonths: parseInt(numMonths, 10) || 0,
        type: selectedLoanType,
        provider,
        monthlyPay: parseFloat(monthlyPay) || 0,
      });
      setNewLoan('');
      setTotalAmount('');
      setInterest('');
      setStartDate(new Date());
      setEndDate(new Date());
      setNumMonths('');
      setProvider('');
      setMonthlyPay('');
      setSelectedLoanType('משכנתא');
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
        <Modal visible={isModalVisible} animationType="slide" transparent={true} keyboardShouldPersistTaps='handled'>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>הוסף הלוואה</Text>
                <ScrollView style={styles.inputContainer}>
                  <Input
                    placeholder="שם הלוואה"
                    value={newLoan}
                    onChangeText={(text) => setNewLoan(text)}
                  />
                  <Input
                    placeholder="סכום כולל"
                    value={totalAmount}
                    onChangeText={(text) => setTotalAmount(text)}
                    keyboardType="numeric"
                  />
                  <Input
                    placeholder="ריבית"
                    value={interest}
                    onChangeText={(text) => setInterest(text)}
                    keyboardType="numeric"
                  />
                  <View style={styles.datePicker}>
                    <Text style={styles.text}>תאריך התחלה</Text>
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => setStartDate(date)}
                    />
                  </View>
                  <View style={styles.datePicker}>
                    <Text style={styles.text}>תאריך סיום צפוי</Text>
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => setEndDate(date)}
                    />
                  </View>
                  <Input
                    placeholder="מספר חודשים"
                    value={numMonths}
                    onChangeText={(text) => setNumMonths(text)}
                    keyboardType="numeric"
                  />
                  <Input
                    placeholder="שם הספק"
                    value={provider}
                    onChangeText={(text) => setProvider(text)}
                  />
                  <Input
                    placeholder="סכום חודשי"
                    value={monthlyPay}
                    onChangeText={(text) => setMonthlyPay(text)}
                    keyboardType="numeric"
                  />
                </ScrollView>
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
                <View style={styles.buttonContainer}>
                  <Button title="הוספה" onPress={addLoan} />
                  <Button title="ביטול" type="outline" onPress={toggleModal} />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

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
                  <Text style={styles.entryAmount}>ריבית: {item.interest}%</Text>
                  <Text style={styles.entryAmount}>תאריך התחלה: {formattedStartDate}</Text>
                  <Text style={styles.entryAmount}>תאריך סיום: {formattedEndDate}</Text>
                  <Text style={styles.entryAmount}>מספר חודשים: {item.numMonths}</Text>
                  <Text style={styles.entryAmount}>סוג: {item.type}</Text>
                  <Text style={styles.entryAmount}>ספק: {item.provider}</Text>
                  <Text style={styles.entryAmount}>תשלום חודשי: {item.monthlyPay}</Text>
                </View>

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
    padding: 10,
    
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
    marginBottom: 20,
    borderRadius: 5,
    overflow: 'hidden',
  },
  pickerLabel: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#888',
  },
  picker: {
    height: 50,
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
});
