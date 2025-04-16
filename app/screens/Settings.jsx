import React, { useState } from 'react';
import { 
        View, 
        Text, 
        StyleSheet, 
        TouchableOpacity, 
        Switch,
        Alert 
    } from 'react-native';
    
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo
const Settings = () => {
const navigation = useNavigation();
const [notifications, setNotifications] = useState(true);
const [darkMode, setDarkMode] = useState(false);

const handleLogout = () => {
    Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
            {
                text: "Cancel",
                style: "cancel"
            },
            { 
                text: "Logout", 
                onPress: () => {
                    // Add your logout logic here
                    // Example: await auth.signOut();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }]
                    });
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
            <View style={styles.settingItem}>
                <Text style={styles.settingText}>Notifications</Text>
                <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: "#767577", true: "#4CAF50" }}
                />
            </View>
            
            <View style={styles.settingItem}>
                <Text style={styles.settingText}>Dark Mode</Text>
                <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: "#767577", true: "#4CAF50" }}
                />
            </View>
            
            <TouchableOpacity style={styles.settingItemButton} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.settingText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={24} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItemButton} onPress={() => navigation.navigate('ChangePassword')}>
                <Text style={styles.settingText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={24} color="#555" />
            </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
    </SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
},
title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333'
},
settingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
},
settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
},
settingItemButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
},
settingText: {
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