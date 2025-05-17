import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, writeBatch, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { authService } from './authService';

const CURRENT_USER_KEY = '@financial_app:currentUser';
const VIEWING_AS_KEY = '@financial_app:viewingAs';
const OFFLINE_TRANSACTIONS_KEY = '@financial_app:offlineTransactions';

const getCurrentUserId = async () => {
  const viewingAs = await AsyncStorage.getItem(VIEWING_AS_KEY);
  if (viewingAs) {
    return JSON.parse(viewingAs).uid;
  }
  const user = await authService.getCurrentUser();
  if (!user || !user.uid) return null;
  return user.uid;
};

export const transactionService = {
  addTransaction: async (transactionData) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      const transaction = {
        ...transactionData,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isOnline) {
        const docRef = await addDoc(collection(db, 'transactions'), transaction);
        return { success: true, transaction: { ...transaction, id: docRef.id } };
      } else {
        const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const offlineTransaction = { ...transaction, id: offlineId, isOffline: true, pendingAction: 'add' };
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        offlineTransactions.push(offlineTransaction);
        await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(offlineTransactions));
        return { success: true, transaction: offlineTransaction, isOffline: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getTransactions: async (filters = {}) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return { success: false, error: "Utilisateur non connecté" };
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      let onlineTransactions = [];
      let offlineTransactions = [];
      if (isOnline) {
        let q = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        onlineTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      if (offlineTransactionsJson) {
        const allOfflineData = JSON.parse(offlineTransactionsJson);
        offlineTransactions = allOfflineData.filter(transaction =>
          transaction.userId === userId &&
          transaction.pendingAction !== 'delete'
        );
      }
      
      // Combine and sort transactions
      let combinedTransactions = [...onlineTransactions, ...offlineTransactions];
      
      // Apply filters if provided
      if (filters.type) {
        combinedTransactions = combinedTransactions.filter(
          transaction => transaction.type === filters.type
        );
      }
      
      // Filter by date if olderThan is provided
      if (filters.olderThan) {
        const olderThanDate = filters.olderThan instanceof Date ? 
          filters.olderThan : new Date(filters.olderThan);
          
        combinedTransactions = combinedTransactions.filter(transaction => {
          let transactionDate;
          if (transaction.date) {
            // Parse DD/MM/YYYY format
            const parts = transaction.date.split('/');
            if (parts.length === 3) {
              transactionDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else if (transaction.createdAt) {
            transactionDate = new Date(transaction.createdAt);
          }
          
          return transactionDate && transactionDate < olderThanDate;
        });
      }
      
      // Sort by createdAt date (most recent first)
      combinedTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return { success: true, transactions: combinedTransactions, isPartiallyOffline: !isOnline };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateTransaction: async (id, transactionData) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Add updatedAt timestamp to the transaction data
      const updateData = {
        ...transactionData,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: userId
      };
      
      if (isOnline) {
        // Online update
        const docRef = doc(db, 'transactions', id);
        await updateDoc(docRef, updateData);
        
        return { 
          success: true, 
          transaction: { 
            ...transactionData, 
            id,
            updatedAt: updateData.updatedAt
          } 
        };
      } else {
        // Offline update logic
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        // Check if this is an offline transaction
        const isOfflineTransaction = id.startsWith('offline_');
        
        if (isOfflineTransaction) {
          // Update existing offline transaction
          const updatedOfflineTransactions = offlineTransactions.map(transaction => {
            if (transaction.id === id) {
              return { 
                ...transaction, 
                ...transactionData,
                updatedAt: updateData.updatedAt
              };
            }
            return transaction;
          });
          
          await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(updatedOfflineTransactions));
          
          return { 
            success: true, 
            transaction: { 
              ...transactionData, 
              id, 
              updatedAt: updateData.updatedAt,
              isOffline: true 
            }, 
            isOffline: true 
          };
        } else {
          // Queue update for sync later
          const offlineTransaction = {
            id: `offline_update_${Date.now()}`,
            originalId: id,
            data: transactionData,
            userId,
            updatedAt: updateData.updatedAt,
            pendingAction: 'update',
            isOffline: true
          };
          
          offlineTransactions.push(offlineTransaction);
          await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(offlineTransactions));
          
          return { 
            success: true, 
            transaction: { 
              ...transactionData, 
              id, 
              updatedAt: updateData.updatedAt,
              isOffline: true 
            }, 
            isOffline: true 
          };
        }
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      return { success: false, error: error.message };
    }
  },

  deleteTransaction: async (id) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      if (isOnline) {
        // Online deletion
        const docRef = doc(db, 'transactions', id);
        await deleteDoc(docRef);
        return { success: true };
      } else {
        // Offline deletion logic
        const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
        const offlineTransactions = offlineTransactionsJson ? JSON.parse(offlineTransactionsJson) : [];
        
        // Check if this is an offline transaction
        const isOfflineTransaction = id.startsWith('offline_');
        
        if (isOfflineTransaction) {
          // Remove the offline transaction from storage
          const filteredTransactions = offlineTransactions.filter(transaction => transaction.id !== id);
          await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));
        } else {
          // Queue delete for sync later
          const offlineTransaction = {
            id: `offline_delete_${Date.now()}`,
            originalId: id,
            userId,
            updatedAt: new Date().toISOString(),
            pendingAction: 'delete',
            isOffline: true
          };
          
          offlineTransactions.push(offlineTransaction);
          await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(offlineTransactions));
        }
        
        return { success: true, isOffline: true };
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return { success: false, error: error.message };
    }  },
  
  archiveTransactions: async (beforeDate) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }

      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (!isOnline) {
        return { success: false, error: "L'archivage nécessite une connexion internet" };
      }
      
      console.log(`Archiving transactions before: ${beforeDate.toISOString()}`);
      
      // First, get all transactions for this user - we'll filter them in JS
      // This avoids issues with Firestore timestamp comparison
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      let allTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${allTransactions.length} total transactions`);
      
      // Filter transactions to archive based on date
      const transactionsToArchive = allTransactions.filter(transaction => {
        try {
          let transactionDate;
          
          // Try to parse the date from different possible formats
          if (transaction.date) {
            if (typeof transaction.date === 'string') {
              // Handle DD/MM/YYYY format
              const parts = transaction.date.split('/');
              if (parts.length === 3) {
                transactionDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              } else {
                // Try as ISO string
                transactionDate = new Date(transaction.date);
              }
            }
          }
          
          // Fallback to createdAt
          if (!transactionDate || isNaN(transactionDate.getTime())) {
            transactionDate = new Date(transaction.createdAt);
          }
          
          // Compare dates
          return transactionDate && transactionDate < beforeDate;
        } catch (err) {
          console.error(`Error processing transaction date for transaction ${transaction.id}:`, err);
          return false;
        }
      });
      
      console.log(`Filtered to ${transactionsToArchive.length} transactions to archive`);
      
      if (transactionsToArchive.length === 0) {
        return { success: true, archivedCount: 0, message: "Aucune transaction à archiver" };
      }
      
      // Create a batch to archive transactions
      const batch = writeBatch(db);
      
      // Store in the archives collection
      for (const transaction of transactionsToArchive) {
        // Create in archives collection
        const archiveDocRef = doc(collection(db, 'transaction_archives'));
        batch.set(archiveDocRef, {
          ...transaction,
          originalId: transaction.id,
          archivedAt: new Date().toISOString(),
        });
        
        // Delete from active transactions
        const transactionDocRef = doc(db, 'transactions', transaction.id);
        batch.delete(transactionDocRef);
      }
      
      // Commit the batch
      await batch.commit();
      
      return { 
        success: true, 
        archivedCount: transactionsToArchive.length,
        message: `${transactionsToArchive.length} transactions ont été archivées` 
      };
    } catch (error) {
      console.error("Error archiving transactions:", error);
      
      // Handle Firestore index error specifically
      if (error.message && error.message.includes('index') && error.message.includes('firebase.google.com')) {
        const indexUrl = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s"]+)/);
        if (indexUrl && indexUrl[0]) {
          return { 
            success: false, 
            error: "Un index Firebase est requis pour cette opération. Veuillez contacter l'administrateur avec cette information.", 
            indexUrl: indexUrl[0],
            requiresIndex: true
          };
        }
      }
      
      return { success: false, error: error.message };
    }
  },
  
  getArchivedTransactions: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }

      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (!isOnline) {
        return { success: false, error: "L'accès aux archives nécessite une connexion internet" };
      }
      
      // Get archived transactions
      const q = query(
        collection(db, 'transaction_archives'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const archivedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, transactions: archivedTransactions };
    } catch (error) {
      console.error("Error getting archived transactions:", error);
      
      // Handle Firestore index error specifically
      if (error.message && error.message.includes('index') && error.message.includes('firebase.google.com')) {
        const indexUrl = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s"]+)/);
        if (indexUrl && indexUrl[0]) {
          return { 
            success: false, 
            error: "Un index Firebase est requis pour cette opération. Veuillez contacter l'administrateur avec cette information.", 
            indexUrl: indexUrl[0],
            requiresIndex: true
          };
        }
      }
      
      return { success: false, error: error.message };
    }
  },

  syncOfflineTransactions: async () => {
    try {
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      if (!isOnline) {
        return { success: false, error: "Pas de connexion internet" };
      }
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      const offlineTransactionsJson = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
      if (!offlineTransactionsJson) {
        return { success: true, message: "Aucune transaction hors ligne à synchroniser" };
      }
      const offlineTransactions = JSON.parse(offlineTransactionsJson);
      const userOfflineTransactions = offlineTransactions.filter(
        transaction => transaction.userId === currentUser.uid
      );
      const otherUsersTransactions = offlineTransactions.filter(
        transaction => transaction.userId !== currentUser.uid
      );
      if (userOfflineTransactions.length === 0) {
        return { success: true, message: "Aucune transaction hors ligne à synchroniser" };
      }
      const batch = writeBatch(db);
      const syncedIds = [];
      for (const transaction of userOfflineTransactions) {
        if (transaction.pendingAction === 'add' && transaction.id.startsWith('offline_')) {
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
          const docRef = doc(db, 'transactions', transaction.originalId);
          batch.delete(docRef);
          syncedIds.push(transaction.id);
        }
      }
      await batch.commit();
      const remainingTransactions = offlineTransactions.filter(
        transaction => !syncedIds.includes(transaction.id)
      );
      await AsyncStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify([
        ...otherUsersTransactions,
        ...remainingTransactions
      ]));
      return { 
        success: true, 
        syncedCount: syncedIds.length 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};