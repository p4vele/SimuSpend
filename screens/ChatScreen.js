import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Button, ScrollView, StyleSheet,KeyboardAvoidingView,TouchableOpacity ,ImageBackground } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 
import { FontAwesome } from '@expo/vector-icons';

const db = getFirestore();

const ChatScreen = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { user } = useAuthentication();
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState([]);
  const inputRef = useRef(null); 
  const scrollViewRef = useRef(null);

  useEffect(() => {
    setChatMessages([
      { role: 'assistant', content: "שלום! אני פה כדי לעזור לך עם התקציב וההוצאות שלך. \nשאלו אותי כל שאלה הקשורה לפיננסים או בחרו מן האופציות להודעות מוכנות" }
    ]);
    inputRef.current.focus();
  }, []);
  useEffect(() => {
    scrollViewRef.current.scrollToEnd({ animated: true });
  }, [chatMessages]);

  const sendMessage = async () => {
    try {
      const userMessage = { role: 'user', content: message };
      setChatMessages((prevMessages) => [...prevMessages, userMessage]);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: "You are a financial assistant. Provide advice on budgeting, investing, etc." },
            userMessage,
          ],
        },
        {
          headers: {
            Authorization: `Bearer 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`,
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantMessage = { role: 'assistant', content: response.data.choices[0].message.content };
      setChatMessages((prevMessages) => [...prevMessages, assistantMessage]);

      setMessage('');

    } catch (error) {
      console.error('Error sending message to ChatGPT:', error.response ? error.response.data : error.message);
    }
  };

  const fetchExpenses = async () => {
    try {
      if (!user) {
        console.log("no user");
        return;
      }

      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      const expensesSnapshot = await getDocs(expensesCollection);

      if (expensesSnapshot && expensesSnapshot.docs) {
        const expensesData = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExpenses(expensesData);
        const newData = await calculateChartData(expenses);
        setChartData(newData);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];

  const calculateChartData = (expensesData) => {
    const typesData = expensesData.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
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

  const setPredefinedMessageExpenses = async () => {
    try {
      await fetchExpenses();
      const chartData =  await calculateChartData(expenses);
      chartMessage = chartData.map(item => `${item.name}: ₪${item.amount}`).join('\n');
      chartMessage += '\n התבסס על ההוצאות שהוזנו, ותן לי טיפים ספציפיים איך אני יכול לחסוך יותר כסף, בהתאם להוצאות שלי.\n';
      setMessage(chartMessage);
      
    } catch (error) {
      console.error('Error setting predefined message:', error);
    }
  };
  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={'padding'}
      keyboardVerticalOffset={20 } 
    >
      <ScrollView ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContentContainer}>
        {chatMessages.map((msg, index) => (
          <View key={index} style={msg.role === 'assistant' ? styles.assistantContainer : styles.userContainer}>
            <Text style={msg.role === 'assistant' ? [styles.assistantMessage, styles.boldRole] : styles.userMessage}>
              {msg.role === 'user' ? 'אני: ' : 'בוט פיננסי: '}{msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.predefinedMessageButton}>
      <TouchableOpacity onPress={setPredefinedMessageExpenses}>
        <MaterialCommunityIcons name="trending-down" size={24} color="#007bff" style={styles.icon} />
        <Text style={styles.buttonTitle}>קריאת הוצאות</Text>
      </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
         ref={inputRef}
          style={styles.input}
          multiline={true}
          placeholder="Type your message..."
          value={message}
          onChangeText={(text) => setMessage(text)}
        />
        <TouchableOpacity onPress={sendMessage}>
          <MaterialCommunityIcons name="send" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </ImageBackground>
    
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    marginTop:25,
  },
  chatContainer: {
    flex: 1,
  },
  chatContentContainer: {
    paddingVertical: 10,
    
  },
  userContainer: {
    alignSelf: 'flex-end', 
    marginRight: 10, 
    marginBottom: 5, 
  },
  assistantContainer: {
    alignSelf: 'flex-start', 
    marginLeft: 10, 
    marginBottom: 5, 
  },
  userMessage: {
    color: '#000',
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginBottom: 8,
    textAlign: 'right',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc', 
    overflow: 'hidden',
    
  },
  assistantMessage: {
    color: '#fff',
    backgroundColor: '#4caf50',
    padding: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
    textAlign: 'right',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc', 
    overflow: 'hidden',
  },
  predefinedMessageButton: {
    marginBottom: 10,
    alignContent:'center',
    alignItems:'center',
    
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxHeight:'80%',
    height:'auto',
    
  },
  input: {
    flex: 1,
    height: 'auto',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  icon:{
    marginLeft:25,
  },
  boldRole: {
    fontWeight: 'bold', 
  },
  buttonTitle:{
    color:'white',
  },
});

export default ChatScreen;