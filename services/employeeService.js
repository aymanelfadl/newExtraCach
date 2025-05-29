import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { authService } from './authService';

const OFFLINE_EMPLOYEES_KEY = '@financial_app:offlineEmployees';

// Add missing index URL for user messaging
const MISSING_INDEX_URL = 'https://console.firebase.google.com/v1/r/project/expense-manager-376bc/firestore/indexes?create_composite=Cldwcm9qZWN0cy9leHBlbnNlLW1hbmFnZXItMzc2YmMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2VtcGxveWVlcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC';

const VIEWING_AS_KEY = '@financial_app:viewingAs';

const getCurrentUserId = async () => {
  // First check if we're viewing another user's data
  const viewingAs = await AsyncStorage.getItem(VIEWING_AS_KEY);
  if (viewingAs) {
    const viewingAsUser = JSON.parse(viewingAs);
    return viewingAsUser.uid;
  }
  
  // Otherwise return the current authenticated user's ID
  const user = await authService.getCurrentUser();
  if (!user || !user.uid) return null;
  return user.uid;
};

export const employeeService = {
  /**
   * Add a new employee to the database
   */
  addEmployee: async (employeeData) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      const employee = {
        ...employeeData,
        balance: 0,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isOnline) {
        // Online - add directly to Firestore
        const docRef = await addDoc(collection(db, 'employees'), employee);
        return { 
          success: true, 
          employee: { ...employee, id: docRef.id } 
        };
      } else {
        // Offline - store locally
        const offlineId = `offline_emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const offlineEmployee = { 
          ...employee, 
          id: offlineId, 
          isOffline: true, 
          pendingAction: 'add' 
        };
        
        const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
        const offlineEmployees = offlineEmployeesJson ? JSON.parse(offlineEmployeesJson) : [];
        offlineEmployees.push(offlineEmployee);
        await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(offlineEmployees));
        
        return { 
          success: true, 
          employee: offlineEmployee, 
          isOffline: true 
        };
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all employees for the current user
   */
  getEmployees: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      let onlineEmployees = [];
      let offlineEmployees = [];
      
      // Fetch online employees if connected
      if (isOnline) {
        try {
          // Try with composite query first
          const q = query(
            collection(db, 'employees'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          onlineEmployees = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (indexError) {
          // Check if it's a missing index error
          if (indexError.message && indexError.message.includes('requires an index')) {
            console.warn('Missing index for employees query. Falling back to simple query.');
            
            // Fall back to simple query without ordering
            const simpleQuery = query(
              collection(db, 'employees'),
              where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(simpleQuery);
            onlineEmployees = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Sort manually on the client side instead
            onlineEmployees.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
              const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
              return dateB - dateA; // Descending order
            });
            
            // Return special flag for index issue
            return { 
              success: true, 
              employees: onlineEmployees,
              needsIndexCreation: true,
              indexUrl: MISSING_INDEX_URL,
              isPartiallyOffline: false
            };
          } else {
            // Rethrow if it's not an indexing issue
            throw indexError;
          }
        }
      }
      
      // Get any offline employees
      const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
      if (offlineEmployeesJson) {
        const allOfflineData = JSON.parse(offlineEmployeesJson);
        offlineEmployees = allOfflineData.filter(employee =>
          employee.userId === userId &&
          employee.pendingAction !== 'delete'
        );
      }
      
      // Combine and sort employees
      const combinedEmployees = [...onlineEmployees, ...offlineEmployees];
      combinedEmployees.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA; // Descending order
      });
      
      return { 
        success: true, 
        employees: combinedEmployees, 
        isPartiallyOffline: !isOnline 
      };
    } catch (error) {
      console.error("Error getting employees:", error);
      if (error.message && error.message.includes('requires an index')) {
        return { 
          success: false, 
          error: "Une indexation est requise pour cette requête. Un administrateur doit créer l'index.",
          needsIndexCreation: true, 
          indexUrl: MISSING_INDEX_URL
        };
      }
      return { success: false, error: error.message };
    }
  },

  /**
   * Get an employee by ID
   */
  getEmployeeById: async (id) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      // Check if this is an offline employee
      if (id.startsWith('offline_emp_')) {
        const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
        if (offlineEmployeesJson) {
          const offlineEmployees = JSON.parse(offlineEmployeesJson);
          const employee = offlineEmployees.find(emp => emp.id === id);
          if (employee) {
            return { success: true, employee };
          }
        }
        return { success: false, error: "Employé non trouvé" };
      }
      
      // Online employee
      const docRef = doc(db, 'employees', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const employee = { id: docSnap.id, ...docSnap.data() };
        
        // Verify this employee belongs to the current user
        if (employee.userId !== userId) {
          return { success: false, error: "Accès non autorisé" };
        }
        
        return { success: true, employee };
      } else {
        return { success: false, error: "Employé non trouvé" };
      }
    } catch (error) {
      console.error("Error getting employee:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an employee's information
   */
  updateEmployee: async (id, employeeData) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Add updated timestamp
      const updateData = {
        ...employeeData,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: userId
      };
      
      if (isOnline) {
        // Online update
        const docRef = doc(db, 'employees', id);
        await updateDoc(docRef, updateData);
        
        return { 
          success: true, 
          employee: { ...employeeData, id, updatedAt: updateData.updatedAt } 
        };
      } else {
        // Offline update logic
        const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
        const offlineEmployees = offlineEmployeesJson ? JSON.parse(offlineEmployeesJson) : [];
        
        // Check if this is an offline employee
        const isOfflineEmployee = id.startsWith('offline_emp_');
        
        if (isOfflineEmployee) {
          // Update existing offline employee
          const updatedOfflineEmployees = offlineEmployees.map(employee => {
            if (employee.id === id) {
              return { ...employee, ...updateData };
            }
            return employee;
          });
          
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(updatedOfflineEmployees));
          return { 
            success: true, 
            employee: { ...employeeData, id, updatedAt: updateData.updatedAt, isOffline: true }, 
            isOffline: true 
          };
        } else {
          // Queue update for sync later
          const offlineEmployee = {
            id: `offline_emp_update_${Date.now()}`,
            originalId: id,
            data: updateData,
            userId,
            updatedAt: updateData.updatedAt,
            pendingAction: 'update',
            isOffline: true
          };
          
          offlineEmployees.push(offlineEmployee);
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(offlineEmployees));
          
          return { 
            success: true, 
            employee: { ...employeeData, id, updatedAt: updateData.updatedAt, isOffline: true }, 
            isOffline: true 
          };
        }
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete an employee
   */
  deleteEmployee: async (id) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (isOnline) {
        // Online deletion
        const docRef = doc(db, 'employees', id);
        await deleteDoc(docRef);
        return { success: true };
      } else {
        // Offline deletion logic
        const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
        const offlineEmployees = offlineEmployeesJson ? JSON.parse(offlineEmployeesJson) : [];
        
        // Check if this is an offline employee
        const isOfflineEmployee = id.startsWith('offline_emp_');
        
        if (isOfflineEmployee) {
          // Remove the offline employee from storage
          const filteredEmployees = offlineEmployees.filter(emp => emp.id !== id);
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(filteredEmployees));
        } else {
          // Queue delete for sync later
          const offlineEmployee = {
            id: `offline_emp_delete_${Date.now()}`,
            originalId: id,
            userId,
            updatedAt: new Date().toISOString(),
            pendingAction: 'delete',
            isOffline: true
          };
          
          offlineEmployees.push(offlineEmployee);
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(offlineEmployees));
        }
        
        return { success: true, isOffline: true };
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Pay an employee (add positive balance)
   */
  payEmployee: async (employeeId, paymentData) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      // Prepare the payment record
      const payment = {
        ...paymentData,
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        employeeId,
        userId,
        createdAt: new Date().toISOString(),
      };
      
      if (isOnline) {
        // Get the current employee
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (!employeeSnap.exists()) {
          return { success: false, error: "Employé non trouvé" };
        }
        
        const employeeData = employeeSnap.data();
        
        // Update employee with the new payment
        const payments = employeeData.payments || [];
        const updatedPayments = [...payments, payment];
        
        // Update balance
        const currentBalance = employeeData.balance || 0;
        const newBalance = currentBalance + payment.amount;
        
        // Format date in DD/MM/YYYY
        const today = new Date();
        const lastPayment = today.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        await updateDoc(employeeRef, {
          payments: updatedPayments,
          balance: newBalance,
          lastPayment,
          updatedAt: payment.createdAt
        });
        
        return { 
          success: true, 
          payment,
          updatedBalance: newBalance,
          lastPayment
        };
      } else {
        // Handle offline payment addition
        const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
        let offlineEmployees = offlineEmployeesJson ? JSON.parse(offlineEmployeesJson) : [];
        
        // Check if we're working with an offline employee
        const isOfflineEmployee = employeeId.startsWith('offline_emp_');
        
        // Format date in DD/MM/YYYY
        const today = new Date();
        const lastPayment = today.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        if (isOfflineEmployee) {
          // Find and update the offline employee
          const updatedOfflineEmployees = offlineEmployees.map(emp => {
            if (emp.id === employeeId) {
              const payments = emp.payments || [];
              const updatedPayments = [...payments, payment];
              const currentBalance = emp.balance || 0;
              const newBalance = currentBalance + payment.amount;
              
              return {
                ...emp,
                payments: updatedPayments,
                balance: newBalance,
                lastPayment,
                updatedAt: payment.createdAt
              };
            }
            return emp;
          });
          
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(updatedOfflineEmployees));
          
          // Find the updated employee to return the new balance
          const updatedEmployee = updatedOfflineEmployees.find(emp => emp.id === employeeId);
          
          return { 
            success: true, 
            payment,
            updatedBalance: updatedEmployee.balance,
            lastPayment,
            isOffline: true 
          };
        } else {
          // Create an offline payment operation
          const offlinePaymentOp = {
            id: `offline_emp_payment_${Date.now()}`,
            originalEmployeeId: employeeId,
            payment,
            lastPayment,
            userId,
            pendingAction: 'add_payment',
            isOffline: true
          };
          
          offlineEmployees.push(offlinePaymentOp);
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(offlineEmployees));
          
          return { 
            success: true, 
            payment,
            lastPayment,
            isOffline: true 
          };
        }
      }
    } catch (error) {
      console.error("Error paying employee:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a payment from an employee's record
   */
  deletePayment: async (employeeId, paymentId) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (isOnline) {
        // Get the current employee
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (!employeeSnap.exists()) {
          return { success: false, error: "Employé non trouvé" };
        }
        
        const employeeData = employeeSnap.data();
        const payments = employeeData.payments || [];
        
        // Find the payment to delete
        const paymentToDelete = payments.find(payment => payment.id === paymentId);
        if (!paymentToDelete) {
          return { success: false, error: "Paiement non trouvé" };
        }
        
        // Calculate new balance
        const currentBalance = employeeData.balance || 0;
        const newBalance = currentBalance - paymentToDelete.amount;
        
        // Filter out the payment to delete
        const updatedPayments = payments.filter(payment => payment.id !== paymentId);
        
        // Find the new last payment date
        let lastPayment = null;
        if (updatedPayments.length > 0) {
          const latestPayment = [...updatedPayments].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
          lastPayment = latestPayment.date;
        }
        
        // Update the employee document
        await updateDoc(employeeRef, {
          payments: updatedPayments,
          balance: newBalance,
          lastPayment: lastPayment,
          updatedAt: new Date().toISOString()
        });
        
        return { 
          success: true,
          deletedPayment: paymentToDelete,
          updatedBalance: newBalance,
          lastPayment
        };
      } else {
        // Handle offline payment deletion
        const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
        let offlineEmployees = offlineEmployeesJson ? JSON.parse(offlineEmployeesJson) : [];
        
        // Check if we're working with an offline employee
        const isOfflineEmployee = employeeId.startsWith('offline_emp_');
        
        if (isOfflineEmployee) {
          // Find and update the offline employee
          const updatedOfflineEmployees = offlineEmployees.map(emp => {
            if (emp.id === employeeId) {
              const payments = emp.payments || [];
              
              // Find the payment to delete
              const paymentToDelete = payments.find(payment => payment.id === paymentId);
              if (!paymentToDelete) {
                return emp; // Payment not found, return employee unchanged
              }
              
              // Calculate new balance
              const currentBalance = emp.balance || 0;
              const newBalance = currentBalance - paymentToDelete.amount;
              
              // Filter out the payment to delete
              const updatedPayments = payments.filter(payment => payment.id !== paymentId);
              
              // Find the new last payment date
              let lastPayment = null;
              if (updatedPayments.length > 0) {
                const latestPayment = [...updatedPayments].sort((a, b) => 
                  new Date(b.createdAt) - new Date(a.createdAt)
                )[0];
                lastPayment = latestPayment.date;
              }
              
              return {
                ...emp,
                payments: updatedPayments,
                balance: newBalance,
                lastPayment,
                updatedAt: new Date().toISOString()
              };
            }
            return emp;
          });
          
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(updatedOfflineEmployees));
          
          // Find the updated employee to return the new balance
          const updatedEmployee = updatedOfflineEmployees.find(emp => emp.id === employeeId);
          const paymentToDelete = (updatedEmployee.payments || []).find(p => p.id === paymentId);
          
          return { 
            success: true,
            deletedPayment: paymentToDelete,
            updatedBalance: updatedEmployee.balance,
            lastPayment: updatedEmployee.lastPayment,
            isOffline: true 
          };
        } else {
          // Create an offline payment delete operation
          const offlinePaymentOp = {
            id: `offline_emp_delete_payment_${Date.now()}`,
            originalEmployeeId: employeeId,
            paymentId,
            userId,
            pendingAction: 'delete_payment',
            isOffline: true,
            timestamp: new Date().toISOString()
          };
          
          offlineEmployees.push(offlinePaymentOp);
          await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(offlineEmployees));
          
          return { 
            success: true,
            isOffline: true 
          };
        }
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sync offline employee operations when coming back online
   */
  syncOfflineEmployees: async () => {
    try {
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      if (!isOnline) {
        return { success: false, error: "Pas de connexion internet" };
      }
      
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const offlineEmployeesJson = await AsyncStorage.getItem(OFFLINE_EMPLOYEES_KEY);
      if (!offlineEmployeesJson) {
        return { success: true, message: "Aucune donnée hors ligne à synchroniser" };
      }
      
      const offlineEmployees = JSON.parse(offlineEmployeesJson);
      const userOfflineData = offlineEmployees.filter(item => item.userId === userId);
      
      if (userOfflineData.length === 0) {
        return { success: true, message: "Aucune donnée hors ligne à synchroniser" };
      }
      
      // Sync each offline operation one by one
      const syncedIds = [];
      
      for (const item of userOfflineData) {
        try {
          if (item.pendingAction === 'add' && item.id.startsWith('offline_emp_')) {
            // Add a new employee
            const { id, isOffline, pendingAction, ...employeeData } = item;
            const docRef = await addDoc(collection(db, 'employees'), {
              ...employeeData,
              syncedFromOffline: true
            });
            syncedIds.push(item.id);
          } 
          else if (item.pendingAction === 'update') {
            // Update an employee
            const docRef = doc(db, 'employees', item.originalId);
            await updateDoc(docRef, {
              ...item.data,
              syncedFromOffline: true
            });
            syncedIds.push(item.id);
          }
          else if (item.pendingAction === 'delete') {
            // Delete an employee
            const docRef = doc(db, 'employees', item.originalId);
            await deleteDoc(docRef);
            syncedIds.push(item.id);
          }
          else if (item.pendingAction === 'add_payment') {
            // Add a payment to an employee
            const employeeRef = doc(db, 'employees', item.originalEmployeeId);
            const employeeSnap = await getDoc(employeeRef);
            
            if (employeeSnap.exists()) {
              const employeeData = employeeSnap.data();
              const payments = employeeData.payments || [];
              const updatedPayments = [...payments, item.payment];
              
              // Update balance
              const currentBalance = employeeData.balance || 0;
              const newBalance = currentBalance + item.payment.amount;
              
              await updateDoc(employeeRef, {
                payments: updatedPayments,
                balance: newBalance,
                lastPayment: item.lastPayment,
                updatedAt: new Date().toISOString(),
                syncedFromOffline: true
              });
            }
            
            syncedIds.push(item.id);
          }
          else if (item.pendingAction === 'delete_payment') {
            // Delete a payment from an employee
            const employeeRef = doc(db, 'employees', item.originalEmployeeId);
            const employeeSnap = await getDoc(employeeRef);
            
            if (employeeSnap.exists()) {
              const employeeData = employeeSnap.data();
              const payments = employeeData.payments || [];
              
              // Find the payment to delete
              const paymentToDelete = payments.find(payment => payment.id === item.paymentId);
              
              if (paymentToDelete) {
                // Calculate new balance
                const currentBalance = employeeData.balance || 0;
                const newBalance = currentBalance - paymentToDelete.amount;
                
                // Filter out the payment to delete
                const updatedPayments = payments.filter(payment => payment.id !== item.paymentId);
                
                // Find the new last payment date
                let lastPayment = null;
                if (updatedPayments.length > 0) {
                  const latestPayment = [...updatedPayments].sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                  )[0];
                  lastPayment = latestPayment.date;
                }
                
                await updateDoc(employeeRef, {
                  payments: updatedPayments,
                  balance: newBalance,
                  lastPayment: lastPayment,
                  updatedAt: new Date().toISOString(),
                  syncedFromOffline: true
                });
              }
            }
            
            syncedIds.push(item.id);
          }
        } catch (error) {
          console.error(`Error syncing offline employee operation ${item.id}:`, error);
          // Continue with the next item despite errors
        }
      }
      
      // Remove synced items from offline storage
      const remainingItems = offlineEmployees.filter(item => !syncedIds.includes(item.id));
      await AsyncStorage.setItem(OFFLINE_EMPLOYEES_KEY, JSON.stringify(remainingItems));
      
      return {
        success: true,
        syncedCount: syncedIds.length,
        syncedIds: syncedIds, // Return the IDs that were synced
        syncedItems: userOfflineData.filter(item => syncedIds.includes(item.id)) // Return the synced items
      };
    } catch (error) {
      console.error("Error syncing offline employees:", error);
      return { success: false, error: error.message };
    }
  }
};