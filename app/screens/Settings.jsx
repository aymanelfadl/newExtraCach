import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { userService, authService } from '../../services/index';
import { useUser } from '../../context/UserContext';
import Header from '../../components/Header';

const Settings = () => {
  const { setViewingAsUser, viewingAs } = useUser();
  const navigation = useNavigation();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert("Erreur", "Utilisateur non authentifié.");
        return;
      }
      setCurrentUser(user);
      const result = await userService.getUsersWithSharedAccess();
      setAvailableUsers(result.users); 
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  const handleUserSwitch = async (user) => {
    try {
      await setViewingAsUser(user);
      Alert.alert("Compte utilisateur changé", `Vous consultez maintenant le compte de ${user.fullName}`);
    } catch (error) {
      console.error('Error switching user:', error);
      Alert.alert("Erreur", "Impossible de changer d'utilisateur.");
    }
  };

  const handleReturnToMyAccount = async () => {
    try {
      await setViewingAsUser(null);
      Alert.alert("Retour à votre compte", "Vous consultez maintenant votre propre compte");
    } catch (error) {
      console.error('Error returning to account:', error);
      Alert.alert("Erreur", "Impossible de revenir à votre compte.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          onPress: async () => {
            await authService.logout();
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header screenName="Paramètres" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Gestion de Compte</Text>
          <View style={styles.sectionContent}>
            {currentUser && (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  !viewingAs && styles.activeUserItem
                ]}
                onPress={handleReturnToMyAccount}
              >
                <View style={styles.userIcon}>
                  <Text style={styles.userInitial}>{currentUser.fullName?.charAt(0) || currentUser.username?.charAt(0) || "?"}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{currentUser.fullName || currentUser.username} (Vous)</Text>
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                </View>
                {!viewingAs && <Icon name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            )}

            {availableUsers.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Comptes partagés</Text>
                {availableUsers.map(item => (
                  <TouchableOpacity
                    key={item.uid}
                    style={[
                      styles.userItem,
                      viewingAs?.uid === item.uid && styles.activeUserItem
                    ]}
                    onPress={() => handleUserSwitch(item)}
                  >
                    <View style={[styles.userIcon, {backgroundColor: colors.income}]}>
                      <Text style={styles.userInitial}>{item.fullName?.charAt(0) || "?"}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.fullName}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    {viewingAs?.uid === item.uid && <Icon name="check-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {availableUsers.length === 0 && !refreshing && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucun utilisateur partagé</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddSharedUser')}
          >
            <Icon name="account-plus" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Ajouter un utilisateur partagé</Text>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color={colors.white} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: spacing.extraLarge * 2,
  },
  settingSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    marginBottom: spacing.medium,
    ...shadows.medium,
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionContent: {
    padding: spacing.small,
  },
  subsectionTitle: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
    marginLeft: spacing.small,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.small,
  },
  activeUserItem: {
    backgroundColor: `${colors.primary}15`,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  userInitial: {
    color: colors.white,
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: spacing.large,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: typography.sizeRegular,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: spacing.medium,
    fontSize: typography.sizeMedium,
    color: colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginTop: spacing.medium,
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    ...shadows.small,
  },
  logoutText: {
    color: colors.white,
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
    marginLeft: spacing.small,
  }
});

export default Settings;