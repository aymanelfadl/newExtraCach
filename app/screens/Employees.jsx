import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { colors, typography, shadows } from '../../styles/theme';

const mockEmployees = [
  { id: '1', name: 'Ali Hassan', position: 'Manager' },
  { id: '2', name: 'Sara Khalid', position: 'Accountant' },
];

export default function Employees() {
  const [employees] = useState(mockEmployees);
  const navigation = useNavigation();

  const handleAddEmployee = () => navigation.navigate('AddEmployee');
  const handlePressEmployee = (employee) => navigation.navigate('EmployeeDetail', { employeeId: employee.id });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Liste des employés</Text>
        <TouchableOpacity onPress={handleAddEmployee} style={styles.addButton}>
          <Icon name="plus" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={employees}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.employeeItem}
            onPress={() => handlePressEmployee(item)}
          >
            <View>
              <Text style={styles.employeeName}>{item.name}</Text>
              <Text style={styles.employeePosition}>{item.position}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.iconInactive || '#aaa'} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun employé</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1, 
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection:'row', 
    justifyContent:'space-between', 
    alignItems:'center', 
    marginBottom:12,
  },
  title: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 8,
    ...shadows.medium,
  },
  employeeItem: { 
    flexDirection:'row', 
    justifyContent:'space-between', 
    alignItems:'center',
    padding: 16, 
    marginBottom: 8, 
    backgroundColor: colors.card,
    borderRadius: 8,
    ...shadows.small,
  },
  employeeName: { 
    fontSize: typography.sizeMedium, 
    fontWeight: typography.weightSemiBold, 
    color: colors.textPrimary,
  },
  employeePosition: { 
    fontSize: typography.sizeSmall, 
    color: colors.textSecondary, 
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizeMedium,
    alignSelf: 'center',
    marginTop: 32,
  }
});