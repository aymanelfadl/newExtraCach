import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { HomeButton } from "../../components/HomeButton";
import AddExpense from '../../components/AddExpense';
import AddRevenue from '../../components/AddRevenue';
import Header from '../../components/Header';
import { colors, spacing, borderRadius, typography, shadows, commonStyles } from '../../styles/theme';
import { authService, userService, transactionService } from '../../services/index';

const Home = () => {
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [revenueModalVisible, setRevenueModalVisible] = useState(false);
  const [userSwitchModalVisible, setUserSwitchModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: 'aymanelfadl' });
  const [viewingAsUser, setViewingAsUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  // Current date formatting
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Fetch current user and users with shared access
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          
          // Get list of users who have granted access to current user
          const result = await userService.getUsersWithSharedAccess();
          if (result.success) {
            setAvailableUsers(result.users);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);
  
  // Mock data for recent transactions - in real app, this would use the transaction service
  const [recentTransactions, setRecentTransactions] = useState([]);

  const quickActionBtns = [
    { 
      title: "Dépense",
      description: "Nouvelle dépense", 
      onPress: () => {
        if (viewingAsUser) {
          Alert.alert(
            "Action limitée", 
            "Vous ne pouvez pas ajouter de dépenses lorsque vous consultez le compte d'un autre utilisateur."
          );
        } else {
          setExpenseModalVisible(true);
        }
      },
      backgroundColor: colors.expense,
      icon: "cash-minus" 
    },
    { 
      title: "Revenu", 
      description: "Nouveau revenu",
      onPress: () => {
        if (viewingAsUser) {
          Alert.alert(
            "Action limitée", 
            "Vous ne pouvez pas ajouter de revenus lorsque vous consultez le compte d'un autre utilisateur."
          );
        } else {
          setRevenueModalVisible(true);
        }
      },
      backgroundColor: colors.income,
      icon: "cash-plus" 
    },
    {
      title: "Employé", 
      description: "Dép. employé",
      onPress: () => {
        if (viewingAsUser) {
          Alert.alert(
            "Action limitée", 
            "Vous ne pouvez pas effectuer cette action lorsque vous consultez le compte d'un autre utilisateur."
          );
        } else {
          alert("Dépense pour Employé");
        }
      },
      backgroundColor: colors.primary,
      icon: "account-cash" 
    },
  ];

  const handleSaveExpense = async (expenseData) => {
    // In a real app, you'd use the transaction service here
    const newTransaction = {
      id: Date.now().toString(),
      description: expenseData.description,
      spends: expenseData.spends,
      dateAdded: expenseData.dateAdded,
      isExpense: true,
      time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
    };
    
    // validate the new transaction
    if (newTransaction.spends <= 0) {
      Alert.alert("Erreur", "Le montant de la dépense doit être supérieur à zéro.");
      return;
    }
    // add the new transaction to data base
    try {
       const result = await transactionService.addTransaction(newTransaction);
       if (!result.success) {
         Alert.alert("Erreur", "Impossible d'ajouter la dépense.");
         return;
       }
    }catch (err)
    {
      console.log(err);
      
    }
    Alert.alert("Dépense ajoutée", `Dépense de ${expenseData.spends} MAD ajoutée avec succès.`);
    setRecentTransactions([newTransaction, ...recentTransactions]);
    setExpenseModalVisible(false);
  };

  const handleSaveRevenue = (revenueData) => {
    // In a real app, you'd use the transaction service here
    const newTransaction = {
      id: Date.now().toString(),
      description: revenueData.description,
      spends: revenueData.spends,
      dateAdded: revenueData.dateAdded,
      isExpense: false,
      time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
    };
    
    setRecentTransactions([newTransaction, ...recentTransactions]);
    setRevenueModalVisible(false);
  };

  // User switching handlers
  const handleOpenUserSwitch = () => {
    setUserSwitchModalVisible(true);
  };

  const handleSelectUser = async (user) => {
    try {
      if (user) {
        // In real app, you'd use the authService viewAs method
        setViewingAsUser(user);
        
        // Fetch the selected user's transactions
        // This would call transactionService.getTransactionsForUser(user.uid) in real app
        
        // For demo, just show an alert
        Alert.alert(
          "Compte utilisateur changé",
          `Vous consultez maintenant le compte de ${user.fullName}`
        );
      } else {
        // Switch back to own account
        setViewingAsUser(null);
        
        // Reload the current user's transactions
        // This would call transactionService.getTransactions() in real app
        
        Alert.alert(
          "Retour à votre compte",
          "Vous consultez maintenant votre propre compte"
        );
      }
    } catch (error) {
      console.error('Error switching user:', error);
      Alert.alert("Erreur", "Impossible de changer d'utilisateur");
    } finally {
      setUserSwitchModalVisible(false);
    }
  };

  // Calculate today's balance
  const todayDate = '15/04/2025'; // In real app, use actual today's date
  const todayTransactions = recentTransactions.filter(t => t.dateAdded === todayDate);
  const todayIncome = todayTransactions
    .filter(t => !t.isExpense)
    .reduce((sum, t) => sum + t.spends, 0);
  const todayExpenses = todayTransactions
    .filter(t => t.isExpense)
    .reduce((sum, t) => sum + t.spends, 0);
  const todayBalance = todayIncome - todayExpenses;

  return (
    <View style={styles.container}>
      <Header 
        screenName={"Accueil"} 
        showUserSwitch={true} 
        onUserSwitchPress={handleOpenUserSwitch}
        viewingAsUser={viewingAsUser}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Viewing as banner - show only when viewing as another user */}
        {viewingAsUser && (
          <View style={styles.viewingAsBanner}>
            <Icon name="account-eye" size={20} color={colors.white} />
            <Text style={styles.viewingAsText}>
              Consultation du compte de {viewingAsUser.fullName}
            </Text>
            <TouchableOpacity onPress={() => handleSelectUser(null)}>
              <Text style={styles.exitViewingText}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}
      
        {/* Today's summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Aujourd'hui - {formattedDate}</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Icon name="arrow-down-bold-circle" size={24} color={colors.income} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Revenus</Text>
                <Text style={[styles.summaryValue, {color: colors.income}]}>+{todayIncome} MAD</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryItem}>
              <Icon name="arrow-up-bold-circle" size={24} color={colors.expense} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Dépenses</Text>
                <Text style={[styles.summaryValue, {color: colors.expense}]}>-{todayExpenses} MAD</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryItem}>
              <Icon name="calculator" size={24} color={colors.primary} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Solde</Text>
                <Text style={[styles.summaryValue, {
                  color: todayBalance >= 0 ? colors.income : colors.expense
                }]}>
                  {todayBalance >= 0 ? '+' : ''}{todayBalance} MAD
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Modern Quick Action Buttons */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsContainer}>
          {quickActionBtns.map((btn, index) => (
            <HomeButton key={index} btnData={btn} compact={true} /> 
          ))}
        </View>
        
        {/* Recent transactions */}
        <View style={styles.recentTransactionsHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity onPress={() => {}} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Voir tout</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.transactionsList}>
          {recentTransactions.map((transaction, index) => (
            <View key={transaction.id} style={[
              styles.transactionItem,
              index === recentTransactions.length - 1 ? styles.lastTransactionItem : null
            ]}>
              <View style={[
                styles.transactionIconContainer, 
                {backgroundColor: transaction.isExpense ? colors.expense : colors.income}
              ]}>
                <Icon 
                  name={transaction.isExpense ? "cash-minus" : "cash-plus"} 
                  size={20} 
                  color="white" 
                />
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.dateAdded} • {transaction.time}
                </Text>
              </View>
              
              <Text style={[
                styles.transactionAmount, 
                {color: transaction.isExpense ? colors.expense : colors.income}
              ]}>
                {transaction.isExpense ? '-' : '+'}{transaction.spends} MAD
              </Text>
            </View>
          ))}
        </View>
        
        {/* User info */}
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            Connecté en tant que <Text style={styles.username}>
              {viewingAsUser ? `${currentUser.username} (vue: ${viewingAsUser.fullName})` : currentUser.username}
            </Text>
          </Text>
        </View>
      </ScrollView>
      
      {/* Expense and Revenue Modals */}
      <AddExpense 
        visible={expenseModalVisible} 
        onClose={() => setExpenseModalVisible(false)} 
        onSave={handleSaveExpense}
      />
      
      <AddRevenue 
        visible={revenueModalVisible} 
        onClose={() => setRevenueModalVisible(false)} 
        onSave={handleSaveRevenue}
      />
      
      {/* User Switch Modal */}
      <Modal
        visible={userSwitchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUserSwitchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userSwitchModal}>
            <View style={styles.userSwitchHeader}>
              <Text style={styles.userSwitchTitle}>Voir les comptes partagés</Text>
              <TouchableOpacity 
                onPress={() => setUserSwitchModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.userSwitchDescription}>
              Vous pouvez consulter les comptes qui ont été partagés avec vous.
              Vous pourrez voir les données sans les modifier.
            </Text>
            
            {/* Current user account option */}
            <TouchableOpacity 
              style={[styles.userSwitchItem, !viewingAsUser ? styles.activeUserItem : null]}
              onPress={() => handleSelectUser(null)}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>{currentUser.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userSwitchDetails}>
                <Text style={styles.userSwitchName}>
                  {currentUser.fullName || currentUser.username} (Vous)
                </Text>
                <Text style={styles.userSwitchEmail}>{currentUser.email || 'votre@email.com'}</Text>
              </View>
              {!viewingAsUser && (
                <Icon name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            {/* Mock shared accounts - in real app, use availableUsers from the API */}
            <TouchableOpacity 
              style={[styles.userSwitchItem, viewingAsUser?.uid === '123' ? styles.activeUserItem : null]}
              onPress={() => handleSelectUser({
                uid: '123',
                fullName: 'Mohammed Alami',
                email: 'mohammed@example.com'
              })}
            >
              <View style={[styles.userAvatar, {backgroundColor: colors.income}]}>
                <Text style={styles.userInitial}>M</Text>
              </View>
              <View style={styles.userSwitchDetails}>
                <Text style={styles.userSwitchName}>Mohammed Alami</Text>
                <Text style={styles.userSwitchEmail}>mohammed@example.com</Text>
              </View>
              {viewingAsUser?.uid === '123' && (
                <Icon name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.userSwitchItem, viewingAsUser?.uid === '456' ? styles.activeUserItem : null]}
              onPress={() => handleSelectUser({
                uid: '456',
                fullName: 'Sara Bennani',
                email: 'sara@example.com'
              })}
            >
              <View style={[styles.userAvatar, {backgroundColor: colors.warning}]}>
                <Text style={styles.userInitial}>S</Text>
              </View>
              <View style={styles.userSwitchDetails}>
                <Text style={styles.userSwitchName}>Sara Bennani</Text>
                <Text style={styles.userSwitchEmail}>sara@example.com</Text>
              </View>
              {viewingAsUser?.uid === '456' && (
                <Icon name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            <Text style={styles.userSwitchFooter}>
              Les données consultées sont en lecture seule.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge * 2,
  },
  viewingAsBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  viewingAsText: {
    color: colors.white,
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
    flex: 1,
    marginLeft: spacing.small,
  },
  exitViewingText: {
    color: colors.white,
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightBold,
    textDecorationLine: 'underline',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    marginBottom: spacing.large,
    ...shadows.medium,
  },
  summaryTitle: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryTextContainer: {
    marginTop: spacing.small,
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
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  sectionTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
    marginTop: spacing.medium,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.large,
    paddingHorizontal: spacing.medium,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: typography.weightSemiBold,
    marginRight: spacing.tiny,
  },
  transactionsList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    ...shadows.medium,
    overflow: 'hidden',
    marginBottom: spacing.large,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  transactionDate: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightBold,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: spacing.medium,
  },
  userInfoText: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  username: {
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  
  // User switching modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
  },
  userSwitchModal: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    width: '100%',
    maxWidth: 500,
    ...shadows.large,
  },
  userSwitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  userSwitchTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.small,
  },
  userSwitchDescription: {
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
    marginBottom: spacing.large,
  },
  userSwitchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
    backgroundColor: colors.background,
  },
  activeUserItem: {
    backgroundColor: `${colors.primary}20`, // 20% opacity primary color
    borderWidth: 1,
    borderColor: colors.primary,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  userInitial: {
    color: colors.white,
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
  },
  userSwitchDetails: {
    flex: 1,
  },
  userSwitchName: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  userSwitchEmail: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  userSwitchFooter: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.medium,
  },
});

export default Home;