import React, { useState } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';

const ChatScreen = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');

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
  
    } catch (error) {
      console.error('Error sending message to ChatGPT:', error.response ? error.response.data : error.message);
    }
  };
  
  

  return (
    <View style={styles.container}>
      
      <ScrollView style={styles.chatContainer}>
        {chatMessages.map((msg, index) => (
          <Text key={index} style={msg.role === 'assistant' ? styles.assistantMessage : styles.userMessage}>
            {msg.role === 'user' ? 'User: ' : 'Assistant: '}{msg.content}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={message}
          onChangeText={(text) => setMessage(text)}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
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
