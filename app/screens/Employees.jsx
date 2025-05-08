import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { colors, typography, shadows, spacing, borderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { employeeService } from '../../services';
import { useUser } from '../../context/UserContext';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    salary: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const { isOnline } = useUser();

  const loadEmployees = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const result = await employeeService.getEmployees();
      
      if (result.success) {
        setEmployees(result.employees || []);
        
        // If was offline and now online, try to sync
        if (isOnline && result.isPartiallyOffline) {
          try {
            await employeeService.syncOfflineEmployees();
            // After successful sync, reload data
            const freshResult = await employeeService.getEmployees();
            if (freshResult.success) {
              setEmployees(freshResult.employees || []);
            }
          } catch (syncError) {
            console.error("Error syncing offline employees:", syncError);
          }
        }
      } else {
        console.error("Failed to load employees:", result.error);
        Alert.alert('Erreur', result.error || 'Impossible de charger la liste des employés');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des employés');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);
  
  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      const syncData = async () => {
        try {
          const syncResult = await employeeService.syncOfflineEmployees();
          if (syncResult.success && syncResult.syncedCount > 0) {
            loadEmployees();
          }
        } catch (error) {
          console.error('Error syncing offline data:', error);
        }
      };
      
      syncData();
    }
  }, [isOnline]);

  const handleRefresh = () => {
    loadEmployees(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredEmployees = searchQuery
    ? employees.filter(emp => 
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchQuery.toLowerCase()))
    : employees;

  const handleAddEmployee = () => {
    setNewEmployee({ name: '', salary: '' });
    setModalVisible(true);
  };

  const handleSaveEmployee = async () => {
    if (!newEmployee.name || !newEmployee.salary) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const employeeData = {
        ...newEmployee,
        salary: parseFloat(newEmployee.salary),
        expenses: [],
        payments: []
      };
      
      const result = await employeeService.addEmployee(employeeData);
      
      if (result.success) {
        setEmployees([result.employee, ...employees]);
        setModalVisible(false);
        setNewEmployee({ name: '', salary: '' });
        
        if (result.isOffline) {
          Alert.alert('Mode hors ligne', 'L\'employé a été ajouté en mode hors ligne et sera synchronisé dès que vous serez connecté.');
        } else {
          Alert.alert('Succès', 'Employé ajouté avec succès');
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible d\'ajouter l\'employé');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      Alert.alert('Erreur', "Impossible d'ajouter l'employé");
    }
  };

  const handlePressEmployee = (employee) => {
    navigation.navigate('EmployeeDetail', { employeeId: employee.id });
  };
  
  const handleDeleteEmployee = (employeeId) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await employeeService.deleteEmployee(employeeId);
              
              if (result.success) {
                setEmployees(employees.filter(emp => emp.id !== employeeId));
                
                if (result.isOffline) {
                  Alert.alert('Mode hors ligne', 'La suppression sera synchronisée lorsque vous serez en ligne.');
                } else {
                  Alert.alert('Succès', 'Employé supprimé avec succès');
                }
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de supprimer l\'employé');
              }
            } catch (error) {
              console.error('Error deleting employee:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
            }
          }
        }
      ]
    );
  };

  const totalSalaries = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
  const totalPayments = employees.reduce((sum, emp) => 
    sum + (emp.payments?.reduce((acc, payment) => acc + (Number(payment.amount) || 0), 0) || 0), 
  0);

  return (
    <View style={styles.container}>
      <Header 
        screenName="Employés" 
        onSearching={handleSearch}
      />
      
      {/* Offline indicator */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Icon name="cloud-off-outline" size={16} color={colors.white} />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Solde</Text>
          <Text style={[
            styles.summaryValue,
            styles.positiveBalance
          ]}>
            {totalPayments} MAD
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Employés</Text>
          <Text style={styles.summaryValue}>{employees.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Masse Salariale</Text>
          <Text style={styles.summaryValue}>
            {totalSalaries} MAD
          </Text>
        </View>
      </View>      
      <View style={styles.header}>
        <Text style={styles.title}>Liste des employés</Text>
        <TouchableOpacity onPress={handleAddEmployee} style={styles.addButton}>
          <Icon name="account-plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredEmployees}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.employeeItem}
            onPress={() => handlePressEmployee(item)}
          >
            <View style={[
              styles.employeeIcon, 
              item.isOffline ? styles.offlineEmployeeIcon : null
            ]}>
              <Text style={styles.employeeInitial}>
                {item.name.charAt(0)}
              </Text>
              {item.isOffline && (
                <View style={styles.offlineIndicator}>
                  <Icon name="cloud-off-outline" size={10} color={colors.white} />
                </View>
              )}
            </View>
            
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{item.name}</Text>
              <Text style={styles.employeePosition}>{item.position}</Text>
              <Text style={styles.employeeSalary}>Salaire: {item.salary} MAD</Text>
              <Text style={styles.employeeLastPayment}>
                Dernier paiement: {item.lastPayment || 'Non défini'}
              </Text>
            </View>
            
            <View style={styles.employeeFinancials}>
              <Text style={styles.expenseLabel}>Total donné:</Text>
              <Text style={[
                styles.employeeBalance, 
                styles.positiveBalance
              ]}>
                {(item.payments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0)} MAD
              </Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  onPress={() => handleDeleteEmployee(item.id)}
                  style={styles.deleteButton}
                >
                  <Icon name="delete" size={16} color={colors.expense} />
                </TouchableOpacity>
              </View>
              <Icon name="chevron-right" size={24} color={colors.iconInactive || '#aaa'} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Chargement...' : 'Aucun employé trouvé'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel employé</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.textInput}
                value={newEmployee.name}
                onChangeText={(text) => setNewEmployee({...newEmployee, name: text})}
                placeholder="Nom et prénom"
              />
              
              <Text style={styles.inputLabel}>Salaire (MAD)</Text>
              <TextInput
                style={styles.textInput}
                value={newEmployee.salary}
                onChangeText={(text) => setNewEmployee({...newEmployee, salary: text})}
                placeholder="Montant du salaire"
                keyboardType="numeric"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEmployee}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: colors.background,
  },
  offlineBar: {
    backgroundColor: colors.warning,
    padding: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.small,
  },
  offlineText: {
    color: colors.white,
    marginLeft: spacing.small,
    fontWeight: typography.weightMedium,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    marginHorizontal: spacing.medium,
    marginTop: spacing.small,
    marginBottom: spacing.medium,
    padding: spacing.medium,
    ...shadows.medium,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  summaryValue: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  title: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    padding: spacing.small,
    ...shadows.medium,
  },
  employeeItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: spacing.medium, 
    marginHorizontal: spacing.medium,
    marginBottom: spacing.small, 
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  employeeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
    position: 'relative',
  },
  offlineEmployeeIcon: {
    backgroundColor: colors.warning,
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: colors.warning,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.card,
  },
  employeeInitial: {
    color: colors.white,
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: { 
    fontSize: typography.sizeMedium, 
    fontWeight: typography.weightSemiBold, 
    color: colors.textPrimary,
  },
  employeePosition: { 
    fontSize: typography.sizeSmall, 
    color: colors.textSecondary, 
    marginBottom: spacing.tiny,
  },
  employeeSalary: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  employeeLastPayment: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginTop: spacing.tiny,
  },
  employeeFinancials: {
    alignItems: 'flex-end',
  },
  expenseLabel: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
  employeeBalance: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    marginBottom: spacing.tiny,
  },
  positiveBalance: {
    color: colors.income,
  },
  negativeBalance: {
    color: colors.expense,
  },
  zeroBalance: {
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  expenseBadge: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 2,
    paddingHorizontal: spacing.small,
    borderRadius: borderRadius.small,
    marginRight: spacing.small,
  },
  expenseCount: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizeMedium,
    marginTop: spacing.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.medium,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    width: '100%',
    maxWidth: 500,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    padding: spacing.medium,
  },
  modalTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.medium,
  },
  inputLabel: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  textInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: typography.sizeRegular,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.medium,
  },
  modalButton: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    marginLeft: spacing.small,
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
  },
});