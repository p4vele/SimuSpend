import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity,ImageBackground,TouchableWithoutFeedback,Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Input, Button } from 'react-native-elements';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  async function login() {
    if (email === '' || password === '') {
      setValidationMessage('required filled missing');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setValidationMessage(error.message);
    }
  }

  return (
    
    
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')}   style={{width: 150, height: 150, alignSelf: 'center', resizeMode: 'contain'}} />
      <Input
        placeholder='הזן כתובת אימייל'
        containerStyle={styles.inputContainer}
        value={email}
        onChangeText={(text) => setEmail(text)}
        leftIcon={<Icon name='envelope' size={16} />}
      />

      <Input
        placeholder='הזן סיסמה'
        containerStyle={styles.inputContainer}
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={true}
        leftIcon={<Icon name='key' size={16} />}
      />
      {<Text style={styles.error}>{validationMessage}</Text>}

      <Button title="התחבר" buttonStyle={styles.button} onPress={login} />
      <Text style={styles.signUpText}>
        עדיין לא נרשמת?
        <TouchableOpacity onPress={() => navigation.navigate('Sign Up')} >
          <Text style={styles.signUpLink}>הירשם עכשיו</Text>
        </TouchableOpacity>
      </Text>
    </View>
    </TouchableWithoutFeedback>
    </ImageBackground>
    
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'contain',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  inputContainer: {
    marginTop: 10,
    width: '80%', 
  },
  button: {
    marginTop: 10,
    backgroundColor:'blue',
    },
  error: {
    marginTop: 10,
    color: 'red',
  },
  signUpText: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
    color: 'white',
  },
  signUpLink: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
    color: 'white',
  },
});

export default SignInScreen;
