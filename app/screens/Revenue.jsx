import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import AddRevenue from '../../components/AddRevenue';
import Header from '../../components/Header';
import CardList from '../../components/CardList';

const Revenue = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);
  const [revenues, setRevenues] = useState([
    {
      id: '1',
      description: 'Salaire',
      spends: 4500,
      dateAdded: '15/04/2025',
      isExpense: false
    },
    {
      id: '2',
      description: 'Freelance',
      spends: 1200,
      dateAdded: '12/04/2025',
      isExpense: false
    },
    {
      id: '3',
      description: 'Dividendes',
      spends: 350,
      dateAdded: '10/04/2025',
      isExpense: false
    },
    {
      id: '4',
      description: 'Remboursement',
      spends: 80,
      dateAdded: '05/04/2025',
      isExpense: false
    }
  ]);
  const [editingItem, setEditingItem] = useState(null);
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredItems = () => {
    if (!searchQuery) {
      return revenues;
    }
    
    return revenues.filter(item => 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.spends.toString().includes(searchQuery) ||
      item.dateAdded.includes(searchQuery)
    );
  };

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
          onPress: () => {
            setRevenues(revenues.filter(item => item.id !== id));
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

  const handleSaveRevenue = (revenueData) => {
    if (editingItem) {
      // Update existing revenue
      setRevenues(revenues.map(item => 
        item.id === editingItem.id ? 
        { 
          ...item, 
          description: revenueData.description, 
          spends: revenueData.spends,
          dateAdded: revenueData.dateAdded 
        } : 
        item
      ));
      console.log(`Item updated: ${editingItem.id}`);
    } else {
      // Add new revenue
      const newRevenue = {
        id: Date.now().toString(),
        description: revenueData.description,
        spends: revenueData.spends,
        dateAdded: revenueData.dateAdded,
        isExpense: false
      };
      setRevenues([newRevenue, ...revenues]);
      console.log('New revenue added');
    }
    
    setModalVisible(false);
    setEditingItem(null);
  };

  return (
    <View style={styles.container}>
      <Header screenName={"Revenus"} onSearching={handleSearch} />
      
      <CardList 
        data={filteredItems()}
        onDeletePress={handleDeletePress}
        onEditPress={handleEditPress}
        emptyMessage="Aucun revenu trouvé"
      />
      
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}><Icon name="plus" size={40} color="white" /></Text>
      </TouchableOpacity>
      
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
    flex: 1,
    position: 'relative',
    margin: 0,
    backgroundColor: 'rgb(249 250 251)',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4CAF50', // Green for revenue, as opposed to crimson for expenses
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

export default Revenue;