import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Text, 
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const CardList = ({ 
  data, 
  numColumns = 1, 
  onCardPress,
  onDeletePress,
  onEditPress,
  emptyMessage = "Aucun élément trouvé",
  isLoading = false,
  refreshControl,
  isExpenseScreen = false // Flag to determine if this is expense or revenue screen
}) => {
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('Tous');
  const [monthsMenuVisible, setMonthsMenuVisible] = useState(false);
  const [availableMonths, setAvailableMonths] = useState(['Tous']);
  const [filteredData, setFilteredData] = useState(data);
  const [allMonths, setAllMonths] = useState([]);

  useEffect(() => {
    const monthNames = {
      '01': 'Janvier',
      '02': 'Février',
      '03': 'Mars',
      '04': 'Avril',
      '05': 'Mai', 
      '06': 'Juin',
      '07': 'Juillet',
      '08': 'Août',
      '09': 'Septembre',
      '10': 'Octobre',
      '11': 'Novembre',
      '12': 'Décembre'
    };
    
    const currentYear = new Date().getFullYear().toString();
    
    // Create array with all months for current year in chronological order
    const allMonthsArray = Object.entries(monthNames)
      .sort(([numA], [numB]) => parseInt(numA) - parseInt(numB))
      .map(([num, name]) => {
        return { num, name, year: currentYear };
      });
    setAllMonths(allMonthsArray);
    
    if (data && data.length > 0) {
      const months = data.map(item => {
        const dateParts = (item.dateAdded || '').split('/');
        if (dateParts.length === 3) {
          const month = dateParts[1];
          const year = dateParts[2];
          return `${month}/${year}`;
        }
        return null;
      }).filter(Boolean);

      // Get unique months
      const uniqueMonths = ['Tous', ...new Set(months)];
      
      // Format months as "Month Year"
      const formattedMonths = uniqueMonths.map(month => {
        if (month === 'Tous') return 'Tous';
        const [monthNum, year] = month.split('/');
        return `${monthNames[monthNum] || monthNum} ${year}`;
      });
      
      setAvailableMonths(formattedMonths);
    }
  }, [data]);

  // Filter data by selected month
  useEffect(() => {
    if (selectedMonth === 'Tous') {
      setFilteredData(data);
    } else {
      // Extract month and year from selected month
      const monthParts = selectedMonth.split(' ');
      if (monthParts.length >= 2) {
        const selectedMonthName = monthParts[0];
        const selectedYear = monthParts[1];
        
        // Map month names back to numbers
        const monthNumbers = {
          'Janvier': '01',
          'Février': '02',
          'Mars': '03',
          'Avril': '04',
          'Mai': '05',
          'Juin': '06',
          'Juillet': '07',
          'Août': '08',
          'Septembre': '09',
          'Octobre': '10',
          'Novembre': '11',
          'Décembre': '12'
        };
        
        const selectedMonthNum = monthNumbers[selectedMonthName];
        
        // Filter data by month/year
        const filtered = data.filter(item => {
          const dateParts = (item.dateAdded || '').split('/');
          if (dateParts.length === 3) {
            const month = dateParts[1];
            const year = dateParts[2];
            return month === selectedMonthNum && year === selectedYear;
          }
          return false;
        });
        
        setFilteredData(filtered);
      } else {
        setFilteredData(data);
      }
    }
  }, [selectedMonth, data]);

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
        style={styles.listItemContainer} 
        onPress={() => onCardPress && onCardPress(item)} 
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
      >
        <View style={styles.listItemContent}>
          <View style={styles.leftContent}>
            <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.dateAdded}>{item.dateAdded}</Text>
          </View>
          <View style={styles.rightContent}>
            <Text style={[styles.amount, { color: amountColor }]}>
              <Text style={{ fontWeight: typography.weightBold }}>{amountPrefix}</Text>
              {item.spends || item.amount} MAD
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Month filter button */}
      <TouchableOpacity 
        style={[
          styles.monthFilterButton,
          {
            borderWidth: 1, 
            borderColor: isExpenseScreen ? colors.expense : colors.income,
            backgroundColor: selectedMonth !== 'Tous' 
              ? (isExpenseScreen ? `${colors.expense}10` : `${colors.income}10`) 
              : colors.card
          }
        ]}
        onPress={() => setMonthsMenuVisible(true)}
      >
        <Text style={[
          styles.monthFilterText, 
          {color: isExpenseScreen ? colors.expense : colors.income}
        ]}>
          {selectedMonth}
        </Text>
        <Icon 
          name="chevron-down" 
          size={20} 
          color={isExpenseScreen ? colors.expense : colors.income} 
        />
      </TouchableOpacity>
      
      {/* Items list */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString()}
        numColumns={numColumns}
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

      {/* Action menu modal */}
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

      {/* Months selection modal */}
      <Modal
        transparent={true}
        visible={monthsMenuVisible}
        animationType="slide"
        onRequestClose={() => setMonthsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMonthsMenuVisible(false)}
        >
          <View style={styles.monthsMenu}>
            <View style={[styles.monthsMenuHeader, {backgroundColor: isExpenseScreen ? `${colors.expense}10` : `${colors.income}10`}]}>
              <Text style={[styles.monthsMenuTitle, {color: isExpenseScreen ? colors.expense : colors.income}]}>
                Sélectionner un mois
              </Text>
            </View>
            <View style={styles.divider} />
            
            <ScrollView style={styles.monthsList}>
              {/* All option */}
              <TouchableOpacity
                key="all"
                style={[
                  styles.monthItem,
                  selectedMonth === 'Tous' && { 
                    backgroundColor: isExpenseScreen 
                      ? `${colors.expense}20`  // Red background for expense
                      : `${colors.income}10`   // Green background for revenue
                  }
                ]}
                onPress={() => {
                  setSelectedMonth('Tous');
                  setMonthsMenuVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.monthItemText,
                    selectedMonth === 'Tous' && { 
                      fontWeight: typography.weightSemiBold,
                      color: isExpenseScreen ? colors.expense : colors.income
                    }
                  ]}
                >
                  Tous
                </Text>
                {selectedMonth === 'Tous' && (
                  <Icon name="check" size={20} color={isExpenseScreen ? colors.expense : colors.income} />
                )}
              </TouchableOpacity>
              
              {/* Month list */}
              {allMonths.map((month, index) => {
                const monthYear = `${month.name} ${month.year}`;
                const isMonthInData = availableMonths.includes(monthYear);
                const isSelected = selectedMonth === monthYear;
                
                // Determine if this is the current month
                const today = new Date();
                const isCurrentMonth = month.num === String(today.getMonth() + 1).padStart(2, '0') && 
                                      month.year === today.getFullYear().toString();
                
                // Determine color based on isExpenseScreen prop
                const monthColor = isExpenseScreen ? colors.expense : colors.income;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthItem,
                      isSelected && { 
                        backgroundColor: isExpenseScreen 
                          ? `${colors.expense}20`  // Red background for expense
                          : `${colors.income}10`   // Green background for revenue
                      },
                      isCurrentMonth && { borderLeftWidth: 3, borderLeftColor: monthColor }
                    ]}
                    onPress={() => {
                      setSelectedMonth(monthYear);
                      setMonthsMenuVisible(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.monthItemText,
                        // Only highlight months with data when "Tous" is selected
                        selectedMonth === 'Tous' && isMonthInData 
                          ? { color: isExpenseScreen ? colors.expense : colors.income, opacity: 0.8 } 
                          : null,
                        // Current month indicator
                        isCurrentMonth && { fontWeight: typography.weightMedium },
                        // Full highlight for selected month
                        isSelected && { 
                          fontWeight: typography.weightSemiBold, 
                          color: monthColor 
                        }
                      ]}
                    >
                      {monthYear}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size={20} color={monthColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  listItemContainer: {
    backgroundColor: colors.card,
    marginBottom: spacing.small,
    borderRadius: borderRadius.medium,
    ...shadows.small,
    overflow: 'hidden',
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
  },
  leftContent: {
    flex: 1,
    marginRight: spacing.small,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  description: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  amount: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightSemiBold,
  },
  dateAdded: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  monthFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    margin: spacing.medium,
    marginBottom: 0,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  monthFilterText: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
  },
  monthsMenu: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    width: width * 0.9,
    maxHeight: height * 0.7,
    ...shadows.large,
    overflow: 'hidden',
  },
  monthsMenuHeader: {
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    width: '100%',
  },
  monthsMenuTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightSemiBold,
    textAlign: 'center',
  },
  monthsList: {
    maxHeight: height * 0.6,
    paddingBottom: spacing.medium,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  monthItemText: {
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
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