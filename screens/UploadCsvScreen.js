import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { Picker } from '@react-native-picker/picker';

const auth = getAuth();
const db = getFirestore();

export default function UploadCsvScreen() {
    const { user } = useAuthentication();
    const [incomes, setIncomes] = useState([]);
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

    const fetchIncomes = async () => {
        try {
            const incomesCollection = collection(db, 'users', user?.uid, 'incomes');
            const incomesSnapshot = await getDocs(incomesCollection);
            const incomesData = incomesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setIncomes(incomesData);
        } catch (error) {
            console.error('Error fetching incomes:', error);
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
        
            fetchExpenses();
            fetchIncomes();
            fetchCreditCards();
        
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
                console.warn('Invalid or missing file URI:', fileUri);
                return;
            }

            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (fileInfo.exists) {
                const fileContent = await FileSystem.readAsStringAsync(fileUri);
                const parsedResult = Papa.parse(fileContent);
                uploadFunction(parsedResult.data);
            } else {
                console.warn('File does not exist:', fileInfo);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const uploadCSVDiscount = (data) => {
        const rowsToProcess = data.slice(1);
        rowsToProcess.forEach(async (row) => {
            const dateParts = row[1] ? row[1].split('/') : [];
            const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString();
            const isExpense = parseFloat(row[3]) < 0;
            const collectionPath = isExpense ? 'expenses' : 'incomes';
            const amount = isExpense ? parseFloat(row[3]) * -1 : parseFloat(row[3]);
            const expensesCollection = collection(db, 'users', user?.uid, collectionPath);
            await addDoc(expensesCollection, {
                description: row[2] || '',
                amount: amount || 0,
                datetime: isoDate || new Date().toISOString(),
                type: "added from csv",
                creditCard: selectedCreditCard,
            });
        });
        fetchExpenses();
        fetchIncomes();
    };

    const uploadCSVvisaCal = (data) => {
        const rowsToProcess = data.slice(4); // Ignore first 4 rows
        rowsToProcess.forEach(async (row) => {
            const dateParts = row[0] ? row[0].split('/') : [];
            const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString();
            const isExpense = parseFloat(row[2]) < 0;
            const collectionPath = 'expenses';
            const amountString = row[3];
            const amount = cleanAndParseAmount(amountString);
            const expensesCollection = collection(db, 'users', user?.uid, collectionPath);
            await addDoc(expensesCollection, {
                date: isoDate || new Date().toISOString(),
                description: row[1] || '',
                amount: amount,
                type: row[5] || '',
                comment: row[6] || '',
                creditCard: selectedCreditCard,
            });
        });
        fetchExpenses();
    };

    const uploadCSVvisaMax = (data) => {
        const rowsToProcess = data.slice(4); // Ignore first 4 rows
        rowsToProcess.forEach(async (row) => {
            if (!row[0]) {
                return;
            }
            const amountString = row[5].replace(/[^\d.-]/g, '');
            const amount = parseFloat(amountString);
            if (!isNaN(amount)) {
                const collectionPath = 'expenses';
                const expensesCollection = collection(db, 'users', user?.uid, collectionPath);
                await addDoc(expensesCollection, {
                    date: row[9],
                    description: row[1] || '',
                    amount: amount,
                    type: row[2] || '',
                    comment: row[10] || '',
                    creditCard: selectedCreditCard,
                });
            }
        });
        fetchExpenses();
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

                <TouchableOpacity style={styles.buttonContainer} onPress={() => uploadCSV(uploadCSVDiscount)}>
                    <MaterialCommunityIcons name="upload" size={24} color="white" />
                    <Text style={styles.buttonText}>דיסקונט</Text>
                </TouchableOpacity>
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
