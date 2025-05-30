import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useUser } from '../../context/UserContext';

const LogIn = () => {

  const FormInput = require('../../components/FormInput').default;
  const { useAuth } = require('../hooks/useAuth');
  
  const { isOnline } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const { 
    loading, 
    errorMessage, 
    setErrorMessage,
    validateForm, 
    handleLogin, 
    handleRegister 
  } = useAuth();
  useEffect(() => {
    setErrorMessage('');
  }, [email, password, confirmPassword, fullName, isLogin, setErrorMessage]);

  const handleSubmit = async () => {
    if (!validateForm(isLogin, email, password, confirmPassword, fullName)) {
      return;
    }
    
    if (isLogin) {
      await handleLogin(email, password, isOnline);
    } else {
      await handleRegister(email, password, fullName, isOnline);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCenter}>
            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>
                {isLogin ? 'Bienvenue !' : 'Créer un compte'}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin 
                  ? 'Connectez-vous pour accéder à vos finances' 
                  : 'Inscrivez-vous pour commencer à gérer vos finances'}
              </Text>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
              {!isLogin && (
                <FormInput
                  label="Nom complet"
                  iconName="account"
                  placeholder="Votre nom complet"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              )}

              <FormInput
                label="Email"
                iconName="email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FormInput
                label="Mot de passe"
                iconName="lock"
                placeholder="Votre mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                showToggleVisibility={true}
                isVisible={passwordVisible}
                toggleVisibility={togglePasswordVisibility}
              />

              {!isLogin && (
                <FormInput
                  label="Confirmer le mot de passe"
                  iconName="lock-check"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!confirmPasswordVisible}
                  showToggleVisibility={true}
                  isVisible={confirmPasswordVisible}
                  toggleVisibility={toggleConfirmPasswordVisibility}
                />
              )}

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Se connecter' : 'S\'inscrire'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin 
                    ? 'Pas encore de compte? ' 
                    : 'Déjà un compte? '}
                  <Text style={styles.toggleTextHighlight}>
                    {isLogin ? 'S\'inscrire' : 'Se connecter'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  contentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    width: '100%',
    alignSelf: 'center',
    ...shadows.medium,
  },
  welcomeText: {
    fontSize: typography.sizeXLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  subtitle: {
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
    marginBottom: spacing.large,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizeRegular,
    marginLeft: spacing.small,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.medium,
    ...shadows.small,
  },
  submitButtonText: {
    color: 'white',
    fontSize: typography.sizeMedium,
    fontWeight: typography.weightBold,
  },
  toggleContainer: {
    marginTop: spacing.large,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  toggleTextHighlight: {
    color: colors.primary,
    fontWeight: typography.weightBold,
  }
});

export default LogIn;