import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, Image, TouchableOpacity } from 'react-native';
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
      setValidationMessage('Passwords do not match');
    } else setValidationMessage('');
  }

  async function createAccount() {
    email === '' || password === '' || confirmPassword === ''
      ? setValidationMessage('Required field missing')
      : '';

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('Sign In');
    } catch (error) {
      setValidationMessage(error.message);
    }
  }

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />

        <Input
          placeholder='Email'
          containerStyle={styles.inputContainer}
          value={email}
          onChangeText={(text) => setEmail(text)}
          leftIcon={<Icon name='envelope' size={16} />}
        />

        <Input
          placeholder='Password'
          containerStyle={styles.inputContainer}
          value={password}
          onChangeText={(value) => validateAndSet(value, setPassword)}
          secureTextEntry
          leftIcon={<Icon name='key' size={16} />}
        />

        <Input
          placeholder='Confirm password'
          containerStyle={styles.inputContainer}
          value={confirmPassword}
          onChangeText={(value) => validateAndSet(value, setConfirmPassword)}
          secureTextEntry
          leftIcon={<Icon name='key' size={16} />}
          onBlur={() => checkPassword(password, confirmPassword)}
        />

        {<Text style={styles.error}>{validationMessage}</Text>}

        <Button title='Sign up' buttonStyle={styles.button} onPress={createAccount} />

        <View>
          <Text style={styles.signInText}>
            Already have an account?
            <TouchableOpacity onPress={() => navigation.navigate('Sign In')} style={{ color: 'blue', marginLeft: 10 }}>
              <Text style={styles.signInLink}>Login here </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </ImageBackground>
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Add a semi-transparent white background to improve readability
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
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
  },
  signInLink: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
    color: 'blue',
  },
});

export default SignUpScreen;
