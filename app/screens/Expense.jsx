import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';

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
            console.log(`Item deleted: ${description}`);
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

  const handleSaveExpense = (expenseData) => {
    if (editingItem) {
      setExpenses(expenses.map(item => 
        item.id === editingItem.id ? 
        { 
          ...item, 
          description: expenseData.description, 
          spends: expenseData.spends,
          dateAdded: expenseData.dateAdded 
        } : 
        item
      ));
      console.log(`Item updated: ${editingItem.id}`);
    } else {
      const newExpense = {
        id: Date.now().toString(),
        description: expenseData.description,
        spends: expenseData.spends,
        dateAdded: expenseData.dateAdded,
        isExpense: true
      };
      setExpenses([newExpense, ...expenses]);
      console.log('New expense added');
    }
    
    setModalVisible(false);
    setEditingItem(null);
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
      
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={30} color={colors.card} />
      </TouchableOpacity>
      
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
});

export default Expense;