import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const mockEmployeeBills = [
  { id: 'b1', amount: 500, date: '2025-03-01', description: 'Salaire Mars' },
  { id: 'b2', amount: 100, date: '2025-03-10', description: 'Avance' },
];

export default function EmployeeDetail({ route, navigation }) {
  const { employeeId } = route.params;
  // You would fetch employee data by ID, here is just mock:
  const employee = { id: employeeId, name: "Ali Hassan", position: "Manager", email: "ali@example.com" };
  const [bills, setBills] = useState(mockEmployeeBills);

  const handleEditBill = (bill) => {
    navigation.navigate('EditBill', { billId: bill.id, employeeId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{employee.name}</Text>
      <Text style={styles.position}>{employee.position}</Text>
      <Text style={styles.email}>{employee.email}</Text>
      <Text style={styles.sectionTitle}>Historique des paiements</Text>
      <FlatList
        data={bills}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.billItem} onPress={() => handleEditBill(item)}>
            <View>
              <Text style={styles.billAmount}>{item.amount} DH</Text>
              <Text style={styles.billDesc}>{item.description}</Text>
              <Text style={styles.billDate}>{item.date}</Text>
            </View>
            <Icon name="pencil" size={20} color="#888" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:16 },
  name: { fontSize:22, fontWeight:'bold', marginBottom:4 },
  position: { fontSize:16, color:'#555' },
  email: { fontSize:14, color:'#888', marginBottom:16 },
  sectionTitle: { fontSize:18, fontWeight:'bold', marginVertical:12 },
  billItem: { 
    flexDirection:'row', 
    justifyContent:'space-between', 
    alignItems:'center',
    backgroundColor:'#f2f2f2',
    padding:12,
    marginBottom:8,
    borderRadius:8,
  },
  billAmount: { fontSize:16, fontWeight:'bold' },
  billDesc: { fontSize:14, color:'#555' },
  billDate: { fontSize:12, color:'#888' },
});