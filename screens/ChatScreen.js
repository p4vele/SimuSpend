import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Button, ScrollView, StyleSheet,KeyboardAvoidingView,Platform  } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

const db = getFirestore();

const ChatScreen = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { user } = useAuthentication();
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState([]);
  const inputRef = useRef(null); 

  useEffect(() => {
    
    inputRef.current.focus();
  }, []);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={'padding'}
      keyboardVerticalOffset={100 } 
    >
      <ScrollView style={styles.chatContainer}>
        {chatMessages.map((msg, index) => (
          <Text key={index} style={msg.role === 'assistant' ? styles.assistantMessage : styles.userMessage}>
            {msg.role === 'user' ? 'User: ' : 'Assistant: '}{msg.content}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.predefinedMessageButton}>
        <Button title="קריאת הוצאות" onPress={setPredefinedMessageExpenses} />
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
        <Button title="שלח" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginTop:25,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
  },
  userMessage: {
    color: '#000',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  assistantMessage: {
    color: '#fff',
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  predefinedMessageButton: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});

export default ChatScreen;