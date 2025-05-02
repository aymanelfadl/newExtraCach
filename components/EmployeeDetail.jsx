import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { employeeService } from '../services';
import { useUser } from '../context/UserContext';
import { colors } from '../styles/theme';

export default function EmployeeDetail({ route, navigation }) {
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [dateFilterModalVisible, setDateFilterModalVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    isActive: false
  });

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Parse date from DD/MM/YYYY format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    // Create date (month is 0-indexed in JS Date)
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  const [newPayment, setNewPayment] = useState({
    description: '',
    amount: '',
    date: formatDate(new Date())
  });

  const { isOnline } = useUser();

  // Fetch employee data
  const loadEmployeeData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else if (!employee) {
        setIsLoading(true);
      }
      
      const result = await employeeService.getEmployeeById(employeeId);
      
      if (result.success) {
        setEmployee(result.employee);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de charger les données de l\'employé');
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de l\'employé');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);
  
  const handleRefresh = () => {
    loadEmployeeData(true);
  };
  
  const handleAddPayment = () => {
    setNewPayment({
      description: '',
      amount: '',
      date: formatDate(new Date())
    });
    setPaymentModalVisible(true);
  };

  const handleSavePayment = async () => {
    if (!newPayment.description || !newPayment.amount) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }
    
    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Le montant doit être un nombre positif');
      return;
    }
    
    try {
      const paymentData = {
        ...newPayment,
        amount: amount,
        date: newPayment.date
      };
      
      const result = await employeeService.payEmployee(employeeId, paymentData);
      
      if (result.success) {
        // Update the employee object with the new payment
        if (employee) {
          const payments = employee.payments || [];
          const updatedEmployee = {
            ...employee,
            payments: [...payments, result.payment],
            balance: result.updatedBalance !== undefined ? result.updatedBalance : (employee.balance || 0) + amount,
            lastPayment: result.lastPayment || newPayment.date
          };
          
          setEmployee(updatedEmployee);
        }
        
        setPaymentModalVisible(false);
        
        if (result.isOffline) {
          Alert.alert('Mode hors ligne', 'Le paiement a été ajouté en mode hors ligne et sera synchronisé lorsque vous serez en ligne.');
        } else {
          Alert.alert('Succès', 'Paiement ajouté avec succès');
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible d\'ajouter le paiement');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout du paiement');
    }
  };

  const handleResetFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: '',
      isActive: false
    });
  };

  const handleApplyFilter = () => {
    // Validate dates
    const startDate = parseDate(dateFilter.startDate);
    const endDate = parseDate(dateFilter.endDate);
    
    if (dateFilter.startDate && !startDate) {
      Alert.alert('Erreur', 'Date de début invalide. Utilisez le format JJ/MM/AAAA');
      return;
    }
    
    if (dateFilter.endDate && !endDate) {
      Alert.alert('Erreur', 'Date de fin invalide. Utilisez le format JJ/MM/AAAA');
      return;
    }
    
    if (startDate && endDate && startDate > endDate) {
      Alert.alert('Erreur', 'La date de début doit être antérieure à la date de fin');
      return;
    }
    
    setDateFilter({
      ...dateFilter,
      isActive: !!(dateFilter.startDate || dateFilter.endDate)
    });
    setDateFilterModalVisible(false);
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }
  
  if (!employee) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={styles.errorText}>Employé non trouvé</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Sort payments by date (most recent first) and apply date filter if active
  const sortedPayments = [...(employee.payments || [])]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .filter(payment => {
      if (!dateFilter.isActive) return true;
      
      const paymentDate = parseDate(payment.date);
      const startDate = dateFilter.startDate ? parseDate(dateFilter.startDate) : null;
      const endDate = dateFilter.endDate ? parseDate(dateFilter.endDate) : null;
      
      if (!paymentDate) return true;
      if (startDate && paymentDate < startDate) return false;
      if (endDate) {
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        if (paymentDate > endDate) return false;
      }
      
      return true;
    });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{employee.name}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={[colors.primary]}
          />
        }
      >
        {/* Add Payment Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.addPaymentButton}
            onPress={handleAddPayment}
          >
            <Icon name="cash-plus" size={20} color={colors.white} />
            <Text style={styles.addPaymentButtonText}>Ajouter un paiement</Text>
          </TouchableOpacity>
        </View>
        
        {/* Date Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, dateFilter.isActive && styles.filterActiveButton]}
          onPress={() => setDateFilterModalVisible(true)}
        >
          <Icon 
            name="calendar-filter" 
            size={18} 
            color={dateFilter.isActive ? colors.white : colors.primary} 
          />
          <Text 
            style={[
              styles.filterButtonText, 
              dateFilter.isActive && styles.filterActiveText
            ]}
          >
            {dateFilter.isActive 
              ? `Filtré ${dateFilter.startDate ? `Du: ${dateFilter.startDate}` : ''} ${dateFilter.endDate ? `Au: ${dateFilter.endDate}` : ''}`
              : 'Filtrer par date'}
          </Text>
          
          {dateFilter.isActive && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={handleResetFilter}
            >
              <Icon name="close-circle" size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        
        {/* Payments list header */}
        <Text style={styles.listHeaderText}>
          Historique des paiements ({sortedPayments.length})
        </Text>
        
        {/* List of payments */}
        <View style={styles.listContainer}>
          {sortedPayments.length > 0 ? (
            sortedPayments.map((payment, index) => (
              <View key={payment.id || index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDescription}>{payment.description}</Text>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                </View>
                <Text style={styles.paymentAmount}>{payment.amount} MAD</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {dateFilter.isActive 
                  ? 'Aucun paiement trouvé pour cette période'
                  : 'Aucun paiement pour cet employé'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Add Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau paiement</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={newPayment.description}
                onChangeText={(text) => setNewPayment({...newPayment, description: text})}
                placeholder="Description du paiement"
              />
              
              <Text style={styles.inputLabel}>Montant (MAD)</Text>
              <TextInput
                style={styles.textInput}
                value={newPayment.amount}
                onChangeText={(text) => setNewPayment({...newPayment, amount: text})}
                placeholder="Montant du paiement"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={newPayment.date}
                onChangeText={(text) => setNewPayment({...newPayment, date: text})}
                placeholder="DD/MM/YYYY"
                editable={false}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSavePayment}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Date Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dateFilterModalVisible}
        onRequestClose={() => setDateFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrer par date</Text>
              <TouchableOpacity onPress={() => setDateFilterModalVisible(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Date de début (JJ/MM/AAAA)</Text>
              <TextInput
                style={styles.textInput}
                value={dateFilter.startDate}
                onChangeText={(text) => setDateFilter({...dateFilter, startDate: text})}
                placeholder="JJ/MM/AAAA"
              />
              
              <Text style={styles.inputLabel}>Date de fin (JJ/MM/AAAA)</Text>
              <TextInput
                style={styles.textInput}
                value={dateFilter.endDate}
                onChangeText={(text) => setDateFilter({...dateFilter, endDate: text})}
                placeholder="JJ/MM/AAAA"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleResetFilter}
                >
                  <Text style={styles.cancelButtonText}>Réinitialiser</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleApplyFilter}
                >
                  <Text style={styles.saveButtonText}>Appliquer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    elevation: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginVertical: 16,
    textAlign: 'center',
  },
  backButton: {
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  actionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  addPaymentButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  filterActiveButton: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  filterActiveText: {
    color: colors.white,
  },
  clearFilterButton: {
    marginLeft: 8,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.income,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontWeight: 'bold',
    color: colors.white,
  },
});