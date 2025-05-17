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
  const [archiveMonths, setArchiveMonths] = useState([]);
  
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

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
        
        // Set archive months (older than 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthsAgoKey = `${threeMonthsAgo.getFullYear()}-${threeMonthsAgo.getMonth()}`;
        
        const oldMonths = monthsData.filter(month => {
          const monthDate = new Date(month.year, month.month);
          return monthDate < threeMonthsAgo;
        });
        
        setArchiveMonths(oldMonths);
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
  
  const handleShowArchiveOptions = () => {
    if (archiveMonths.length === 0) {
      Alert.alert(
        "Aucune donnée à archiver",
        "Il n'y a pas de données antérieures à 3 mois à archiver."
      );
      return;
    }
    
    setArchiveModalVisible(true);
  };
  
  const handleArchiveData = async () => {
    try {
      if (archiveMonths.length === 0) {
        setArchiveModalVisible(false);
        return;
      }
      
      setRefreshing(true);
      
      // Find the most recent date to archive (transactions before this date will be archived)
      const archiveBefore = new Date();
      archiveBefore.setMonth(archiveBefore.getMonth() - 3); // Archive data older than 3 months
      
      // First check if there are actually transactions to archive
      const transactionsResult = await transactionService.getTransactions({
        olderThan: archiveBefore
      });
      
      if (!transactionsResult.success) {
        Alert.alert("Erreur", "Impossible de vérifier les transactions à archiver.");
        setRefreshing(false);
        setArchiveModalVisible(false);
        return;
      }
      
      // Filter transactions older than 3 months
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
          "Il n'y a pas de transactions plus anciennes que 3 mois à archiver."
        );
        setRefreshing(false);
        setArchiveModalVisible(false);
        return;
      }
      
      Alert.alert(
        "Confirmation d'archivage",
        `Êtes-vous sûr de vouloir archiver les données antérieures à ${archiveBefore.toLocaleDateString()} ? Cette action déplacera ${transactionsToArchive.length} transactions dans une archive et les retirera de l'affichage principal. Vous pourrez toujours les consulter dans les archives.`,
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Archiver", 
            onPress: async () => {
              const result = await transactionService.archiveTransactions(archiveBefore);
              
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
            <Icon name="archive-search" size={24} color={colors.secondary} />
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
              <Text style={styles.archiveInfoText}>
                L'archivage déplacera les transactions antérieures à 3 mois vers les archives. 
                Cela permettra d'améliorer les performances de l'application.
              </Text>
              <Text style={styles.archiveInfoText}>
                Vous pouvez toujours consulter ces données dans les archives au besoin.
              </Text>
              <Text style={[styles.archiveInfoText, { fontWeight: 'bold', marginTop: 10 }]}>
                Données à archiver:
              </Text>
              {archiveMonths.map(month => (
                <Text key={month.key} style={styles.archiveMonth}>
                  • {month.label}: {month.count} transactions
                </Text>
              ))}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setArchiveModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleArchiveData}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Archiver</Text>
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
  modalButton: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
  },
  archiveInfo: {
    padding: spacing.medium,
  },
  archiveInfoText: {
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  archiveMonth: {
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
    marginLeft: spacing.medium,
    marginTop: spacing.small,
  }
});

export default Settings;