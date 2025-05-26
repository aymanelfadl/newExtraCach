import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, RefreshControl } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';

import AddRevenue from '../../components/AddRevenue';
import Header from '../../components/Header';
import CardList from '../../components/CardList';
import { useUser } from '../../context/UserContext';
import { transactionService } from '../../services/transactionService';

const Revenue = () => {
  const { isOnline: userContextOnline } = useUser();
  const isOnline = userContextOnline;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);
  const [revenues, setRevenues] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Load revenues when component mounts
  useEffect(() => {
    loadRevenues();
  }, []);
  
  // Load revenues from service
  const loadRevenues = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Get revenue transactions from the transaction service
      const result = await transactionService.getTransactions({ 
        type: 'revenue',
      });
      
      if (result.success) {
        // Format transactions for CardList component - ensure dateAdded and isExpense are set
        const formattedRevenues = result.transactions.map(transaction => ({
          ...transaction,
          dateAdded: transaction.dateAdded || transaction.date, // Ensure dateAdded is available
          isExpense: false, // Explicitly mark all items as NOT expenses for green styling
          spends: transaction.spends || transaction.amount // Ensure spends property exists
        }));
        setRevenues(formattedRevenues);
      } else {
        setError(result.error || 'Error loading revenues');
        
        // If there was an error but we have offline data, show a less intrusive notification
        if (result.isOffline) {
          Alert.alert(
            "Mode hors ligne",
            "Les données affichées sont stockées localement et pourraient ne pas être à jour."
          );
        }
      }
    } catch (error) {
      console.error('Error loading revenues:', error);
      setError('Une erreur s\'est produite lors du chargement des revenus');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull to refresh
  const onRefresh = () => {
    loadRevenues(true);
  };
  
  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Filter revenues based on search query
  const filteredItems = () => {
    if (!searchQuery) {
      return revenues;
    }
    
    return revenues.filter(item => 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.amount || item.spends).toString().includes(searchQuery) ||
      (item.date || item.dateAdded)?.includes(searchQuery)
    );
  };
  
  // Handle delete revenue
  const handleDeletePress = (id) => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer ce revenu?",
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
                setRevenues(revenues.filter(item => item.id !== id));
                console.log(`Revenue deleted: ${id}`);
              } else {
                // Handle offline deletion - it will be synced later
                if (result.isOffline) {
                  // Still update UI, but show offline notification
                  setRevenues(revenues.filter(item => item.id !== id));
                  Alert.alert(
                    "Suppression en mode hors ligne",
                    "La suppression sera synchronisée lorsque vous serez en ligne."
                  );
                } else {
                  // If there was another error (not offline related)
                  Alert.alert("Erreur", result.error || "Impossible de supprimer le revenu");
                }
              }
            } catch (error) {
              console.error('Error deleting revenue:', error);
              Alert.alert("Erreur", "Une erreur s'est produite lors de la suppression");
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Handle edit revenue
  const handleEditPress = (item) => {
    // Convert from service model to component model if needed
    const editableItem = {
      id: item.id,
      description: item.description,
      spends: item.amount || item.spends, // Handle both field names
      dateAdded: item.date || item.dateAdded // Handle both field names
    };
    
    setEditingItem(editableItem);
    setModalVisible(true);
  };
  
  // Handle close modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
  };
  
  // Handle save revenue
  const handleSaveRevenue = async (revenueData) => {
    try {
      let result;
      
      if (editingItem) {
        // Update existing revenue
        result = await transactionService.updateTransaction(editingItem.id, {
          description: revenueData.description,
          amount: revenueData.spends, // Convert component field to service field
          date: revenueData.dateAdded, // Convert component field to service field
          type: 'revenue'
        });
        
        if (result.success) {
          // Update local state with updated transaction
          setRevenues(revenues.map(item => 
            item.id === editingItem.id ? {
              ...result.transaction,
              dateAdded: revenueData.dateAdded, // Ensure dateAdded is available for UI
              isExpense: false // Explicitly mark as NOT an expense for UI
            } : item
          ));
          console.log(`Revenue updated: ${editingItem.id}`);
        }
      } else {
        // Add new revenue
        result = await transactionService.addTransaction({
          description: revenueData.description,
          amount: revenueData.spends, // Convert component field to service field
          date: revenueData.dateAdded, // Ensure the date is in DD/MM/YYYY format from AddRevenue
          type: 'revenue',
          time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
        });
        
        if (result.success) {
          // Make sure to include dateAdded for UI display
          const newTransaction = {
            ...result.transaction,
            dateAdded: revenueData.dateAdded, // Explicitly set dateAdded for the CardList component
            spends: revenueData.spends, // Ensure spends is available for UI
            isExpense: false // Explicitly mark as NOT expense for UI color/sign
          };
          
          // Add to local state
          setRevenues([newTransaction, ...revenues]);
          console.log('New revenue added');
        }
      }
      
      // Handle offline operations
      if (!result.success) {
        if (result.isOffline) {
          // For offline operations, still update UI but notify user
          if (editingItem) {
            // Update in local state
            const updatedRevenue = {
              ...editingItem,
              description: revenueData.description,
              amount: revenueData.spends,
              spends: revenueData.spends, // Include spends for UI
              date: revenueData.dateAdded,
              dateAdded: revenueData.dateAdded, // Include dateAdded for UI
              isExpense: false, // Mark as NOT expense for UI
              isOffline: true
            };
            setRevenues(revenues.map(item => 
              item.id === editingItem.id ? updatedRevenue : item
            ));
          } else {
            // Add to local state with temporary ID
            const newRevenue = {
              id: `temp_${Date.now()}`,
              description: revenueData.description,
              amount: revenueData.spends,
              spends: revenueData.spends, // Include spends for UI
              date: revenueData.dateAdded,
              dateAdded: revenueData.dateAdded, // Include dateAdded for UI
              type: 'revenue',
              isExpense: false, // Mark as NOT an expense for UI color/sign
              isOffline: true,
              time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})
            };
            setRevenues([newRevenue, ...revenues]);
          }
          
          Alert.alert(
            "Mode hors ligne",
            "Les modifications seront synchronisées lorsque vous serez en ligne."
          );
        } else {
          // Other error
          Alert.alert("Erreur", result.error || "Impossible de sauvegarder le revenu");
        }
      }
    } catch (error) {
      console.error('Error saving revenue:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la sauvegarde");
    } finally {
      setModalVisible(false);
      setEditingItem(null);
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
              setRevenues(prevRevenues => 
                prevRevenues.filter(revenue => !syncedIds.has(revenue.id))
              );
              
              // Then reload revenues to get updated data from server including the synced items
              loadRevenues();
              
              // Show a success message
              if (result.syncedCount > 0) {
                Alert.alert(
                  "Synchronisation terminée",
                  `${result.syncedCount} revenu(s) synchronisé(s) avec succès.`
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
      <Header screenName={"Revenus"} onSearching={handleSearch} />
      
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
      
      {/* Revenue list */}
      <CardList 
        data={filteredItems()}
        onDeletePress={handleDeletePress}
        onEditPress={handleEditPress}
        emptyMessage="Aucun revenu trouvé"
        isLoading={isLoading}
        numColumns={1}
        isExpenseScreen={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.income]}
            tintColor={colors.income}
          />
        }
      />
      
      {/* Add revenue button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={30} color={colors.card} />
      </TouchableOpacity>
      
      {/* Add/Edit revenue modal */}
      <AddRevenue 
        visible={modalVisible} 
        onClose={handleCloseModal}
        onSave={handleSaveRevenue}
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
    backgroundColor: colors.income,
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

export default Revenue;