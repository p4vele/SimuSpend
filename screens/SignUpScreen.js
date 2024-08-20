import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, Image, TouchableOpacity,TouchableWithoutFeedback,Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Input, Button } from 'react-native-elements';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  let validateAndSet = (value, setValue) => {
    setValue(value);
  };

  function checkPassword(firstPassword, secondPassword) {
    if (firstPassword !== secondPassword) {
      setValidationMessage('סיסמאות לא תואמות');
    } else setValidationMessage('');
  }

  async function createAccount() {
    email === '' || password === '' || confirmPassword === ''
      ? setValidationMessage('שדה מבוקש חסר')
      : '';

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('התחברות');
    } catch (error) {
      setValidationMessage(error.message);
    }
  }

  return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />

        <Input
          placeholder='הזמן כתובת אימייל'
          containerStyle={styles.inputContainer}
          value={email}
          onChangeText={(text) => setEmail(text)}
          leftIcon={<Icon name='envelope' size={16} />}
          placeholderStyle={{ textAlign: 'right' }}
        />

        <Input
          placeholder='הזן סיסמה'
          containerStyle={styles.inputContainer}
          value={password}
          onChangeText={(value) => validateAndSet(value, setPassword)}
          secureTextEntry
          leftIcon={<Icon name='key' size={16} />}
          placeholderStyle={{ textAlign: 'right' }}
        />

        <Input
          placeholder='הזן סיסמה שנית'
          containerStyle={styles.inputContainer}
          value={confirmPassword}
          onChangeText={(value) => validateAndSet(value, setConfirmPassword)}
          secureTextEntry
          leftIcon={<Icon name='key' size={16} />}
          onBlur={() => checkPassword(password, confirmPassword)}
          placeholderStyle={{ textAlign: 'right' }}
        />

        {<Text style={styles.error}>{validationMessage}</Text>}

        <Button title='הרשמה' buttonStyle={styles.button} onPress={createAccount} />

        <View>
          <Text style={styles.signInText}>
            משתמש קיים?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('התחברות')} style={{ color: 'gray', marginLeft: 10 }}>
              <Text style={styles.signInLink}>התחבר כאן </Text>
            </TouchableOpacity>
        </View>
      </View>
      </TouchableWithoutFeedback>
  );
};

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
  },
  error: {
    marginTop: 10,
    color: 'red',
  },
  signInText: {
    marginTop: 15,
    fontSize: 17,
    textAlign: 'center',
    
  },
  signInLink: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
    fontWeight:'bold',
  },
});

export default SignUpScreen;
