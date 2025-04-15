import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { signInAsGuest } from "../../services/FirebaseService";

const LogIn = ({ onLogin }) => {

  const handleGuestLogin = async () => {
    try {
      const user = await signInAsGuest();
      console.log('Guest user ID:', user.uid);
      onLogin(user.uid);
    } catch (error) {
      Alert.alert('Login failed', 'Could not sign in as guest');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Button title="Continue as Guest" onPress={handleGuestLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});

export default LogIn;
