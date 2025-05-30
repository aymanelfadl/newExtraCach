import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  RefreshControl,
  Modal,
  FlatList,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { userService, authService, transactionService, employeeService } from '../../services/index';
import { useUser } from '../../context/UserContext';
import Header from '../../components/Header';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const Settings = () => {
  const { setViewingAsUser, viewingAs } = useUser();
  const navigation = useNavigation();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [monthSelectionVisible, setMonthSelectionVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [showArchiveDatePicker, setShowArchiveDatePicker] = useState(false);
  const [archiveDate, setArchiveDate] = useState(new Date());
  const [transactionsToArchiveCount, setTransactionsToArchiveCount] = useState(0);
  const [archiveButtonPressed, setArchiveButtonPressed] = useState(false);
  
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  // Format date to DD/MM/YYYY
  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert("Erreur", "Utilisateur non authentifié.");
        return;
      }
      setCurrentUser(user);
      const result = await userService.getUsersWithSharedAccess();
      setAvailableUsers(result.users);
      
      // Load available transaction months
      await loadAvailableMonths();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const loadAvailableMonths = async () => {
    try {
      const transactionsResult = await transactionService.getTransactions();
      if (transactionsResult.success) {
        // Extract unique year-month combinations
        const monthSet = new Set();
        const monthsData = [];
        
        transactionsResult.transactions.forEach(transaction => {
          let date;
          
          if (transaction.date) {
            // Parse DD/MM/YYYY format
            const parts = transaction.date.split('/');
            if (parts.length === 3) {
              date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else if (transaction.createdAt) {
            date = new Date(transaction.createdAt);
          }
          
          if (date && !isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const monthKey = `${year}-${month}`;
            
            if (!monthSet.has(monthKey)) {
              monthSet.add(monthKey);
              monthsData.push({
                key: monthKey,
                year,
                month,
                label: `${months[month]} ${year}`,
                count: 1
              });
            } else {
              const monthData = monthsData.find(m => m.key === monthKey);
              if (monthData) {
                monthData.count++;
              }
            }
          }
        });
        
        // Sort by date (newest first)
        monthsData.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        
        setAvailableMonths(monthsData);
        
        // We don't need to set archiveMonths anymore as we're using a date picker now
      }
    } catch (error) {
      console.error('Error loading available months:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const handleUserSwitch = async (user) => {
    try {
      await setViewingAsUser(user);
      Alert.alert("Compte utilisateur changé", `Vous consultez maintenant le compte de ${user.fullName}`);
    } catch (error) {
      console.error('Error switching user:', error);
      Alert.alert("Erreur", "Impossible de changer d'utilisateur.");
    }
  };

  const handleReturnToMyAccount = async () => {
    try {
      await setViewingAsUser(null);
      Alert.alert("Retour à votre compte", "Vous consultez maintenant votre propre compte");
    } catch (error) {
      console.error('Error returning to account:', error);
      Alert.alert("Erreur", "Impossible de revenir à votre compte.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          onPress: async () => {
            await authService.logout();
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleShowMonthSelection = () => {
    setSelectedMonths([]);
    setMonthSelectionVisible(true);
  };
  
  const handleMonthSelect = (monthKey) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthKey)) {
        return prev.filter(key => key !== monthKey);
      } else {
        return [...prev, monthKey];
      }
    });
  };
  
  const handleConfirmMonthSelection = () => {
    if (selectedMonths.length === 0) {
      Alert.alert("Sélection requise", "Veuillez sélectionner au moins un mois à exporter.");
      return;
    }
    
    setMonthSelectionVisible(false);
    handleExportData();
  };
  
  const handleShowArchiveOptions = async () => {
    // Initialize with current date
    const today = new Date();
    const defaultArchiveDate = new Date();
    defaultArchiveDate.setMonth(today.getMonth() - 3); // Default to 3 months ago
    setArchiveDate(defaultArchiveDate);
    
    try {
      // Check if there are any transactions to archive
      const transactionsResult = await transactionService.getTransactions();
      
      if (!transactionsResult.success || transactionsResult.transactions.length === 0) {
        Alert.alert("Aucune donnée à archiver", "Aucune transaction disponible pour l'archivage.");
        return;
      }
      
      // Count transactions older than the selected date
      await checkTransactionsToArchive(defaultArchiveDate);
      
      setArchiveModalVisible(true);
    } catch (error) {
      console.error('Error checking archive transactions:', error);
      Alert.alert("Erreur", "Impossible de vérifier les transactions à archiver.");
    }
  };
  
  const onArchiveDateChange = (event, selectedDate) => {
    setShowArchiveDatePicker(false);
    if (selectedDate) {
      setArchiveDate(selectedDate);
      checkTransactionsToArchive(selectedDate);
    }
  };
  
  const checkTransactionsToArchive = async (date) => {
    try {
      const transactionsResult = await transactionService.getTransactions();
      
      if (transactionsResult.success) {
        // Count transactions older than the selected date
        const count = transactionsResult.transactions.filter(transaction => {
          let transactionDate;
          if (transaction.date) {
            const parts = transaction.date.split('/');
            if (parts.length === 3) {
              transactionDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else if (transaction.createdAt) {
            transactionDate = new Date(transaction.createdAt);
          }
          
          return transactionDate && transactionDate < date;
        }).length;
        
        setTransactionsToArchiveCount(count);
      }
    } catch (error) {
      console.error('Error counting transactions to archive:', error);
    }
  };
  
  const handleArchiveData = async () => {
    try {
      if (transactionsToArchiveCount === 0) {
        Alert.alert("Information", "Aucune transaction à archiver avant cette date.");
        setArchiveModalVisible(false);
        return;
      }
      
      setRefreshing(true);
      
      // Use the selected date as the cutoff for archiving
      const archiveBefore = archiveDate;
      
      // First check if there are actually transactions to archive
      const transactionsResult = await transactionService.getTransactions();
      
      if (!transactionsResult.success) {
        Alert.alert("Erreur", "Impossible de vérifier les transactions à archiver.");
        setRefreshing(false);
        setArchiveModalVisible(false);
        return;
      }
      
      // Filter transactions older than the selected date
      const transactionsToArchive = transactionsResult.transactions.filter(transaction => {
        let date;
        if (transaction.date) {
          // Parse DD/MM/YYYY format
          const parts = transaction.date.split('/');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        } else if (transaction.createdAt) {
          date = new Date(transaction.createdAt);
        }
        
        return date && date < archiveBefore;
      });
      
      if (transactionsToArchive.length === 0) {
        Alert.alert(
          "Aucune donnée à archiver",
          "Il n'y a pas de transactions à archiver avant la date sélectionnée."
        );
        setRefreshing(false);
        setArchiveModalVisible(false);
        return;
      }
      
      Alert.alert(
        "Confirmation d'archivage",
        `Êtes-vous sûr de vouloir archiver les données antérieures au ${formatDate(archiveDate)} ? Cette action déplacera ${transactionsToArchive.length} transactions dans une archive et les retirera de l'affichage principal. Vous pourrez toujours les consulter dans les archives.`,
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Archiver", 
            onPress: async () => {
              const result = await transactionService.archiveTransactions(archiveDate);
              
              if (result.success) {
                Alert.alert(
                  "Données archivées",
                  `${result.archivedCount} transactions ont été archivées avec succès.`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        loadData();
                        setArchiveModalVisible(false);
                      }
                    }
                  ]
                );
              } else if (result.requiresIndex && result.indexUrl) {
                // Handle Firebase index error
                Alert.alert(
                  "Configuration requise",
                  "Une configuration Firebase supplémentaire est nécessaire pour cette opération. Veuillez cliquer sur 'Créer Index' et attendre quelques minutes que l'index soit créé avant de réessayer.",
                  [
                    {
                      text: "Créer Index",
                      onPress: async () => {
                        const supported = await Linking.canOpenURL(result.indexUrl);
                        if (supported) {
                          await Linking.openURL(result.indexUrl);
                        } else {
                          Alert.alert("Erreur", "Impossible d'ouvrir le lien. Veuillez contacter le support technique.");
                        }
                        setArchiveModalVisible(false);
                      }
                    },
                    {
                      text: "Annuler",
                      style: "cancel",
                      onPress: () => setArchiveModalVisible(false)
                    }
                  ]
                );
              } else {
                Alert.alert(
                  "Erreur d'archivage",
                  result.error || "Une erreur s'est produite lors de l'archivage des données."
                );
                setArchiveModalVisible(false);
              }
              
              setRefreshing(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error archiving data:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de l'archivage des données.");
      setRefreshing(false);
      setArchiveModalVisible(false);
    }
  };

  const handleExportData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch transactions
      const transactionsResult = await transactionService.getTransactions();
      if (!transactionsResult.success) {
        throw new Error("Erreur lors de la récupération des transactions");
      }
      
      // Fetch employees
      const employeesResult = await employeeService.getEmployees();
      if (!employeesResult.success) {
        throw new Error("Erreur lors de la récupération des employés");
      }
      
      // Filter transactions by selected months if any
      let filteredTransactions = transactionsResult.transactions;
      
      if (selectedMonths.length > 0) {
        filteredTransactions = transactionsResult.transactions.filter(transaction => {
          let date;
          
          if (transaction.date) {
            // Parse DD/MM/YYYY format
            const parts = transaction.date.split('/');
            if (parts.length === 3) {
              date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else if (transaction.createdAt) {
            date = new Date(transaction.createdAt);
          }
          
          if (date && !isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const monthKey = `${year}-${month}`;
            return selectedMonths.includes(monthKey);
          }
          
          return false;
        });
      }
      
      // Prepare workbook
      const wb = XLSX.utils.book_new();
      
      // Split transactions by type
      const expenses = filteredTransactions.filter(t => t.type === 'expense');
      const revenues = filteredTransactions.filter(t => t.type === 'revenue');

      console.log(`Exporting ${expenses.length} expenses and ${revenues.length} revenues`);
      
      // Create expenses worksheet
      const expensesData = expenses.map(transaction => ({
        ID: transaction.id,
        Date: transaction.date || new Date(transaction.createdAt).toLocaleDateString(),
        Montant: transaction.amount,
        Description: transaction.description || '',
        Heure: transaction.time || '',
      }));
      const expensesWS = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesWS, "Dépenses");
      
      // Create revenues worksheet
      const revenuesData = revenues.map(transaction => ({
        ID: transaction.id,
        Date: transaction.date || new Date(transaction.createdAt).toLocaleDateString(),
        Montant: transaction.amount,
        Description: transaction.description || '',
        Heure: transaction.time || '',
      }));
      const revenuesWS = XLSX.utils.json_to_sheet(revenuesData);
      XLSX.utils.book_append_sheet(wb, revenuesWS, "Revenus");
      
      // Create employees worksheet
      const employeesData = employeesResult.employees.map(employee => ({
        ID: employee.id,
        Nom: employee.name,
        Solde: employee.balance,
        Téléphone: employee.phone || '',
        Email: employee.email || '',
        Entrée: new Date(employee.createdAt).toLocaleDateString(),
      }));
      const employeesWS = XLSX.utils.json_to_sheet(employeesData);
      XLSX.utils.book_append_sheet(wb, employeesWS, "Employés");
      
      // Create shared users worksheet
      const sharedUsersData = availableUsers.map(user => ({
        ID: user.uid,
        Nom: user.fullName,
        Email: user.email,
      }));
      const sharedUsersWS = XLSX.utils.json_to_sheet(sharedUsersData);
      XLSX.utils.book_append_sheet(wb, sharedUsersWS, "Utilisateurs Partagés");

      // Add summary worksheet
      const summary = [
        { Catégorie: 'Dépenses', 'Nombre': expenses.length, 'Total': expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) },
        { Catégorie: 'Revenus', 'Nombre': revenues.length, 'Total': revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) },
        { Catégorie: 'Employés', 'Nombre': employeesResult.employees.length, 'Total': employeesResult.employees.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0) },
        { Catégorie: 'Utilisateurs Partagés', 'Nombre': availableUsers.length, 'Total': 'N/A' },
      ];
      const summaryWS = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, summaryWS, "Résumé");
      
      // Verify the sheets
      console.log('Excel sheets:', wb.SheetNames);
      
      // Convert to binary excel format
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      // Generate file name with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `ExtraCash_Export_${dateStr}.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Write to file system
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Partage non disponible", "Le partage de fichiers n'est pas disponible sur cet appareil.");
      }
      
      setRefreshing(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'exportation des données: " + error.message);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header screenName="Paramètres" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Gestion de Compte</Text>
          <View style={styles.sectionContent}>
            {currentUser && (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  !viewingAs && styles.activeUserItem
                ]}
                onPress={handleReturnToMyAccount}
              >
                <View style={styles.userIcon}>
                  <Text style={styles.userInitial}>{currentUser.fullName?.charAt(0) || currentUser.username?.charAt(0) || "?"}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{currentUser.fullName || currentUser.username} (Vous)</Text>
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                </View>
                {!viewingAs && <Icon name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            )}

            {availableUsers.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Comptes partagés</Text>
                {availableUsers.map(item => (
                  <TouchableOpacity
                    key={item.uid}
                    style={[
                      styles.userItem,
                      viewingAs?.uid === item.uid && styles.activeUserItem
                    ]}
                    onPress={() => handleUserSwitch(item)}
                  >
                    <View style={[styles.userIcon, {backgroundColor: colors.income}]}>
                      <Text style={styles.userInitial}>{item.fullName?.charAt(0) || "?"}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.fullName}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    {viewingAs?.uid === item.uid && <Icon name="check-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {availableUsers.length === 0 && !refreshing && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucun utilisateur partagé</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddSharedUser')}
          >
            <Icon name="account-plus" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Ajouter un utilisateur partagé</Text>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShowMonthSelection}
          >
            <Icon name="file-excel" size={24} color={colors.income} />
            <Text style={styles.actionButtonText}>Exporter les données vers Excel</Text>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShowArchiveOptions}
          >
            <Icon name="archive" size={24} color={colors.warning} />
            <Text style={styles.actionButtonText}>Archiver les anciennes données</Text>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ArchivedTransactions')}
          >
            <Icon name="archive-search" size={24} color={colors.crimson} />
            <Text style={styles.actionButtonText}>Consulter les données archivées</Text>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color={colors.white} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Month Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={monthSelectionVisible}
        onRequestClose={() => setMonthSelectionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner les mois à exporter</Text>
              <TouchableOpacity onPress={() => setMonthSelectionVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={availableMonths}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.monthItem,
                    selectedMonths.includes(item.key) && styles.selectedMonthItem
                  ]}
                  onPress={() => handleMonthSelect(item.key)}
                >
                  <Text style={styles.monthItemText}>{item.label}</Text>
                  <Text style={styles.monthItemCount}>{item.count} transactions</Text>
                  {selectedMonths.includes(item.key) && (
                    <Icon name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.monthList}
            />
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setMonthSelectionVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmMonthSelection}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Exporter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Archive Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={archiveModalVisible}
        onRequestClose={() => setArchiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Archiver les anciennes données</Text>
              <TouchableOpacity onPress={() => setArchiveModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.archiveInfo}>
              <View style={styles.archiveCardContainer}>
                <View style={styles.archiveDateCard}>
                  <Text style={styles.archiveDateCardTitle}>
                    Sélectionnez une date limite
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.dateSelectorEnhanced}
                    onPress={() => setShowArchiveDatePicker(true)}
                  >
                    <View style={styles.dateSelectorContent}>
                      <Icon name="calendar" size={24} color={colors.primary} />
                      <Text style={styles.dateSelectorValueEnhanced}>
                        {formatDate(archiveDate)}
                      </Text>
                    </View>
                    <Text style={styles.dateSelectorHelp}>Appuyez pour modifier</Text>
                  </TouchableOpacity>
                  
                  {showArchiveDatePicker && (
                    <DateTimePicker
                      value={archiveDate}
                      mode="date"
                      display="default"
                      onChange={onArchiveDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              </View>
              
              <View style={styles.archiveResultContainer}>
                <Icon 
                  name={transactionsToArchiveCount > 0 ? "information" : "alert"} 
                  size={24} 
                  color={transactionsToArchiveCount > 0 ? colors.primary : colors.warning} 
                />
                
                {transactionsToArchiveCount > 0 ? (
                  <Text style={styles.archiveResultText}>
                    <Text style={styles.archiveResultHighlight}>{transactionsToArchiveCount}</Text> transactions seront archivées
                    (antérieures au {formatDate(archiveDate)}).
                  </Text>
                ) : (
                  <Text style={styles.archiveResultTextWarning}>
                    Aucune transaction trouvée avant cette date.
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.modalFooterEnhanced}>
              <TouchableOpacity 
                style={[styles.modalButtonEnhanced, styles.cancelButtonEnhanced]}
                onPress={() => setArchiveModalVisible(false)}
              >
                <Icon name="close" size={18} color={colors.textPrimary} />
                <Text style={styles.cancelButtonTextEnhanced}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButtonEnhanced, 
                  styles.confirmButtonEnhanced,
                  archiveButtonPressed && { backgroundColor: colors.warning },
                  transactionsToArchiveCount === 0 && styles.disabledButtonEnhanced
                ]}
                onPress={handleArchiveData}
                disabled={transactionsToArchiveCount === 0}
                onPressIn={() => setArchiveButtonPressed(true)}
                onPressOut={() => setArchiveButtonPressed(false)}
              >
                <Icon name="archive" size={18} color={colors.white} />
                <Text style={styles.confirmButtonTextEnhanced}>Archiver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge * 2,
  },
  settingSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    marginBottom: spacing.medium,
    ...shadows.medium,
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionContent: {
    padding: spacing.small,
  },
  subsectionTitle: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
    marginLeft: spacing.small,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.small,
  },
  activeUserItem: {
    backgroundColor: `${colors.primary}15`,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  userInitial: {
    color: colors.white,
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: spacing.large,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: typography.sizeRegular,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: spacing.medium,
    fontSize: typography.sizeMedium,
    color: colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginTop: spacing.medium,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    ...shadows.small,
  },
  logoutText: {
    color: colors.white,
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
    marginLeft: spacing.small,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    width: '100%',
    maxHeight: '80%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  monthList: {
    padding: spacing.medium,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  selectedMonthItem: {
    backgroundColor: `${colors.primary}15`,
  },
  monthItemText: {
    flex: 1,
    fontSize: typography.sizeMedium,
    color: colors.textPrimary,
  },
  monthItemCount: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginRight: spacing.small,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalFooterEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalButton: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonEnhanced: {
    flexDirection: 'row',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
    backgroundColor: colors.backgroundAlt,
  },
  cancelButton: {
    backgroundColor: colors.darkBlue,
  },
  cancelButtonEnhanced: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonEnhanced: {
    backgroundColor: colors.primary, 
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  disabledButtonEnhanced: {
    backgroundColor: colors.textDisabled,
    opacity: 0.8,
  },
  modalButtonText: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
  },
  cancelButtonTextEnhanced: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginLeft: spacing.small,
  },
  confirmButtonTextEnhanced: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
    color: colors.white,
    marginLeft: spacing.small,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  archiveInfo: {
    padding: spacing.medium,
  },
  archiveIconContainer: {
    alignItems: 'center',
    marginVertical: spacing.medium,
  },
  archiveTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  archiveInfoText: {
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
    textAlign: 'center',
    lineHeight: typography.sizeRegular * 1.5,
  },
  archiveCardContainer: {
    marginVertical: spacing.medium,
  },
  archiveDateCard: {
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  archiveDateCardTitle: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  dateSelectorEnhanced: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginTop: spacing.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.tiny,
  },
  dateSelectorValueEnhanced: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.primary,
    marginLeft: spacing.small,
  },
  dateSelectorHelp: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginTop: spacing.tiny,
  },
  archiveResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginVertical: spacing.medium,
  },
  archiveResultText: {
    flex: 1,
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
    marginLeft: spacing.small,
  },
  archiveResultTextWarning: {
    flex: 1,
    fontSize: typography.sizeRegular,
    color: colors.warning,
    marginLeft: spacing.small,
    fontWeight: typography.weightMedium,
  },
  archiveResultHighlight: {
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  archiveNote: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  archiveMonth: {
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
    marginLeft: spacing.medium,
    marginTop: spacing.small,
  }
});

export default Settings;