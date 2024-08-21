import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { Picker } from '@react-native-picker/picker';
import * as XLSX from 'xlsx';

const auth = getAuth();
const db = getFirestore();

export default function UploadCsvScreen() {
    const { user } = useAuthentication();
    const [expenses, setExpenses] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [selectedCreditCard, setSelectedCreditCard] = useState('');

    const fetchExpenses = async () => {
        try {
            const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
            const expensesSnapshot = await getDocs(expensesCollection);
            const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setExpenses(expensesData);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
       
    };

   

    const fetchCreditCards = async () => {
        try {
            const creditCardsCollection = collection(db, 'users', user?.uid, 'creditCards');
            const creditCardsSnapshot = await getDocs(creditCardsCollection);
            const creditCardsData = creditCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setCreditCards(creditCardsData);
        } catch (error) {
            console.error('Error fetching credit cards:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchExpenses();
            fetchCreditCards();
        }
    }, [user]);

    const uploadCSV = async (uploadFunction) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
    
            if (result.type === 'cancel') {
                console.log('Document picking canceled');
                return;
            }
    
            const fileUri = result.uri || (result.assets && result.assets.length > 0 && result.assets[0].uri);
    
            if (!fileUri || !fileUri.startsWith('file://')) {
                console.error('Invalid file URI');
                return;
            }
    
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
            if (!fileInfo.exists) {
                console.error('File does not exist');
                return;
            }
    
            const fileExtension = fileUri.split('.').pop().toLowerCase();
    
            let fileContent;
            if (fileExtension === 'csv') {
                
                fileContent = await FileSystem.readAsStringAsync(fileUri);
                const parsedResult = Papa.parse(fileContent);
                uploadFunction(parsedResult.data);
            } else if (fileExtension === 'xlsx') {
                
                const arrayBuffer = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
                const data = Uint8Array.from(atob(arrayBuffer), c => c.charCodeAt(0));
                const workbook = XLSX.read(data, { type: 'array' });
    
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const csvData = XLSX.utils.sheet_to_csv(worksheet);
    
                const parsedResult = Papa.parse(csvData);
                uploadFunction(parsedResult.data);
            } else {
                console.error('Unsupported file type');
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    

    const uploadCSVvisaCal = async  (data) => {
        try {
            const rowsToProcess = data.slice(4); 
            for (let i = 0; i < rowsToProcess.length; i++) {
                const row = rowsToProcess[i];
            
                if (!row[0]) {
                    break;
                }
            
                const dateParts = row[0].split('/');
                const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString();
                const amountString = row[3];
                const amount = cleanAndParseAmount(amountString);
                const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
            
                await addDoc(expensesCollection, {
                    date: isoDate || new Date().toISOString(),
                    description: row[1] || '',
                    amount: amount,
                    type: row[5] || '',
                    comment: row[6] || '',
                    creditCard: selectedCreditCard,
                });
            }
            
            fetchExpenses();
            Alert.alert('קובץ הועלה בהצלחה', 'העלה קובץ נוסף או עבור למסך הוצאות לעיון ');
        } catch (error) {
            console.error('Error uploading CSV data:', error);
            Alert.alert('שגיאה', 'נסה שוב');
        }
    };

    const uploadCSVvisaMax = async (data) => {
        try{
            const rowsToProcess = data.slice(4); 
            for (let i = 0; i < rowsToProcess.length; i++) {
                const row = rowsToProcess[i];
            
                if (!row[0]) {
                    break;
                }

                const amountString = row[5].replace(/[^\d.-]/g, '');
                const amount = parseFloat(amountString);
            
                    
                    const expensesCollection = collection(db, 'users', user?.uid, 'expenses');
                    await addDoc(expensesCollection, {
                        date: row[9],
                        description: row[1] || '',
                        amount: amount,
                        type: row[2] || '',
                        comment: row[10] || '',
                        creditCard: selectedCreditCard,
                    });
                
            }
            fetchExpenses();
            Alert.alert('קובץ הועלה בהצלחה', 'העלה קובץ נוסף או עבור למסך הוצאות לעיון ');
        } catch (error) {
            console.error('Error uploading CSV data:', error);
            Alert.alert('שגיאה', 'נסה שוב');
        }
    };

    const cleanAndParseAmount = (amountString) => {
        const cleanedAmountString = amountString.replace(/[^\d.-]/g, '');
        return parseFloat(cleanedAmountString);
    };

    return (
            <View style={styles.container}>
                <Text style={styles.text}>בחר את סוג הויזה שלך והעלה קובץ</Text>
                
                <Picker
                    selectedValue={selectedCreditCard}
                    onValueChange={(itemValue) => setSelectedCreditCard(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="בחר כרטיס אשראי" value="" />
                    {creditCards.map((card) => (
                        <Picker.Item key={card.id} label={card.nickname +"-"+ card.last4Digits} value={card.id} />
                    ))}
                </Picker>

                
                <TouchableOpacity style={styles.buttonContainer} onPress={() => uploadCSV(uploadCSVvisaCal)}>
                    <MaterialCommunityIcons name="upload" size={24} color="white" />
                    <Text style={styles.buttonText}>ויזה כאל</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonContainer} onPress={() => uploadCSV(uploadCSVvisaMax)}>
                    <MaterialCommunityIcons name="upload" size={24} color="white" />
                    <Text style={styles.buttonText}>ויזה מקס</Text>
                </TouchableOpacity>
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
        paddingTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        marginBottom: 20,
        fontSize: 20,
        fontWeight: 'bold',
    },
    picker: {
        width: '80%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 10,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
});
