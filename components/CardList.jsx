import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Text, 
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const CardList = ({ 
  data, 
  numColumns = 2, 
  onCardPress,
  onDeletePress,
  onEditPress,
  emptyMessage = "Aucun élément trouvé"
}) => {
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleLongPress = (item) => {
    setSelectedItem(item);
    setActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setActionMenuVisible(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (onDeletePress && selectedItem) {
      onDeletePress(selectedItem.id);
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
        onLongPress={() => handleLongPress(item)}
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
          <View style={styles.actionMenu}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {selectedItem?.description}
              </Text>
              <Text style={styles.itemSubtitle}>
                {selectedItem?.spends} MAD • {selectedItem?.dateAdded}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Icon name="pencil" size={24} color="#2196F3" />
                <Text style={styles.actionText}>Modifier</Text>
              </TouchableOpacity>
              
              <View style={styles.buttonDivider} />
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Icon name="delete" size={24} color="crimson" />
                <Text style={[styles.actionText, {color: 'crimson'}]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
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
  // Action menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenu: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.8,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  itemInfo: {
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  actionText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#2196F3',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  buttonDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  }
});

export default CardList;