import { useState, useEffect } from 'react';
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
  StatusBar,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempDates, setTempDates] = useState({
    startDate: null,
    endDate: null
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
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  const { isOnline, viewingAs, canModifyData } = useUser();

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
    // Check if user is viewing someone else's data
    if (viewingAs) {
      Alert.alert(
        "Action limitée",
        "Vous ne pouvez pas ajouter de paiements lorsque vous consultez le compte d'un autre utilisateur."
      );
      return;
    }
    
    setNewPayment({
      description: '',
      amount: '',
      date: formatDate(new Date())
    });
    setShowPaymentDatePicker(false);
    setPaymentModalVisible(true);
  };

  const onPaymentDateChange = (event, selectedDate) => {
    setShowPaymentDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewPayment({
        ...newPayment,
        date: formatDate(selectedDate)
      });
    }
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
    setTempDates({
      startDate: null,
      endDate: null
    });
  };

  const handleApplyFilter = () => {
    // Validate dates
    const startDate = dateFilter.startDate ? parseDate(dateFilter.startDate) : null;
    const endDate = dateFilter.endDate ? parseDate(dateFilter.endDate) : null;
    
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

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempDates({...tempDates, startDate: selectedDate});
      setDateFilter({
        ...dateFilter,
        startDate: formatDate(selectedDate)
      });
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempDates({...tempDates, endDate: selectedDate});
      setDateFilter({
        ...dateFilter,
        endDate: formatDate(selectedDate)
      });
    }
  };

  // Date filtering logic enhancements
  const applyDateFilter = (payments) => {
    if (!dateFilter.isActive) return payments;
    
    return payments.filter(payment => {
      const paymentDate = parseDate(payment.date);
      const startDate = dateFilter.startDate ? parseDate(dateFilter.startDate) : null;
      const endDate = dateFilter.endDate ? parseDate(dateFilter.endDate) : null;
      
      if (!paymentDate) return true; // Include if date can't be parsed
      
      // Check start date
      if (startDate) {
        startDate.setHours(0, 0, 0, 0); // Start of day
        if (paymentDate < startDate) return false;
      }
      
      // Check end date
      if (endDate) {
        endDate.setHours(23, 59, 59, 999); // End of day
        if (paymentDate > endDate) return false;
      }
      
      return true;
    });
  };
  
  // Sort payments by date (most recent first) and apply date filter
  const sortedPayments = [...(employee?.payments || [])]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || parseDate(a.date) || 0);
      const dateB = new Date(b.createdAt || parseDate(b.date) || 0);
      return dateB - dateA; // Descending order (newest first)
    });

  // Apply filters
  const filteredPayments = applyDateFilter(sortedPayments);

  const handleDeletePayment = (paymentId, amount) => {
    // Check if user is viewing someone else's data
    if (viewingAs) {
      Alert.alert(
        "Action limitée",
        "Vous ne pouvez pas supprimer de paiements lorsque vous consultez le compte d'un autre utilisateur."
      );
      return;
    }
    
    // Check if offline
    if (!isOnline) {
      Alert.alert(
        "Mode hors ligne",
        "Voulez-vous supprimer ce paiement? La suppression sera synchronisée lorsque vous serez en ligne.",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => deletePayment(paymentId)
          }
        ]
      );
      return;
    }
    
    // If online
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer ce paiement?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => deletePayment(paymentId)
        }
      ]
    );
  };
  
  const deletePayment = async (paymentId) => {
    try {
      const result = await employeeService.deletePayment(employeeId, paymentId);
      
      if (result.success) {
        // Update the employee object in the state
        if (employee) {
          const updatedEmployee = {
            ...employee,
            payments: employee.payments.filter(p => p.id !== paymentId),
            balance: result.updatedBalance || employee.balance - result.deletedPayment?.amount || 0,
            lastPayment: result.lastPayment
          };
          
          setEmployee(updatedEmployee);
        }
        
        if (result.isOffline) {
          Alert.alert('Mode hors ligne', 'La suppression sera synchronisée lorsque vous serez en ligne.');
        } else {
          Alert.alert('Succès', 'Paiement supprimé avec succès');
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de supprimer le paiement');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    }
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
      
      {/* View-only mode indicator */}
      {viewingAs && (
        <View style={styles.viewingAsBanner}>
          <Icon name="account-eye" size={16} color={colors.white} />
          <Text style={styles.viewingAsText}>
            Consultation du compte de {viewingAs.fullName} - Mode lecture seule
          </Text>
        </View>
      )}
      
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
        {/* Date Filter Status - Only show if filter is active */}
        {dateFilter.isActive && (
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Filtré {dateFilter.startDate ? `Du: ${dateFilter.startDate}` : ''} {dateFilter.endDate ? `Au: ${dateFilter.endDate}` : ''}
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={handleResetFilter}
            >
              <Icon name="close-circle" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Payments list header */}
        <Text style={styles.listHeaderText}>
          Historique des paiements ({filteredPayments.length})
        </Text>
        
        {/* List of payments */}
        <View style={styles.listContainer}>
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment, index) => (
              <View key={payment.id || index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDescription}>{payment.description}</Text>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                </View>
                <View style={styles.paymentActions}>
                  <Text style={styles.paymentAmount}>{payment.amount} MAD</Text>
                  {/* Hide delete button when viewing someone else's data */}
                  {!viewingAs && (
                    <TouchableOpacity
                      style={styles.deletePaymentButton}
                      onPress={() => handleDeletePayment(payment.id, payment.amount)}
                    >
                      <Icon name="delete-outline" size={18} color={colors.expense} />
                    </TouchableOpacity>
                  )}
                </View>
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
      
      {/* Circular Add Payment Button (Fixed position) - Only visible when not viewing someone else's data */}
      {!viewingAs && (
        <TouchableOpacity 
          style={styles.addPaymentButtonCircle}
          onPress={handleAddPayment}
        >
          <Icon name="cash-plus" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
      
      {/* Circular Filter Button (Fixed position) */}
      <TouchableOpacity 
        style={[styles.filterButtonCircle, dateFilter.isActive && styles.filterActiveButtonCircle]}
        onPress={() => setDateFilterModalVisible(true)}
      >
        <Icon name="calendar" size={24} color={dateFilter.isActive ? colors.white : colors.primary} />
      </TouchableOpacity>
      
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
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.dateInput]}
                  value={newPayment.date}
                  onChangeText={(text) => setNewPayment({...newPayment, date: text})}
                  placeholder="DD/MM/YYYY"
                  editable={false}
                />
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={() => setShowPaymentDatePicker(true)}
                >
                  <Icon name="calendar" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {showPaymentDatePicker && (
                <DateTimePicker
                  testID="paymentDatePicker"
                  value={parseDate(newPayment.date) || new Date()}
                  mode="date"
                  display="default"
                  onChange={onPaymentDateChange}
                />
              )}
              
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
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.dateInput]}
                  value={dateFilter.startDate}
                  onChangeText={(text) => setDateFilter({...dateFilter, startDate: text})}
                  placeholder="JJ/MM/AAAA"
                />
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Icon name="calendar" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {showStartDatePicker && (
                <DateTimePicker
                  testID="startDatePicker"
                  value={tempDates.startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                />
              )}
              
              <Text style={styles.inputLabel}>Date de fin (JJ/MM/AAAA)</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.dateInput]}
                  value={dateFilter.endDate}
                  onChangeText={(text) => setDateFilter({...dateFilter, endDate: text})}
                  placeholder="JJ/MM/AAAA"
                />
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Icon name="calendar" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {showEndDatePicker && (
                <DateTimePicker
                  testID="endDatePicker"
                  value={tempDates.endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onEndDateChange}
                />
              )}
              
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
  viewingAsBanner: {
    backgroundColor: colors.primary,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewingAsText: {
    color: colors.white,
    marginLeft: 8,
    fontWeight: '200',
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
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: 'bold',
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
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  deletePaymentButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 4,
    backgroundColor: `${colors.errorLight}30`,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    paddingRight: 40,
  },
  calendarButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontWeight: 'bold',
    color: colors.white,
    fontSize: 16,
  },
  filterButtonCircle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filterActiveButtonCircle: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  addPaymentButtonCircle: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
});