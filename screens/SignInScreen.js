import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity,Modal,TouchableWithoutFeedback,Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Input, Button } from 'react-native-elements';
import { getAuth, signInWithEmailAndPassword,sendPasswordResetEmail  } from 'firebase/auth';

const auth = getAuth();

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  async function login() {
    if (email === '' || password === '') {
      setValidationMessage('הזן שם כתובת אימייל וסיסמה');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setValidationMessage(error.message);
    }
  }
 async function resetPassword() {
    if (resetEmail === '') {
      setResetMessage('כתובת אימייל נדרשת');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('מייל לאיפוס הסיסמה נשלח');
    } catch (error) {
      setResetMessage(error.message);
    }
  }
  return (
    
    
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
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.signUpText}> שכחת סיסמה?</Text>
            <Text style={styles.signUpLink}>איפוס סיסמה</Text>
        </TouchableOpacity>

       
        <TouchableOpacity onPress={() => navigation.navigate('הרשמה')} > 
          <Text style={styles.signUpText}>עדיין לא נרשמת? </Text>
          <Text style={styles.signUpLink}>הירשם עכשיו</Text>
        </TouchableOpacity>
      </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
            setResetMessage('');
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>איפוס סיסמה</Text>
                
                <Input
                  placeholder='הזן כתובת אימייל'
                  containerStyle={styles.inputContainer}
                  value={resetEmail}
                  onChangeText={(text) => setResetEmail(text)}
                />
                {<Text style={styles.error}>{resetMessage}</Text>}
                <View style={styles.buttonContainer}>
                  <Button title="איפוס סיסמה" buttonStyle={styles.button} onPress={resetPassword} />
                  <Button title="סגור" type="outline" buttonStyle={styles.button} onPress={() => setModalVisible(!modalVisible)} />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

    </View>
    </TouchableWithoutFeedback>
    
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
    marginLeft:5,
    },
  error: {
    marginTop: 10,
    color: 'red',
  },
  signUpText: {

    fontSize: 17,
    textAlign: 'center',
    marginLeft:5,
  },
  signUpLink: {
    marginLeft:5,

    fontSize: 17,
    textAlign: 'center',
    fontWeight:'bold',
  },
  forgotPasswordLink: {
    marginTop: 10,
    fontSize: 17,
    textAlign: 'center',
    color: 'blue',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical:25,
  },
});

export default SignInScreen;
