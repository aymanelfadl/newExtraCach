import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { authService } from './authService';

const OFFLINE_TRANSACTIONS_KEY = '@financial_app:offlineTransactions';
const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  REVENUE: 'revenue'
};

export const transactionService = {
  // Add a new transaction (expense or revenue)
  addTransaction: async (transactionData) => {
    try {
      // Get current auth context (which user are we viewing as?)
      const authContext = await authService.checkViewingAs();
      const userId = authContext ? authContext.viewingAsUid : (await authService.getCurrentUser()).uid;
      const isViewingAsOtherUser = authContext !== null;
      
      if (isViewingAsOtherUser && transactionData.isOffline) {
        // If viewing as another user and trying to save offline, not allowed
        return { 
          success: false, 
          error: "Vous ne pouvez pas ajouter de transactions hors ligne pour un autre utilisateur" 
        };
      }
      
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Prepare transaction object
      const transaction = {
        ...transactionData,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: (await authService.getCurrentUser()).uid, // Original user who created it
      };
      
      if (isOnline) {
        // Add to Firestore if online
        const docRef = await addDoc(collection(db, 'transactions'), transaction);
        
        // Return with ID from Firestore
        return { 
          success: true, 
          transaction: { ...transaction, id: docRef.id } 
        };
      } else {
        // Store offline if not online
        const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const offlineTransaction = { 
          ...transaction, 
          id: offlineId,
          isOffline: true,
          pendingAction: 'add'
        };
        
        // Get existing offline transactions
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        // Add new transaction to offline storage
        offlineTransactions.push(offlineTransaction);
        await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(offlineTransactions));
        
        return { 
          success: true, 
          transaction: offlineTransaction,
          isOffline: true
        };
      }
    } catch (error) {
      console.error('Add transaction error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Update an existing transaction
  updateTransaction: async (id, transactionData) => {
    try {
      // Get current auth context (which user are we viewing as?)
      const authContext = await authService.checkViewingAs();
      const userId = authContext ? authContext.viewingAsUid : (await authService.getCurrentUser()).uid;
      const isViewingAsOtherUser = authContext !== null;
      
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Check if this is an offline transaction
      if (id.startsWith('offline_')) {
        if (isViewingAsOtherUser) {
          return { 
            success: false, 
            error: "Vous ne pouvez pas modifier des transactions hors ligne pour un autre utilisateur" 
          };
        }
        
        // Update offline transaction
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        const updatedTransactions = offlineTransactions.map(transaction => {
          if (transaction.id === id) {
            return { 
              ...transaction, 
              ...transactionData,
              updatedAt: new Date().toISOString()
            };
          }
          return transaction;
        });
        
        await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
        
        return { 
          success: true, 
          isOffline: true 
        };
      }
      
      // For online transactions
      if (isOnline) {
        // Update in Firestore
        await updateDoc(doc(db, 'transactions', id), {
          ...transactionData,
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: (await authService.getCurrentUser()).uid
        });
        
        return { success: true };
      } else {
        // Store update operation for later
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        const pendingUpdate = {
          id: `offline_update_${id}_${Date.now()}`,
          originalId: id,
          data: transactionData,
          userId: userId,
          isOffline: true,
          pendingAction: 'update',
          updatedAt: new Date().toISOString()
        };
        
        offlineTransactions.push(pendingUpdate);
        await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(offlineTransactions));
        
        return { 
          success: true, 
          isOffline: true 
        };
      }
    } catch (error) {
      console.error('Update transaction error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Delete a transaction
  deleteTransaction: async (id) => {
    try {
      // Get current auth context (which user are we viewing as?)
      const authContext = await authService.checkViewingAs();
      const userId = authContext ? authContext.viewingAsUid : (await authService.getCurrentUser()).uid;
      const isViewingAsOtherUser = authContext !== null;
      
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Check if this is an offline transaction
      if (id.startsWith('offline_')) {
        if (isViewingAsOtherUser) {
          return { 
            success: false, 
            error: "Vous ne pouvez pas supprimer des transactions hors ligne pour un autre utilisateur" 
          };
        }
        
        // Remove offline transaction from storage
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        const updatedTransactions = offlineTransactions.filter(transaction => transaction.id !== id);
        await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
        
        return { 
          success: true, 
          isOffline: true 
        };
      }
      
      // For online transactions
      if (isOnline) {
        // Delete from Firestore
        await deleteDoc(doc(db, 'transactions', id));
        
        return { success: true };
      } else {
        // Store delete operation for later
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        const pendingDelete = {
          id: `offline_delete_${id}_${Date.now()}`,
          originalId: id,
          userId: userId,
          isOffline: true,
          pendingAction: 'delete',
          updatedAt: new Date().toISOString()
        };
        
        offlineTransactions.push(pendingDelete);
        await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(offlineTransactions));
        
        return { 
          success: true, 
          isOffline: true 
        };
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get all transactions (combines online and offline data)
  getTransactions: async (filters = {}) => {
    try {
      // Get current auth context (which user are we viewing as?)
      const authContext = await authService.checkViewingAs();
      const userId = authContext ? authContext.viewingAsUid : (await authService.getCurrentUser()).uid;
      
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      let onlineTransactions = [];
      let offlineTransactions = [];
      
      // Get online transactions if connected
      if (isOnline) {
        // Build query with filters
        let q = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        // Apply additional filters if provided
        if (filters.type) {
          q = query(q, where('type', '==', filters.type));
        }
        
        if (filters.startDate && filters.endDate) {
          q = query(
            q, 
            where('dateAdded', '>=', filters.startDate),
            where('dateAdded', '<=', filters.endDate)
          );
        }
        
        if (filters.limit) {
          q = query(q, limit(filters.limit));
        }
        
        const querySnapshot = await getDocs(q);
        onlineTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Get offline transactions
      const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      if (offlineTransactionsJson) {
        const allOfflineData = JSON.parse(offlineTransactionsJson);
        
        // Filter to get only transactions for current user (or user being viewed)
        offlineTransactions = allOfflineData.filter(transaction => {
          // Only include add operations and updates, not pending deletes
          return (
            transaction.userId === userId && 
            transaction.pendingAction !== 'delete' &&
            !transaction.id.startsWith('offline_update_') &&
            !transaction.id.startsWith('offline_delete_')
          );
        });
        
        // Apply offline updates to existing transactions
        const offlineUpdates = allOfflineData.filter(
          transaction => transaction.pendingAction === 'update' && transaction.userId === userId
        );
        
        // Apply all the pending offline updates to online transactions
        offlineUpdates.forEach(update => {
          const onlineIndex = onlineTransactions.findIndex(t => t.id === update.originalId);
          if (onlineIndex !== -1) {
            onlineTransactions[onlineIndex] = {
              ...onlineTransactions[onlineIndex],
              ...update.data,
              updatedAt: update.updatedAt,
              hasOfflineUpdates: true
            };
          }
        });
        
        // Filter out transactions that have pending delete operations
        const offlineDeletes = allOfflineData.filter(
          transaction => transaction.pendingAction === 'delete' && transaction.userId === userId
        );
        
        const deleteIds = offlineDeletes.map(del => del.originalId);
        onlineTransactions = onlineTransactions.filter(transaction => !deleteIds.includes(transaction.id));
      }
      
      // Combine online and offline transactions
      const combinedTransactions = [...onlineTransactions, ...offlineTransactions];
      
      // Sort by date (newest first)
      combinedTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return { 
        success: true, 
        transactions: combinedTransactions,
        isPartiallyOffline: !isOnline
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Sync offline transactions to Firebase when back online
  syncOfflineTransactions: async () => {
    try {
      // Check if online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (!isOnline) {
        return { success: false, error: "Pas de connexion internet" };
      }
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      // Get offline transactions
      const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      if (!offlineTransactionsJson) {
        return { success: true, message: "Aucune transaction hors ligne à synchroniser" };
      }
      
      const offlineTransactions = JSON.parse(offlineTransactionsJson);
      
      // Filter transactions for current user only
      const userOfflineTransactions = offlineTransactions.filter(
        transaction => transaction.userId === currentUser.uid
      );
      
      // Save other users' offline transactions
      const otherUsersTransactions = offlineTransactions.filter(
        transaction => transaction.userId !== currentUser.uid
      );
      
      if (userOfflineTransactions.length === 0) {
        return { success: true, message: "Aucune transaction hors ligne à synchroniser" };
      }
      
      const batch = writeBatch(db);
      const syncedIds = [];
      
      // Process each offline transaction
      for (const transaction of userOfflineTransactions) {
        if (transaction.pendingAction === 'add' && transaction.id.startsWith('offline_')) {
          // Add new transaction to Firestore
          const { id, isOffline, pendingAction, ...transactionData } = transaction;
          const newDocRef = doc(collection(db, 'transactions'));
          
          batch.set(newDocRef, {
            ...transactionData,
            syncedFromOffline: true,
            syncedAt: serverTimestamp()
          });
          
          syncedIds.push(transaction.id);
        } 
        else if (transaction.pendingAction === 'update') {
          // Update existing transaction
          const docRef = doc(db, 'transactions', transaction.originalId);
          
          batch.update(docRef, {
            ...transaction.data,
            updatedAt: transaction.updatedAt,
            lastUpdatedBy: currentUser.uid,
            syncedFromOffline: true,
            syncedAt: serverTimestamp()
          });
          
          syncedIds.push(transaction.id);
        }
        else if (transaction.pendingAction === 'delete') {
          // Delete transaction
          const docRef = doc(db, 'transactions', transaction.originalId);
          batch.delete(docRef);
          
          syncedIds.push(transaction.id);
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      // Update offline storage to remove synced transactions
      const remainingTransactions = offlineTransactions.filter(
        transaction => !syncedIds.includes(transaction.id)
      );
      
      // Save other users' transactions that weren't synced
      await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify([
        ...otherUsersTransactions,
        ...remainingTransactions
      ]));
      
      return { 
        success: true, 
        syncedCount: syncedIds.length 
      };
    } catch (error) {
      console.error('Sync offline transactions error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Set up a real-time listener for transactions
  subscribeToTransactions: (userId, callback) => {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      callback(transactions);
    }, error => {
      console.error('Subscribe to transactions error:', error);
      callback([], error);
    });
    
    return unsubscribe;
  },
  
  // Get transaction statistics
  getTransactionStats: async (userId, period = 'month') => {
    try {
      // Get current date
      const now = new Date();
      let startDate;
      
      // Calculate start date based on period
      if (period === 'week') {
        // Start from beginning of week (Sunday)
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        // Start from beginning of month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'year') {
        // Start from beginning of year
        startDate = new Date(now.getFullYear(), 0, 1);
      } else {
        // Default to last 30 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
      
      // Format dates for Firestore query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];
      
      // Get transactions for the period
      const { success, transactions } = await transactionService.getTransactions({
        userId,
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      if (!success) {
        throw new Error('Failed to get transactions for statistics');
      }
      
      // Calculate totals
      const totalExpenses = transactions
        .filter(t => t.isExpense)
        .reduce((sum, t) => sum + (parseFloat(t.spends) || 0), 0);
        
      const totalRevenues = transactions
        .filter(t => !t.isExpense)
        .reduce((sum, t) => sum + (parseFloat(t.spends) || 0), 0);
      
      // Group by category
      const expensesByCategory = transactions
        .filter(t => t.isExpense)
        .reduce((acc, t) => {
          const category = t.category || 'Autre';
          if (!acc[category]) acc[category] = 0;
          acc[category] += parseFloat(t.spends) || 0;
          return acc;
        }, {});
        
      const revenuesByCategory = transactions
        .filter(t => !t.isExpense)
        .reduce((acc, t) => {
          const category = t.category || 'Autre';
          if (!acc[category]) acc[category] = 0;
          acc[category] += parseFloat(t.spends) || 0;
          return acc;
        }, {});
      
      // Group by day
      const transactionsByDay = transactions.reduce((acc, t) => {
        const day = t.dateAdded.split('/')[0]; // Assuming dateAdded is in DD/MM/YYYY format
        if (!acc[day]) acc[day] = { expenses: 0, revenues: 0 };
        
        if (t.isExpense) {
          acc[day].expenses += parseFloat(t.spends) || 0;
        } else {
          acc[day].revenues += parseFloat(t.spends) || 0;
        }
        
        return acc;
      }, {});
      
      return {
        success: true,
        stats: {
          totalExpenses,
          totalRevenues,
          balance: totalRevenues - totalExpenses,
          expensesByCategory,
          revenuesByCategory,
          transactionsByDay,
          period,
          startDate: startDateStr,
          endDate: endDateStr
        }
      };
    } catch (error) {
      console.error('Get transaction stats error:', error);
      return { success: false, error: error.message };
    }
  }
};