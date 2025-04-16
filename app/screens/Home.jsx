import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, Modal, RefreshControl } from 'react-native';
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
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const todayDate = today.toLocaleDateString('fr-FR', 
    { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Fetch current user and shared users
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const result = await userService.getUsersWithSharedAccess();
          if (result.success) setAvailableUsers(result.users);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Fetch recent transactions for today
  const fetchTransactions = useCallback(async () => {
    setRefreshing(true);
    try {
      const userId = viewingAsUser ? viewingAsUser.uid : currentUser.uid;
      const { success, transactions, error } = await transactionService.getTransactions();
      if (!success) {
        console.log("getTransactions error:", error);
        Alert.alert("Erreur", "Impossible de récupérer les transactions.\n" + (error || ''));
        return;
      }
      if (success) {
        const todayTxs = transactions.filter(
          t => t.dateAdded === todayDate
        );
        todayTxs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRecentTransactions(todayTxs);
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }
    setRefreshing(false);
  }, [viewingAsUser, currentUser, todayDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, expenseModalVisible, revenueModalVisible, viewingAsUser]);

  const handleSaveExpense = async (expenseData) => {
    if (expenseData.spends <= 0) {
      Alert.alert("Erreur", "Le montant de la dépense doit être supérieur à zéro.");
      return;
    }
    const newTransaction = {
      ...expenseData,
      description: expenseData.description,
      spends: Number(expenseData.spends),
      isExpense: true,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
    };
    try {
      const result = await transactionService.addTransaction(newTransaction);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible d'ajouter la dépense.");
        return;
      }
      setExpenseModalVisible(false);
      fetchTransactions();
      Alert.alert("Dépense ajoutée", `Dépense de ${expenseData.spends} MAD ajoutée avec succès.`);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSaveRevenue = async (revenueData) => {
    if (revenueData.spends <= 0) {
      Alert.alert("Erreur", "Le montant du revenu doit être supérieur à zéro.");
      return;
    }
    const newTransaction = {
      ...revenueData,
      description: revenueData.description,
      spends: Number(revenueData.spends),
      isExpense: false,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
    };
    try {
      const result = await transactionService.addTransaction(newTransaction);
      if (!result.success) {
        Alert.alert("Erreur", "Impossible d'ajouter le revenu.");
        return;
      }
      setRevenueModalVisible(false);
      fetchTransactions();
      Alert.alert("Revenu ajouté", `Revenu de ${revenueData.spends} MAD ajouté avec succès.`);
    } catch (err) {
      console.log(err);
    }
  };

  // User switch handlers
  const handleOpenUserSwitch = () => setUserSwitchModalVisible(true);

  const handleSelectUser = async (user) => {
    try {
      if (user) {
        setViewingAsUser(user);
        Alert.alert("Compte utilisateur changé", `Vous consultez maintenant le compte de ${user.fullName}`);
      } else {
        setViewingAsUser(null);
        Alert.alert("Retour à votre compte", "Vous consultez maintenant votre propre compte");
      }
    } catch (error) {
      console.error('Error switching user:', error);
      Alert.alert("Erreur", "Impossible de changer d'utilisateur");
    } finally {
      setUserSwitchModalVisible(false);
    }
  };

  // Calculate today's summary
  const todayIncome = recentTransactions.filter(t => !t.isExpense).reduce((sum, t) => sum + (Number(t.spends) || 0), 0);
  const todayExpenses = recentTransactions.filter(t => t.isExpense).reduce((sum, t) => sum + (Number(t.spends) || 0), 0);
  const todayBalance = todayIncome - todayExpenses;

  // Quick action buttons
  const quickActionBtns = [
    { 
      title: "Dépense",
      description: "Nouvelle dépense", 
      onPress: () => {
        if (viewingAsUser) {
          Alert.alert("Action limitée", "Vous ne pouvez pas ajouter de dépenses lorsque vous consultez le compte d'un autre utilisateur.");
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
          Alert.alert("Action limitée", "Vous ne pouvez pas ajouter de revenus lorsque vous consultez le compte d'un autre utilisateur.");
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
          Alert.alert("Action limitée", "Vous ne pouvez pas effectuer cette action lorsque vous consultez le compte d'un autre utilisateur.");
        } else {
          Alert.alert("Info", "Bientôt disponible : gestion des dépenses employé !");
        }
      },
      backgroundColor: colors.primary,
      icon: "account-cash" 
    },
  ];

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTransactions} />}
      >
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
          <Text style={styles.summaryTitle}>Aujourd'hui - {todayDate}</Text>
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
                <Text style={[
                  styles.summaryValue,
                  { color: todayBalance >= 0 ? colors.income : colors.expense }
                ]}>
                  {todayBalance >= 0 ? '+' : ''}{todayBalance} MAD
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Quick Action Buttons */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsContainer}>
          {quickActionBtns.map((btn, index) => (
            <HomeButton key={index} btnData={btn} compact={true} /> 
          ))}
        </View>
        {/* Recent transactions */}
        <View style={styles.recentTransactionsHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity onPress={fetchTransactions} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Rafraîchir</Text>
            <Icon name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {recentTransactions.length === 0 ? (
            <Text style={{color: colors.textSecondary, textAlign: 'center', margin: 16}}>Aucune transaction aujourd'hui.</Text>
          ) : (
            recentTransactions.map((transaction, index) => (
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
            ))
          )}
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
                <Text style={styles.userInitial}>{currentUser.username}</Text>
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
            {/* Example shared accounts */}
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