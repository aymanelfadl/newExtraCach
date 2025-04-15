import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AddExpense from '../../components/AddExpense';
import Header from '../../components/Header';
import CardList from '../../components/CardList';

const Expense = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);
  const [expenses, setExpenses] = useState([
    {
      id: '1',
      description: 'Courses alimentaires',
      spends: 250,
      dateAdded: '15/04/2025',
      isExpense: true
    },
    {
      id: '2',
      description: 'Transport',
      spends: 100,
      dateAdded: '14/04/2025',
      isExpense: true
    },
    {
      id: '3',
      description: 'Restaurant',
      spends: 180,
      dateAdded: '12/04/2025',
      isExpense: true
    },
    {
      id: '4',
      description: 'Facture électricité',
      spends: 300,
      dateAdded: '10/04/2025',
      isExpense: true
    }
  ]);
  const [editingItem, setEditingItem] = useState(null);
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredItems = () => {
    if (!searchQuery) {
      return expenses;
    }
    
    return expenses.filter(item => 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.spends.toString().includes(searchQuery) ||
      item.dateAdded.includes(searchQuery)
    );
  };

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
          onPress: () => {
            setExpenses(expenses.filter(item => item.id !== id));
            console.log(`Item deleted: ${id}`);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleEditPress = (item) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
  };

  const handleAddOrUpdateExpense = (newExpense) => {
    if (editingItem) {
      // Update existing expense
      setExpenses(expenses.map(item => 
        item.id === editingItem.id ? { ...item, ...newExpense } : item
      ));
      setEditingItem(null);
    } else {
      // Add new expense
      const expenseToAdd = {
        id: Date.now().toString(), // Simple ID generation
        ...newExpense,
        dateAdded: new Date().toLocaleDateString('fr-FR'),
        isExpense: true
      };
      setExpenses([expenseToAdd, ...expenses]);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header screenName={"Dépenses"} onSearching={handleSearch} />
      
      <CardList 
        data={filteredItems()}
        onDeletePress={handleDeletePress}
        onEditPress={handleEditPress}
        emptyMessage="Aucun dépenses trouvé"
      />
      
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}><Icon name="plus" size={40} color="white" /></Text>
      </TouchableOpacity>
      
      {modalVisible && (
        <AddExpense 
          visible={modalVisible} 
          onClose={handleCloseModal}
          onSave={handleAddOrUpdateExpense}
          initialData={editingItem}
          isEditing={!!editingItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    margin: 0,
    backgroundColor: 'rgb(249 250 251)',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'crimson',
    width: 60,
    height: 60,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5
  },
  buttonText: {
    color: '#fff',
    fontSize: 50,
  },
});

export default Expense;