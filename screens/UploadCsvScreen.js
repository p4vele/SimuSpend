import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, TouchableOpacity, Image,ImageBackground,Container, Content, } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { Button, Input} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';

const auth = getAuth();
const db = getFirestore();

export default function UploadCsvScreen() {
    const { user } = useAuthentication();
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const fetchExpenses = async () => {
        try {
          const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
          const expensesSnapshot = await getDocs(expensesCollection);
          const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setExpenses(expensesData);
          console.log("fetch expenses UploadCsvScreen ");
        } catch (error) {
          console.error('Error fetching expenses:', error);
        }
      };
    
      const fetchIncomes = async () => {
        try {
          const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
          const incomesSnapshot = await getDocs(incomesCollection);
          const incomesData = incomesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setIncomes(incomesData);
          console.log("fetch income UploadCsvScreen ");
        } catch (error) {
          console.error('Error fetching incomes:', error);
        }
      };
      useEffect(() => {
    
        if (user) {
          fetchExpenses();
          fetchIncomes();
        }
      }, [user]);

    const uploadCSVDiscount = async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
          });
      
          console.log('Document Picker Result:', result);
      
          if (result.type === 'cancel') {
            console.log('Document picking canceled');
            return;
          }
      
          const fileUri = result.uri || (result.assets && result.assets.length > 0 && result.assets[0].uri);
      
          if (!fileUri || !fileUri.startsWith('file://')) {
            console.warn('Invalid or missing file URI:', fileUri);
            return;
          }
      
          console.log('Document URI:', fileUri);
      
          
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
          if (fileInfo.exists) {
          
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            console.log('Text Document Content:', fileContent);
            
            const parsedResult = Papa.parse(fileContent);
    
            const rowsToProcess = parsedResult.data.slice(1);
    
            // order: ignore, date, description, amount
            rowsToProcess.forEach(async (row) => {
                // Convert date to ISO format (yyyy-mm-dd)
                const dateParts = row[1] ? row[1].split('/') : [];
                const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString();
    
    
                const isExpense = parseFloat(row[3]) < 0;
    
                // Add the expense or income to Firebase
                const collectionPath = isExpense ? 'expenses' : 'incomes';
                const amount = isExpense ? parseFloat(row[3]) * -1 : parseFloat(row[3]); 
                const expensesCollection = collection(db, 'users', user?.uid, collectionPath);
                await addDoc(expensesCollection, {
                    description: row[2] || '',
                    amount: amount || 0,
                    datetime: isoDate || new Date().toISOString(),
                    type: "added from csv",
                });
            });
    
            fetchExpenses();
            fetchIncomes();
        } else {
            console.warn('File does not exist:', fileInfo);
        }
    } catch (err) {
        console.error('Error picking document:', err);
    }
    };


    const uploadCSVvisaCal = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
    
            console.log('Document Picker Result:', result);
    
            if (result.type === 'cancel') {
                console.log('Document picking canceled');
                return;
            }
    
            const fileUri = result.uri || (result.assets && result.assets.length > 0 && result.assets[0].uri);
    
            if (!fileUri || !fileUri.startsWith('file://')) {
                console.warn('Invalid or missing file URI:', fileUri);
                return;
            }
    
            console.log('Document URI:', fileUri);
    
    
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
            if (fileInfo.exists) {
    
                const fileContent = await FileSystem.readAsStringAsync(fileUri);
                console.log('Text Document Content:', fileContent);
    
                const parsedResult = Papa.parse(fileContent);
    
                const rowsToProcess = parsedResult.data.slice(4); // Ignore first 4 rows
                // order: date, description, amount, ignore , ignore ,type , comment
                rowsToProcess.forEach(async (row) => {
                    // Convert date to ISO format (yyyy-mm-dd)
                    const dateParts = row[0] ? row[0].split('/') : [];
                    const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString();

                    const isExpense = parseFloat(row[2]) < 0;

                    // Add the expense to Firebase
                    const collectionPath = 'expenses'; 
                    const amountString = row[3]; 
                    const amount = cleanAndParseAmount(amountString);

                    const expensesCollection = collection(db, 'users', user?.uid, collectionPath);
                    await addDoc(expensesCollection, {
                        date: isoDate || new Date().toISOString(),
                        description: row[1] || '',
                        amount: amount ,
                        type: row[5] || '', 
                        comment: row[6] || '', 
                    });
                });
    
                fetchExpenses();
            } else {
                console.warn('File does not exist:', fileInfo);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };
    const cleanAndParseAmount = (amountString) => {
      // Remove non-numeric characters (like currency symbols and commas)
      const cleanedAmountString = amountString.replace(/[^\d.-]/g, '');
      return parseFloat(cleanedAmountString);
  };
  const uploadCSVvisaMax = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        console.log('Document Picker Result:', result);

        if (result.type === 'cancel') {
            console.log('Document picking canceled');
            return;
        }

        const fileUri = result.uri || (result.assets && result.assets.length > 0 && result.assets[0].uri);

        if (!fileUri || !fileUri.startsWith('file://')) {
            console.warn('Invalid or missing file URI:', fileUri);
            return;
        }

        console.log('Document URI:', fileUri);


        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {

            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            console.log('Text Document Content:', fileContent);

            const parsedResult = Papa.parse(fileContent);

            const rowsToProcess = parsedResult.data.slice(4); // Ignore first 4 rows
            
            rowsToProcess.forEach(async (row) => {
              if (!row[0]) {
                return;
            }
        
               // Validate and parse the amount
               const amountString = row[5].replace(/[^\d.-]/g, ''); 
               const amount = parseFloat(amountString);

               if (!isNaN(amount)) {
                   // Add the expense to Firebase
                   const collectionPath = 'expenses';

                   const expensesCollection = collection(db, 'users', user?.uid, collectionPath);
                   await addDoc(expensesCollection, {
                       date: row[9],
                       description: row[1] || '',
                       amount: amount,
                       type: row[2] || '',
                       comment: row[10] || '',
                   });
               }
           });
            fetchExpenses();
        } else {
            console.warn('File does not exist:', fileInfo);
        }
    } catch (err) {
        console.error('Error picking document:', err);
    }
};

    return (
        <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
            <View style={styles.container}>
                <Text style={styles.text}> בחר את סוג הויזה שלך והעלה קובץ </Text>
                <TouchableOpacity style={styles.buttonContainer} onPress={uploadCSVDiscount}>
                    <MaterialCommunityIcons name="upload" size={24} color="white" />
                    <Text style={styles.buttonText}>דיסקונט</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer} onPress={uploadCSVvisaCal}>
                    <MaterialCommunityIcons name="upload" size={24} color="white" />
                    <Text style={styles.buttonText}>ויזה כאל</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer} onPress={uploadCSVvisaMax}>
                    <MaterialCommunityIcons name="upload" size={24} color="white" />
                    <Text style={styles.buttonText}>ויזה מקס</Text>
                </TouchableOpacity>
                
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
        paddingTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        marginBottom: 20,
        fontSize: 20,
        fontWeight: 'bold',
        color:'white',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
})