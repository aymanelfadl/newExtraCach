import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { HomeButton } from "../../components/HomeButton";
import AddExpense from '../../components/AddExpense';
import AddRevenue from '../../components/AddRevenue';
import Header from '../../components/Header';
import { colors, spacing, borderRadius, typography, shadows, commonStyles } from '../../styles/theme';

const Home = () => {
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [revenueModalVisible, setRevenueModalVisible] = useState(false);
  
  // Current date formatting
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Mock data for recent transactions
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: '1',
      description: 'Courses alimentaires',
      spends: 250,
      dateAdded: '15/04/2025',
      isExpense: true,
      time: '13:45'
    },
    {
      id: '2',
      description: 'Salaire',
      spends: 4500,
      dateAdded: '15/04/2025',
      isExpense: false,
      time: '09:30'
    },
    {
      id: '3',
      description: 'Transport',
      spends: 100,
      dateAdded: '14/04/2025',
      isExpense: true,
      time: '18:20'
    },
    {
      id: '4',
      description: 'Freelance',
      spends: 1200,
      dateAdded: '12/04/2025',
      isExpense: false,
      time: '16:15'
    },
  ]);

  const quickActionBtns = [
    { 
      title: "Dépense",
      description: "Nouvelle dépense", 
      onPress: () => setExpenseModalVisible(true),
      backgroundColor: colors.expense,
      icon: "cash-minus" 
    },
    { 
      title: "Revenu", 
      description: "Nouveau revenu",
      onPress: () => setRevenueModalVisible(true),
      backgroundColor: colors.income,
      icon: "cash-plus" 
    },
    {
      title: "Employé", 
      description: "Dép. employé",
      onPress: () => alert("Dépense pour Employé"),
      backgroundColor: colors.primary,
      icon: "account-cash" 
    },
  ];

  const handleSaveExpense = (expenseData) => {
    // Create new expense transaction
    const newTransaction = {
      id: Date.now().toString(),
      description: expenseData.description,
      spends: expenseData.spends,
      dateAdded: expenseData.dateAdded,
      isExpense: true,
      time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
    };
    
    // Add to recent transactions at the beginning
    setRecentTransactions([newTransaction, ...recentTransactions]);
    setExpenseModalVisible(false);
  };

  const handleSaveRevenue = (revenueData) => {
    // Create new revenue transaction
    const newTransaction = {
      id: Date.now().toString(),
      description: revenueData.description,
      spends: revenueData.spends,
      dateAdded: revenueData.dateAdded,
      isExpense: false,
      time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
    };
    
    // Add to recent transactions at the beginning
    setRecentTransactions([newTransaction, ...recentTransactions]);
    setRevenueModalVisible(false);
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
      <Header screenName={"Accueil"} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.userInfoText}>Connecté en tant que <Text style={styles.username}>aymanelfadl</Text></Text>
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
  }
});

export default Home;