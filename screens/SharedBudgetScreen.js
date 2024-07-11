import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Button, Alert, Modal } from 'react-native';
import { getFirestore,collection, query, where,getDocs,doc,updateDoc,arrayUnion,arrayRemove,addDoc,getDoc} from 'firebase/firestore';
import { useAuthentication } from '../utils/hooks/useAuthentication';

const db = getFirestore(); 

const SharedBudgetScreen = () => {
  const { user } = useAuthentication(); 

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
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
    console.log('fetchInvitations started');
    try {
      const userEmail = user.email; 
      const groupsRef = collection(db, 'groups');
      const querySnapshot = await getDocs(groupsRef);
        
      const invitationsData = [];
     
      querySnapshot.forEach((doc) => {
        const groupData = doc.data();
        console.log('groupData', groupData);
  
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
      console.log('invitationsData:', invitationsData);
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
      console.log('New group created with ID:', newGroupRef.id);
      setNewGroupName('');
      fetchGroups(); 
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
    <View style={styles.container}>
      <Text style={styles.title}>Shared Budget Groups</Text>

      <Text style={styles.subtitle}>Your Groups:</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Modal for inviting users */}
      <Modal
        animationType="slide"
        visible={showInviteModal}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Invite User to Group</Text>
          <Text style={styles.modalText}>Select a group:</Text>
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
            placeholder="Enter user's email"
            value={inviteEmail}
            onChangeText={text => setInviteEmail(text)}
          />
          <Button title="Send Invitation" onPress={sendInvitation} />
          <Button title="Cancel" onPress={() => setShowInviteModal(false)} />
        </View>
      </Modal>

      {/* Button to create new group */}
      <View style={styles.createGroupContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter new group name"
          value={newGroupName}
          onChangeText={text => setNewGroupName(text)}
        />
        <Button title="Create Group" onPress={createGroup} />
      </View>

      {/* Invitations section */}
      <Text style={styles.subtitle}>Invitations:</Text>
      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={renderInvitationItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  listContainer: {
    flexGrow: 1,
  },
  groupItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  invitationItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupMembers: {
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
  },
  createGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  invitationButtons: {
    flexDirection: 'row',
  },
});


export default SharedBudgetScreen;
