import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { authService } from '../services/authService';

const AccountSwitcher = ({ onAccountSwitch, onReset }) => {
  const [visible, setVisible] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentViewingAs, setCurrentViewingAs] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkCurrentStatus = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        const viewingAs = await authService.checkViewingAs();
        setCurrentViewingAs(viewingAs);
      } catch (error) {
        console.error('Error checking current status:', error);
      }
    };
    
    checkCurrentStatus();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      
      if (!user) {
        return;
      }
      
      const result = await authService.getAccessibleAccounts(user.uid);
      
      if (result.success) {
        setAccounts(result.accounts);
      } else {
        console.error('Failed to load accounts:', result.error);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setVisible(true);
    loadAccounts();
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleAccountSelect = async (account) => {
    try {
      setLoading(true);
      const result = await authService.switchToAccount(account.uid);
      
      if (result.success) {
        if (onAccountSwitch) {
          onAccountSwitch(account);
        }
        handleClose();
      } else {
        console.error('Failed to switch account:', result.error);
      }
    } catch (error) {
      console.error('Error selecting account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToOriginalUser = async () => {
    try {
      setLoading(true);
      const result = await authService.resetToOriginalUser();
      
      if (result.success) {
        if (onReset) {
          onReset();
        }
        setCurrentViewingAs(null);
        handleClose();
      } else {
        console.error('Failed to reset to original user:', result.error);
      }
    } catch (error) {
      console.error('Error resetting to original user:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.accountItem} 
      onPress={() => handleAccountSelect(item)}
    >
      <View style={styles.accountAvatar}>
        <Text style={styles.accountInitial}>
          {item.fullName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{item.fullName}</Text>
        <Text style={styles.accountEmail}>{item.email}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  // Don't render the switcher if user has no accessible accounts and is not viewing another account
  if (!currentViewingAs && (!currentUser?.hasAccessTo || currentUser?.hasAccessTo.length === 0)) {
    return null;
  }

  return (
    <>
      {/* Button to open account switcher */}
      <TouchableOpacity style={styles.switcherButton} onPress={handleOpen}>
        <Icon name="account-switch" size={18} color={colors.primary} />
        <Text style={styles.switcherButtonText}>
          {currentViewingAs 
            ? `Voir en tant que: ${currentViewingAs.viewingAs.fullName}` 
            : 'Changer de compte'}
        </Text>
      </TouchableOpacity>

      {/* Account switcher modal */}
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer de compte</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {currentViewingAs && (
              <View style={styles.currentViewingContainer}>
                <Text style={styles.currentViewingText}>
                  Vous visualisez le compte de {currentViewingAs.viewingAs.fullName}
                </Text>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleResetToOriginalUser}
                >
                  <Text style={styles.resetButtonText}>Revenir à mon compte</Text>
                </TouchableOpacity>
              </View>
            )}

            {loading ? (
              <ActivityIndicator 
                size="large" 
                color={colors.primary} 
                style={styles.loader} 
              />
            ) : accounts.length > 0 ? (
              <>
                <Text style={styles.accountsListHeader}>
                  Comptes disponibles
                </Text>
                <FlatList
                  data={accounts}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.uid}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  contentContainerStyle={styles.accountsList}
                />
              </>
            ) : (
              <Text style={styles.noAccountsText}>
                Aucun autre compte disponible
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    ...shadows.small,
  },
  switcherButtonText: {
    color: colors.primary,
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightSemiBold,
    marginLeft: spacing.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.extraLarge,
    borderTopRightRadius: borderRadius.extraLarge,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.small,
  },
  currentViewingContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    margin: spacing.medium,
  },
  currentViewingText: {
    color: colors.primary,
    fontSize: typography.sizeRegular,
    marginBottom: spacing.small,
  },
  resetButton: {
    backgroundColor: colors.primary,
    padding: spacing.small,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: typography.weightSemiBold,
  },
  accountsListHeader: {
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    padding: spacing.medium,
  },
  accountsList: {
    paddingBottom: spacing.extraLarge,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  accountInitial: {
    color: 'white',
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
  },
  accountEmail: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 56,
  },
  loader: {
    padding: spacing.extraLarge,
  },
  noAccountsText: {
    padding: spacing.large,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

export default AccountSwitcher;