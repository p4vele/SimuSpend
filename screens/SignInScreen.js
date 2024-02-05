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
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={true}
        leftIcon={<Icon name='key' size={16} />}
      />
      {<Text style={styles.error}>{validationMessage}</Text>}

      <Button title="Sign in" buttonStyle={styles.button} onPress={login} />
      <Text style={styles.signUpText}>
        Don't have an account yet ?
        <TouchableOpacity onPress={() => navigation.navigate('Sign Up')} >
          <Text style={styles.signUpLink}>Sign up here</Text>
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
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
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
    width: '80%', // Adjust the width as needed
  },
  button: {
    marginTop: 10,
  },
  error: {
    marginTop: 10,
    color: 'red',
  },
  signUpText: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
  },
  signUpLink: {
    marginTop: 5,
    fontSize: 17,
    textAlign: 'center',
    color: 'blue',
  },
});

export default SignInScreen;
