import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { userService, authService } from '../../services/index';
import { useUser } from '../../context/UserContext';

const Settings = () => {
  const { setViewingAsUser, viewingAs } = useUser();
  const navigation = useNavigation();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert("Erreur", "Utilisateur non authentifié.");
        return;
      }
      setCurrentUser(user);
      const result = await userService.getUsersWithSharedAccess();
      setAvailableUsers(result.users); 
    };
    loadData();
  }, []);

  const handleUserSwitch = async (user) => {
    await setViewingAsUser(user);
    Alert.alert("Compte utilisateur changé", `Vous consultez maintenant le compte de ${user.fullName}`);
  };

  const handleReturnToMyAccount = async () => {
    await setViewingAsUser(null);
    Alert.alert("Retour à votre compte", "Vous consultez maintenant votre propre compte");
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
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
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingSection}>
        <Text style={styles.sectionLabel}>Voir un autre compte</Text>
        {currentUser && (
          <TouchableOpacity
            style={[
              styles.userItem,
              !viewingAs && styles.activeUserItem
            ]}
            onPress={handleReturnToMyAccount}
          >
            <Text style={styles.userName}>{currentUser.fullName || currentUser.username} (Vous)</Text>
            {!viewingAs && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
          </TouchableOpacity>
        )}
        <FlatList
          data={availableUsers}
          keyExtractor={item => item.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.userItem,
                viewingAs?.uid === item.uid && styles.activeUserItem
              ]}
              onPress={() => handleUserSwitch(item)}
            >
              <Text style={styles.userName}>{item.fullName}</Text>
              {viewingAs?.uid === item.uid && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{color: "#999", margin: 10}}>Aucun utilisateur partagé.</Text>}
        />
      </View>
        <TouchableOpacity style={styles.settingItemButton}
            onPress={() => navigation.navigate('AddSharedUser')}>
            <Text style={styles.settingText}>Ajouter un utilisateur partagé</Text>
            <Ionicons name="chevron-forward" size={24} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#f5f5f5', padding: 16
  },
  title: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#333'
  },
  settingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 24,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  activeUserItem: {
    backgroundColor: '#E8F5E9'
  },
  userName: {
    fontSize: 16,
    color: '#333'
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default Settings;