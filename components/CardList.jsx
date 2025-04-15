import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Text, 
  TouchableOpacity,
  Modal,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CardList = ({ 
  data, 
  numColumns = 2, 
  onCardPress,
  onDeletePress,
  onEditPress,
  emptyMessage = "Aucun élément trouvé"
}) => {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState(null);

  const handleLongPress = (item, event) => {
    // Get the touch position for placing the menu
    const { pageX, pageY } = event.nativeEvent;
    
    setSelectedItemId(item.id);
    setSelectedItem(item);
    setMenuPosition({ x: pageX, y: pageY });
    setActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setActionMenuVisible(false);
    setSelectedItemId(null);
  };

  const handleDelete = () => {
    if (onDeletePress && selectedItemId) {
      onDeletePress(selectedItemId);
      closeActionMenu();
    }
  };

  const handleEdit = () => {
    if (onEditPress && selectedItem) {
      onEditPress(selectedItem);
      closeActionMenu();
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.itemContainer} 
        onPress={() => onCardPress && onCardPress(item)} 
        onLongPress={(event) => handleLongPress(item, event)}
        delayLongPress={500}
      >
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.amount}>
          <Text style={{ fontWeight: "bold" }}>{item.isExpense ? '-' : '+'}</Text>
          {item.spends || item.amount} MAD
        </Text>
        <Text style={styles.dateAdded}>{item.dateAdded}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString()}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        }
      />

      {/* Action Menu Modal */}
      <Modal
        transparent={true}
        visible={actionMenuVisible}
        animationType="fade"
        onRequestClose={closeActionMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeActionMenu}
        >
          <View 
            style={[
              styles.actionMenu,
              {
                left: menuPosition.x - 70, // Adjust these values to position the menu appropriately
                top: menuPosition.y - 60,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEdit}
            >
              <Icon name="pencil" size={24} color="#2196F3" />
              <Text style={styles.actionText}>Modifier</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Icon name="delete" size={24} color="crimson" />
              <Text style={[styles.actionText, {color: 'crimson'}]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 30,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'white',
    shadowColor: 'gray',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
    color: "#000",
    marginBottom: 5,
  },
  amount: {
    color: "#000",
    fontSize: 14,
    marginBottom: 2,
  },
  dateAdded: {
    fontSize: 12,
    color: '#666',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyMessage: {
    color: "gray", 
    textAlign: "center", 
    padding: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionMenu: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    width: 140,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  actionText: {
    marginLeft: 10,
    fontWeight: '500',
    color: '#2196F3',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  }
});

export default CardList;