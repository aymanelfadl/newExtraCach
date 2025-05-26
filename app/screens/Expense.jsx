import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, RefreshControl } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';

import AddExpense from '../../components/AddExpense';
import Header from '../../components/Header';
import CardList from '../../components/CardList';
import { useUser } from '../../context/UserContext';
import { transactionService } from '../../services/transactionService';

const Expense = () => {
  const { isOnline: userContextOnline } = useUser();
  const isOnline = userContextOnline;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Load expenses when component mounts
  useEffect(() => {
    loadExpenses();
  }, []);
  
  // Load expenses from service
  const loadExpenses = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Get expense transactions from the transaction service
      const result = await transactionService.getTransactions({ 
        type: 'expense',
      });
      
      if (result.success) {
        // Format transactions for CardList component - ensure dateAdded and isExpense are set
        const formattedExpenses = result.transactions.map(transaction => ({
          ...transaction,
          dateAdded: transaction.dateAdded || transaction.date, // Ensure dateAdded is available
          isExpense: true, // Explicitly mark all items as expenses for proper styling
          spends: transaction.spends || transaction.amount // Ensure spends property exists
        }));
        setExpenses(formattedExpenses);
      } else {
        setError(result.error || 'Error loading expenses');
        
        // If there was an error but we have offline data, show a less intrusive notification
        if (result.isOffline) {
          Alert.alert(
            "Mode hors ligne",
            "Les données affichées sont stockées localement et pourraient ne pas être à jour."
          );
        }
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError('Une erreur s\'est produite lors du chargement des dépenses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull to refresh
  const onRefresh = () => {
    loadExpenses(true);
  };
  
  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Filter expenses based on search query
  const filteredItems = () => {
    if (!searchQuery) {
      return expenses;
    }
    
    return expenses.filter(item => 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.amount.toString().includes(searchQuery) ||
      item.date.includes(searchQuery)
    );
  };
  
  // Handle delete expense
  const handleDeletePress = (id) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer cette dépense?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Supprimer", 
          onPress: async () => {
            try {
              const result = await transactionService.deleteTransaction(id);
              
              if (result.success) {
                // Remove from local state only if deletion was successful
                setExpenses(expenses.filter(item => item.id !== id));
                console.log(`Expense deleted: ${id}`);
              } else {
                // Handle offline deletion - it will be synced later
                if (result.isOffline) {
                  // Still update UI, but show offline notification
                  setExpenses(expenses.filter(item => item.id !== id));
                  Alert.alert(
                    "Suppression en mode hors ligne",
                    "La suppression sera synchronisée lorsque vous serez en ligne."
                  );
                } else {
                  // If there was another error (not offline related)
                  Alert.alert("Erreur", result.error || "Impossible de supprimer la dépense");
                }
              }
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert("Erreur", "Une erreur s'est produite lors de la suppression");
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Handle edit expense
  const handleEditPress = (item) => {
    // Convert from service model to component model if needed
    const editableItem = {
      id: item.id,
      description: item.description,
      spends: item.amount, // Assuming amount is stored as 'spends' in the component
      dateAdded: item.date // Assuming date is stored as 'dateAdded' in the component
    };
    
    setEditingItem(editableItem);
    setModalVisible(true);
  };
  
  // Handle close modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
  };
  
  // Handle save expense
  const handleSaveExpense = async (expenseData) => {
    setModalVisible(false);
    setEditingItem(null);
    try {
      let result;
      
      if (editingItem) {
        // Update existing expense
        result = await transactionService.updateTransaction(editingItem.id, {
          description: expenseData.description,
          amount: expenseData.spends, // Convert component field to service field
          date: expenseData.dateAdded, // Convert component field to service field
          type: 'expense'
        });
        
        if (result.success) {
          // Update local state with updated transaction
          setExpenses(expenses.map(item => 
            item.id === editingItem.id ? {
              ...result.transaction,
              dateAdded: expenseData.dateAdded, // Ensure dateAdded is available for UI
              isExpense: true // Explicitly mark as an expense for UI
            } : item
          ));
          console.log(`Expense updated: ${editingItem.id}`);
        }
      } else {
        // Add new expense
        result = await transactionService.addTransaction({
          description: expenseData.description,
          amount: expenseData.spends, // Convert component field to service field
          date: expenseData.dateAdded, // Ensure the date is in DD/MM/YYYY format from AddExpense
          type: 'expense',
          time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
        });
        
        if (result.success) {
          // Make sure to include dateAdded for UI display
          const newTransaction = {
            ...result.transaction,
            dateAdded: expenseData.dateAdded, // Explicitly set dateAdded for the CardList component
            spends: expenseData.spends, // Ensure spends is available for UI
            isExpense: true // Explicitly mark as an expense for UI color/sign
          };
          
          // Add to local state
          setExpenses([newTransaction, ...expenses]);
          console.log('New expense added');
        }
      }
      
      // Handle offline operations
      if (!result.success) {
        if (result.isOffline) {
          // For offline operations, still update UI but notify user
          if (editingItem) {
            // Update in local state
            const updatedExpense = {
              ...editingItem,
              description: expenseData.description,
              amount: expenseData.spends,
              spends: expenseData.spends, // Include spends for UI
              date: expenseData.dateAdded,
              dateAdded: expenseData.dateAdded, // Include dateAdded for UI
              isExpense: true, // Mark as expense for UI
              isOffline: true
            };
            setExpenses(expenses.map(item => 
              item.id === editingItem.id ? updatedExpense : item
            ));
          } else {
            // Add to local state with temporary ID
            const newExpense = {
              id: `temp_${Date.now()}`,
              description: expenseData.description,
              amount: expenseData.spends,
              spends: expenseData.spends, // Include spends for UI
              date: expenseData.dateAdded,
              dateAdded: expenseData.dateAdded, // Include dateAdded for UI
              type: 'expense',
              isExpense: true, // Mark as expense for UI color/sign
              isOffline: true,
              time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
            };
            setExpenses([newExpense, ...expenses]);
          }
          
          Alert.alert(
            "Mode hors ligne",
            "Les modifications seront synchronisées lorsque vous serez en ligne."
          );
        } else {
          // Other error
          Alert.alert("Erreur", result.error || "Impossible de sauvegarder la dépense");
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la sauvegarde");
    }
  };
  
  // Sync offline data when online
  useEffect(() => {
    if (isOnline) {
      // When the app comes back online, try to sync offline data
      const syncData = async () => {
        try {
          const result = await transactionService.syncOfflineTransactions();
          if (result.success) {
            if (result.syncedCount > 0) {
              // Remove synced offline items from the current state immediately
              // to prevent showing duplicate items (offline version + server version)
              const syncedIds = new Set(result.syncedIds);
              setExpenses(prevExpenses => 
                prevExpenses.filter(expense => !syncedIds.has(expense.id))
              );
              
              // Then reload expenses to get updated data from server including the synced items
              loadExpenses();
              
              // Show a success message
              if (result.syncedCount > 0) {
                Alert.alert(
                  "Synchronisation terminée",
                  `${result.syncedCount} dépense(s) synchronisée(s) avec succès.`
                );
              }
            }
          }
        } catch (error) {
          console.error('Error syncing offline data:', error);
        }
      };
      
      syncData();
    }
  }, [isOnline]); // Only run when online status changes to true
  
  return (
    <View style={styles.container}>
      <Header screenName={"Dépenses"} onSearching={handleSearch} />
      
      {/* Offline indicator */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Icon name="cloud-off-outline" size={16} color={colors.white} />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}
      
      {/* Error message */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Expense list */}
      <CardList 
        data={filteredItems()}
        onDeletePress={handleDeletePress}
        onEditPress={handleEditPress}
        emptyMessage="Aucune dépense trouvée"
        isLoading={isLoading}
        isExpenseScreen={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.expense]}
            tintColor={colors.expense}
          />
        }
      />
      
      {/* Add expense button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={30} color={colors.card} />
      </TouchableOpacity>
      
      {/* Add/Edit expense modal */}
      <AddExpense 
        visible={modalVisible} 
        onClose={handleCloseModal}
        onSave={handleSaveExpense}
        initialData={editingItem}
        isEditing={!!editingItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.large,
    right: spacing.large,
    backgroundColor: colors.expense,
    width: 60,
    height: 60,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
  },
  offlineBar: {
    backgroundColor: colors.warning,
    padding: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: colors.white,
    marginLeft: spacing.small,
    fontWeight: 200,
  },
  errorContainer: {
    backgroundColor: `${colors.error}20`,
    padding: spacing.medium,
    margin: spacing.medium,
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginLeft: spacing.small,
    flex: 1,
  }
});

export default Expense;