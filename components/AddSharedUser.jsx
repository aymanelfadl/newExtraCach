import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/index';

const AddSharedUser = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "L'email ne peut pas être vide.");
      return;
    }
    setLoading(true);
  
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      Alert.alert("Erreur", "Utilisateur courant non authentifié.");
      return;
    }
    console.log("currentUser", currentUser);
    const result = await authService.grantAccess(currentUser.uid, email.trim());
    setLoading(false);
  
    if (result.success) {
      Alert.alert("Succès", "L'utilisateur a été ajouté comme utilisateur partagé.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert("Erreur", result.error || "Impossible d'ajouter l'utilisateur.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.title}>Ajouter un utilisateur partagé</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Email de l'utilisateur :</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="exemple@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddUser} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Ajouter</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  backButton: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 32, color: '#333' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 16, marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 18, backgroundColor: '#fafafa' },
  addButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddSharedUser;