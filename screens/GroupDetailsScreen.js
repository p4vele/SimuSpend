import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button,ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRoute } from '@react-navigation/native';
import { useAuthentication } from '../utils/hooks/useAuthentication';

const db = getFirestore();

const GroupDetailsScreen = () => {
  const { user } = useAuthentication();

  const route = useRoute();
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState({});

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnapshot = await getDoc(groupRef);
      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data();
        setMembers(groupData.members);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [member]: !prev[member],
    }));
  };

  const showSelectedData = async () => {
    const selectedEmails = Object.keys(selectedMembers).filter(member => selectedMembers[member]);

    try {
      const uidsPromises = selectedEmails.map(async (email) => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return { email, uid: userDoc.id };
        }
        return null;
      });

      const uidsData = await Promise.all(uidsPromises);
      const validUidsData = uidsData.filter(data => data !== null);

      const colors = ['blue', 'green', 'orange', 'purple', 'red'];

      const expensesPromises = validUidsData.map(async ({ email, uid }, index) => {
        const expensesRef = collection(db, 'users', uid, 'expenses');
        const expensesSnapshot = await getDocs(expensesRef);
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { email, expenses, color: colors[index % colors.length] };
      });

      const incomesPromises = validUidsData.map(async ({ email, uid }, index) => {
        const incomesRef = collection(db, 'users', uid, 'incomes');
        const incomesSnapshot = await getDocs(incomesRef);
        const incomes = incomesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { email, incomes, color: colors[index % colors.length] };
      });

      const expensesData = await Promise.all(expensesPromises);
      const incomesData = await Promise.all(incomesPromises);

      setExpensesData(expensesData);
      setIncomesData(incomesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const [expensesData, setExpensesData] = useState([]);
  const [incomesData, setIncomesData] = useState([]);

  const renderExpenseItem = ({ item }) => {
    return (
      <View style={[styles.dataItemContainer, { backgroundColor: item.color }]}>
        <Text style={styles.dataHeader}>{item.email}</Text>
        <FlatList
          data={item.expenses}
          keyExtractor={(expense) => expense.id}
          renderItem={({ item }) => {
            const formattedDate = item.date ? new Date(item.date).toLocaleDateString() : new Date(item.datetime).toLocaleDateString();

            return (
              <Text style={styles.dataText}>{`${formattedDate} \n`}
                <Text style={styles.bold}>{item.description} </Text>
                {`₪${item.amount}\n`}
                ---------------------
              </Text>
            );
          }}
        />
      </View>
    );
  };
  const renderIncomeItem = ({ item }) => (
    <View style={[styles.dataItemContainer, { backgroundColor: item.color }]}>
      <Text style={styles.dataHeader}>{item.email}</Text>
      <FlatList
        data={item.incomes}
        keyExtractor={(income) => income.id}
        renderItem={({ item }) => {
          const formattedDate = item.date ? new Date(item.date).toLocaleDateString() : new Date(item.datetime).toLocaleDateString();
          return(
            
            <Text style={styles.dataText}>{`${formattedDate} \n`}
                <Text style={styles.bold}>{item.description} </Text>
                {`₪${item.amount}\n`}
                ---------------------
              </Text>
          );
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>סמן שותפים להצגה</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleMemberSelection(item)} style={styles.memberItem}>
            <Icon
              name={selectedMembers[item] ? 'checkbox' : 'square-outline'}
              size={24}
              color={selectedMembers[item] ? 'black' : 'gray'}
            />
            <Text style={styles.memberName}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="הצג נתונים" onPress={showSelectedData} />

      <View style={styles.dataContainer}>
        

        {/* Display Incomes */}
        <View style={styles.dataColumn}>
          <Text style={[styles.title, styles.dataTitle]}>הכנסות</Text>
          <FlatList
            data={incomesData}
            keyExtractor={(item) => item.email}
            renderItem={renderIncomeItem}
          />
        </View>
        {/* Display Expenses */}
        <View style={styles.dataColumn}>
          <Text style={[styles.title, styles.dataTitle]}>הוצאות</Text>
          <FlatList
            data={expensesData}
            keyExtractor={(item) => item.email}
            renderItem={renderExpenseItem}
          />
        </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    padding: 20,
    marginTop:30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
   
  },
  memberName: {
    fontSize: 18,
    marginLeft: 10,

  },
  dataContainer: {
    flex: 20,
    flexDirection: 'row',
    marginTop: 20,
  },
  dataColumn: {
    flex: 1,
    marginLeft: 10,
  },
  dataTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  dataItemContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    
  },
  dataHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataText: {
    fontSize: 14,
    marginVertical: 3,
    textAlign:'right',
  },
  bold: {
    fontWeight: 'bold',
  },

});

export default GroupDetailsScreen;
