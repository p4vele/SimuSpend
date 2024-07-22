import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Modal, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRoute } from '@react-navigation/native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { PieChart } from 'react-native-chart-kit';
import Swiper from 'react-native-swiper';

const db = getFirestore();

const colorScale = ['#FF5733', '#33FF57', '#5733FF', '#FF33E6', '#33C2FF', '#A1FF33', '#FFB533', '#3366FF'];

const GroupDetailsScreen = () => {
  const { user } = useAuthentication();
  const route = useRoute();
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState({});
  const [expensesData, setExpensesData] = useState([]);
  const [incomesData, setIncomesData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [spendingChartData, setSpendingChartData] = useState([]);
  const [expensesData2, setExpensesData2] = useState([]);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  useEffect(() => {
    if (Object.keys(selectedMembers).length > 0) {
      showSelectedData();
    }
  }, [selectedMembers, selectedMonth]);

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

  const toggleMonthModal = () => setIsMonthModalVisible(!isMonthModalVisible);

  const fetchMemberDataByMonth = async (email, uid, collectionType) => {
    const collectionRef = collection(db, 'users', uid, collectionType);
    const snapshot = await getDocs(collectionRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.filter(item => new Date(item.date).getMonth() === selectedMonth);
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

      const expensesPromises = validUidsData.map(async ({ email, uid }, index) => {
        const expenses = await fetchMemberDataByMonth(email, uid, 'expenses');
        return { email, expenses };
      });

      const incomesPromises = validUidsData.map(async ({ email, uid }, index) => {
        const incomes = await fetchMemberDataByMonth(email, uid, 'incomes');
        return { email, incomes };
      });

      const expensesData = await Promise.all(expensesPromises);
      const incomesData = await Promise.all(incomesPromises);

      setExpensesData(expensesData);
      setIncomesData(incomesData);

  
      const newChartData = calculateChartData(expensesData.flatMap(data => data.expenses));
      setChartData(newChartData);
  
      const expensesPromises2 = validUidsData.map(async ({ email, uid }) => {
        const expenses = await fetchMemberDataByMonth(email, uid, 'expenses');
        return expenses.map(expense => ({ ...expense, email }));
      });
      const expensesData2 = await Promise.all(expensesPromises2);
      const flatExpensesData = expensesData2.flat();
      setExpensesData2(flatExpensesData);

      const spendingData = calculateSpendingChartData(flatExpensesData);
      setSpendingChartData(spendingData);
  
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

  const calculateChartData = (expensesData) => {
    const typesData = expensesData.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {});

    const newChartData = Object.keys(typesData).map((type, index) => ({
      name: type,
      amount: typesData[type],
      color: colorScale[index % colorScale.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }));

    return newChartData;
  };

  const calculateSpendingChartData = (expensesData) => {
    const memberSpending = expensesData.reduce((acc, { email, amount }) => {
      acc[email] = (acc[email] || 0) + amount;
      return acc;
    }, {});
  
    const totalSpending = Object.values(memberSpending).reduce((sum, amount) => sum + amount, 0);
  
    const spendingChartData = Object.keys(memberSpending).map((email, index) => {
      const name = email.split('@')[0];
      
      return {
        name: name,
        amount: memberSpending[email],
        color: colorScale[index % colorScale.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
        percentage: ((memberSpending[email] / totalSpending) * 100).toFixed(2),
      };
    });
  
    return spendingChartData;
  };

  const renderMonthItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedMonth === item && styles.selectedItem]}
      onPress={() => {
        setSelectedMonth(item);
        toggleMonthModal();
      }}
    >
      <Text style={[styles.text, selectedMonth === item && styles.selectedText]}>
        {getMonthName(item)}
      </Text>
    </TouchableOpacity>
  );

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
      <View style={styles.groupDetailsContainer}>
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
      </View>
      <TouchableOpacity onPress={toggleMonthModal} style={styles.textBox}>
        <Text style={{ fontSize: 26, marginBottom: 5 }}>הוצאות והכנסות עבור חודש </Text>
        <Text style={{ fontWeight: 'bold', fontSize: 26, direction: 'rtl' }}>{getMonthName(selectedMonth)}</Text>
        <Text style={{ fontSize: 12 }}>לחץ על כדי לבחור חודש אחר</Text>
      </TouchableOpacity>

      <Swiper
        showsPagination={true}
        loop={true}
        style={styles.swiper}

      >
        {expensesData.length > 0 && (
            <View style={styles.slide}>
              <Text style={styles.chartTitle}>הוצאות לפי סוג</Text>
              <PieChart
                data={chartData}
                width={350}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForLabels: {
                    fontFamily: 'Cochin',
                  },
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </View>
          )}

      <View style={styles.slide}>
        <Text style={styles.chartTitle}> הוצאות ב₪ לפי שותפים</Text>
        <PieChart
          data={spendingChartData}
          width={350}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: () => '#000',
            strokeWidth: 2,
            barPercentage: 0.5,
          }}
          accessor="amount"
          backgroundColor="transparent"
          absolute

        />
      </View>
      </Swiper>
      
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
      <Modal visible={isMonthModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <FlatList
              data={[...Array(12).keys()]}
              keyExtractor={(item) => item.toString()}
              renderItem={renderMonthItem}
            />
            <Button title="סגור" onPress={toggleMonthModal} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop:50,
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
    marginVertical: 5,
  },
  memberName: {
    fontSize: 18,
    marginLeft: 10,
  },
  textBox: {
    padding: 10,
    backgroundColor: '#EDEDED',
    marginVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
 
  swiper: {
    height: 350,
  
    
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationStyle: {
    bottom: 10,
  },
  chartTitle: {
    marginTop:5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedItem: {
    backgroundColor: '#e0e0e0',
  },
  text: {
    fontSize: 18,
  },
  selectedText: {
    fontWeight: 'bold',
  },
  dataContainer: {
    flexDirection: 'row',
    marginTop: 20,
    flex:1,
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

const getMonthName = (monthIndex) => {
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  return monthNames[monthIndex];
};

export default GroupDetailsScreen;
