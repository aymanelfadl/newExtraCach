import { useState } from 'react';
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
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const CardList = ({ 
  data, 
  numColumns = 2, 
  onCardPress,
  onDeletePress,
  onEditPress,
  emptyMessage = "Aucun élément trouvé",
  isLoading = false,
  refreshControl
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
    const amountColor = item.isExpense ? colors.expense : colors.income;
    const amountPrefix = item.isExpense ? '-' : '+';

    return (
      <TouchableOpacity 
        style={styles.itemContainer} 
        onPress={() => onCardPress && onCardPress(item)} 
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
      >
        <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        <Text style={[styles.amount, { color: amountColor }]}>
          <Text style={{ fontWeight: typography.weightBold }}>{amountPrefix}</Text>
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
        contentContainerStyle={styles.listContainer}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="currency-usd-off" size={50} color={colors.textDisabled} />
            <Text style={styles.emptyMessage}>
              {isLoading ? "Chargement..." : emptyMessage}
            </Text>
          </View>
        }
      />

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
                {selectedItem?.isExpense ? '-' : '+'}{selectedItem?.spends} MAD • {selectedItem?.dateAdded}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Icon name="pencil" size={24} color={colors.info} />
                <Text style={styles.actionText}>Modifier</Text>
              </TouchableOpacity>
              
              <View style={styles.buttonDivider} />
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Icon name="delete" size={24} color={colors.error} />
                <Text style={[styles.actionText, {color: colors.error}]}>Supprimer</Text>
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
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.small,
    paddingBottom: spacing.extraLarge,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    flex: 1,
    margin: spacing.small,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: colors.card,
    ...shadows.medium,
    marginBottom: spacing.small,
  },
  description: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
    textAlign: 'center',
  },
  amount: {
    fontSize: typography.sizeRegular,
    marginBottom: spacing.tiny,
    fontWeight: typography.weightMedium,
  },
  dateAdded: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    color: colors.textSecondary, 
    textAlign: "center", 
    marginTop: spacing.medium,
    fontSize: typography.sizeRegular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenu: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    width: width * 0.8,
    maxWidth: 300,
    ...shadows.large,
    overflow: 'hidden',
  },
  itemInfo: {
    padding: spacing.medium,
    backgroundColor: colors.background,
  },
  itemTitle: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  itemSubtitle: {
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
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
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.small,
  },
  actionText: {
    marginLeft: spacing.small,
    fontWeight: typography.weightMedium,
    color: colors.info,
    fontSize: typography.sizeRegular,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  buttonDivider: {
    width: 1,
    backgroundColor: colors.divider,
  }
});

export default CardList;