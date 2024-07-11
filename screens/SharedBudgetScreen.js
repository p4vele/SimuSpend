import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Button, Alert, Modal, ImageBackground, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc, getDoc } from 'firebase/firestore';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { Picker } from '@react-native-picker/picker';
import { PieChart } from 'react-native-chart-kit';
import { FontAwesome } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 

const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];
const db = getFirestore();

const SharedBudgetScreen = () => {
  const { user } = useAuthentication();

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchInvitations();
  }, [user]);

  const fetchGroups = async () => {
    if (!user || !user.email) return;
    try {
      const userEmail = user.email;
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', userEmail));
      const querySnapshot = await getDocs(q);
      const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const userEmail = user.email;
      const groupsRef = collection(db, 'groups');
      const querySnapshot = await getDocs(groupsRef);

      const invitationsData = [];

      querySnapshot.forEach((doc) => {
        const groupData = doc.data();

        if (groupData.invitations) {
          const pendingInvitations = groupData.invitations.filter(invitation =>
            invitation.status === 'pending' && invitation.email === userEmail
          );

          pendingInvitations.forEach(invitation => {
            invitationsData.push({ ...invitation, id: `${doc.id}_${invitation.email}` });
          });
        }
      });

      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const createGroup = async () => {
    try {
      const userEmail = user.email;
      const newGroupRef = await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        members: [userEmail],
      });
      setNewGroupName('');
      fetchGroups();
      setShowNewGroupModal(false);
      Alert.alert('Success', 'Group created successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const sendInvitation = async () => {
    try {
      if (!selectedGroup) {
        Alert.alert('Error', 'Please select a group to invite to.');
        return;
      }

      if (!inviteEmail) {
        Alert.alert('Error', 'Please enter the email of the user to invite.');
        return;
      }

      const groupRef = doc(db, 'groups', selectedGroup.id);
      await updateDoc(groupRef, {
        invitations: arrayUnion({
          email: inviteEmail,
          sender: user.email,
          groupName: selectedGroup.name,
          status: 'pending',
        }),
      });

      setInviteEmail('');
      setSelectedGroup(null);
      setShowInviteModal(false);

      Alert.alert('Success', 'Invitation sent successfully');
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const acceptInvitation = async (invitationId) => {
    try {
      const [groupId, email] = invitationId.split('_');
      const groupRef = doc(db, 'groups', groupId);
      const invitation = invitations.find(inv => inv.id === invitationId);

      if (!invitation) {
        console.error('Invitation not found.');
        return;
      }

      const groupSnapshot = await getDoc(groupRef);
      const groupData = groupSnapshot.data();
      const updatedInvitations = groupData.invitations.map(inv =>
        inv.email === email ? { ...inv, status: 'accepted' } : inv
      );

      await updateDoc(groupRef, {
        invitations: updatedInvitations,
        members: arrayUnion(user.email),
      });

      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      fetchGroups();
      Alert.alert('Success', 'Invitation accepted successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const rejectInvitation = async (invitationId) => {
    try {
      const [groupId, email] = invitationId.split('_');
      const groupRef = doc(db, 'groups', groupId);
      const invitation = invitations.find(inv => inv.id === invitationId);

      if (!invitation) {
        console.error('Invitation not found.');
        return;
      }

      const groupSnapshot = await getDoc(groupRef);
      const groupData = groupSnapshot.data();

      const updatedInvitations = groupData.invitations.filter(inv => inv.email !== email);

      await updateDoc(groupRef, {
        invitations: updatedInvitations,
      });

      setInvitations(invitations.filter(invitation => invitation.id !== invitationId));

      Alert.alert('Success', 'Invitation rejected successfully');
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      Alert.alert('Error', 'Failed to reject invitation');
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.groupItem} onPress={() => handleGroupPress(item)}>
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.groupMembers}>{item.members.length} members</Text>
    </TouchableOpacity>
  );
  const renderGroups = ({ item }) => (
    <TouchableOpacity style={styles.groupItem} onPress={() =>{}}>
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.groupMembers}>{item.members.length} members</Text>
    </TouchableOpacity>
  );
  const renderInvitationItem = ({ item }) => (
    <View style={styles.invitationItem}>
      <Text>{`Invited to ${item.groupName} by ${item.sender}`}</Text>
      <View style={styles.invitationButtons}>
        <Button title="Accept" onPress={() => acceptInvitation(item.id)} />
        <Button title="Reject" onPress={() => rejectInvitation(item.id)} />
      </View>
    </View>
  );

  const handleGroupPress = (group) => {
    setSelectedGroup(group);
    setShowInviteModal(true);
  };

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <View style={styles.container}>
        
          <Text style={styles.title}>ניהול תקציב משותף</Text>
          <Text style={styles.subtitle}>הקבוצות שלך:</Text>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroups}
            contentContainerStyle={styles.listContainer}
          />

          {/* Modal for creating a new group */}
          <Modal
            animationType="slide"
            visible={showNewGroupModal}
            onRequestClose={() => setShowNewGroupModal(false)}
            transparent={true}
            keyboardShouldPersistTaps='handled'
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>צור קבוצה חדשה:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="הזן שם ליצירת קבוצה חדשה"
                    value={newGroupName}
                    onChangeText={text => setNewGroupName(text)}
                  />
                  <Button title="צור קבוצה" onPress={createGroup} />
                  <Button title="סגור" onPress={() => setShowNewGroupModal(false)} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Modal for inviting a user to a group */}
          <Modal
            animationType="slide"
            visible={showInviteModal}
            onRequestClose={() => setShowInviteModal(false)}
            transparent={true}
            keyboardShouldPersistTaps='handled'
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>הזן אימייל של משתמש אותו תרצה להזמין</Text>
                  <FlatList
                    data={groups}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.groupItem, selectedGroup && selectedGroup.id === item.id && { backgroundColor: '#eee' }]}
                        onPress={() => setSelectedGroup(item)}
                      >
                        <Text style={styles.groupName}>{item.name}</Text>
                        <Text style={styles.groupMembers}>{item.members.length} members</Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContainer}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="הכנס אימייל אותו תרצה להזמין"
                    value={inviteEmail}
                    onChangeText={text => setInviteEmail(text)}
                  />
                  <Button title="שלח הזמנה" onPress={sendInvitation} />
                  <Button title="סגור" onPress={() => setShowInviteModal(false)} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Modal for viewing invitations */}
          <Modal
            animationType="slide"
            visible={showInvitationsModal}
            onRequestClose={() => setShowInvitationsModal(false)}
            transparent={true}
            keyboardShouldPersistTaps='handled'
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>הזמנות ממתינות:</Text>
                  <FlatList
                    data={invitations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderInvitationItem}
                    contentContainerStyle={styles.listContainer}
                  />
                  <Button title="סגור" onPress={() => setShowInvitationsModal(false)} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          <View style={styles.additionalView}>
            <Text style={styles.subtitle2}>אפשרויות נוספות:</Text>

            <TouchableOpacity style={styles.newGroupContainer} onPress={() => setShowInviteModal(true)}>
              <FontAwesome name="user-plus" size={20} color="white" />
              <Text style={styles.buttonText}>הזמן משתמש לקבוצה</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newGroupContainer} onPress={() => setShowNewGroupModal(true)}>
              <MaterialCommunityIcons name="account-group" size={20} color="white" />
              <Text style={styles.buttonText}>צור קבוצה חדשה</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newGroupContainer} onPress={() => setShowInvitationsModal(true)}>
              <MaterialCommunityIcons name="timeline-check-outline" size={20} color="white" />
              <Text style={styles.buttonText}>הזמנות ממתינות לאישור</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 20,
    marginTop: 30,
    
  },
 
  scrollContainer: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#fff',
    marginBottom: 10,
  },
  subtitle2: {
    textAlign: 'center',
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  groupItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupMembers: {
    fontSize: 14,
    color: '#666',
  },
  newGroupContainer: {
    marginVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
   
  },
  input: {
    backgroundColor: 'grey',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    direction: 'rtl',
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  invitationItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  invitationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SharedBudgetScreen;
