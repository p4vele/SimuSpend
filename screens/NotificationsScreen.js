import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, Modal, ImageBackground, TouchableWithoutFeedback, Keyboard, RefreshControl } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { getFirestore, collection, getDocs, deleteDoc, addDoc,doc } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { Button, Input, CheckBox } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const db = getFirestore();

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuthentication();
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ name: '', description: '', date: new Date(), reminderDate: '1month', isYearly: false });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      if (!user) {
        console.log("No user found.");
        return;
      }
      const notificationsCollection = collection(db, 'users', user.uid, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsCollection);
      if (notificationsSnapshot && notificationsSnapshot.docs) {
        const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const addNotification = async () => {
    try {
      const notificationsCollection = collection(db, 'users', user?.uid, 'notifications');
      await addDoc(notificationsCollection, {
        name: newNotification.name,
        description: newNotification.description,
        date: newNotification.date,
        reminderDate: newNotification.reminderDate,
        isYearly: newNotification.isYearly,
      });
      setNewNotification({ name: '', description: '', date: new Date(), reminderDate: '1month', isYearly: false });
      fetchNotifications();
      toggleModal();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notificationDoc = doc(db, 'users', user?.uid, 'notifications', notificationId);
      await deleteDoc(notificationDoc);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Modal visible={isModalVisible} animationType="slide" transparent={true} keyboardShouldPersistTaps='handled'>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>הוסף תזכורת</Text>
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="שם התזכורת"
                    value={newNotification.name}
                    onChangeText={(text) => setNewNotification({ ...newNotification, name: text })}
                  />
                  <Input
                    placeholder="תיאור"
                    value={newNotification.description}
                    onChangeText={(text) => setNewNotification({ ...newNotification, description: text })}
                  />
                  <DateTimePicker
                    value={newNotification.date}
                    mode="date"
                    display="default"
                    onChange={(event, date) => setNewNotification({ ...newNotification, date: date || new Date() })}
                  />
                  <Text style={styles.pickerLabel}>תאריך התראה מראש:</Text>
                  <Picker
                    selectedValue={newNotification.reminderDate}
                    onValueChange={(itemValue) => setNewNotification({ ...newNotification, reminderDate: itemValue })}
                  >
                    <Picker.Item label=" חודש" value="1month" />
                    <Picker.Item label=" שבוע" value="1week" />
                    <Picker.Item label="3 ימים" value="3days" />
                  </Picker>
                  <CheckBox
                    title="תזכורת שנתית?"
                    checked={newNotification.isYearly}
                    onPress={() => setNewNotification({ ...newNotification, isYearly: !newNotification.isYearly })}
                  />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="הוסף" onPress={addNotification} />
                  <Button title="ביטול" type="outline" onPress={toggleModal} />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const dateObject = new Date(item.date.seconds * 1000);
            const formattedDate = dateObject.toLocaleDateString('he-IL', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
            });

            return (
              <TouchableOpacity style={styles.entryGridItem}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryDescription}>{item.name}</Text>
                  <Text style={styles.entryDescription}>{item.description}</Text>
                  <Text style={styles.entryAmount}>{formattedDate}</Text>
                  <Text style={styles.entryAmount}>התראה: {item.reminderDate}</Text>
                  <Text style={styles.entryAmount}>{item.isYearly ? 'שנתי' : 'חד-פעמי'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteNotification(item.id)}
                  style={styles.deleteButton}
                >
                  <FontAwesome name="times" size={15} color="red" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleModal}>
          <FontAwesome name="plus" size={20} color="white" />
          <Text style={styles.buttonText}>הוסף תזכורת</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
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
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: 20,
    marginTop: 25,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    direction: 'rtl',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 16,
  },
  entryInfo: {
    flexDirection: 'column',
    flex: 1,
    textAlign: 'right',
  },
  entryDescription: {
    marginRight: 10,
    direction: 'ltr',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  entryAmount: {
    marginRight: 10,
    direction: 'ltr',
    textAlign: 'right',
  },
  entryGridItem: {
    direction: 'rtl',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  deleteButton: {
    direction: 'ltr',
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    maxHeight: '80%',
    width: '80%',
    alignContent: 'center',

  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    marginBottom: 5,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
