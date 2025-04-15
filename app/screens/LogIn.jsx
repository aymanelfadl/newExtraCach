import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { auth } from '../../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');

const LogIn = () => {
  const { isOnline } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Clear error message when form fields change
    setErrorMessage('');
  }, [email, password, confirmPassword, fullName, isLogin]);

  const validateForm = () => {
    // Reset error message
    setErrorMessage('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Veuillez saisir une adresse email valide');
      return false;
    }

    // Password validation
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    // Registration form validation
    if (!isLogin) {
      if (password !== confirmPassword) {
        setErrorMessage('Les mots de passe ne correspondent pas');
        return false;
      }

      if (fullName.trim().length < 3) {
        setErrorMessage('Veuillez saisir votre nom complet');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Check for internet connection
    if (!isOnline) {
      setErrorMessage('Mode hors ligne. Connexion Internet requise pour l\'authentification.');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (isLogin) {
        // Handle login
        await signInWithEmailAndPassword(auth, email, password);
        // Auth state change listener in UserContext will handle the rest
      } else {
        // Handle registration
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update the user profile with full name
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        
        // Now automatically sign in the user
        Alert.alert(
          'Compte créé avec succès',
          'Bienvenue! Votre compte a été créé avec succès.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle specific Firebase auth errors with user-friendly messages
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setErrorMessage('Email ou mot de passe incorrect');
          break;
        case 'auth/email-already-in-use':
          setErrorMessage('Cette adresse email est déjà utilisée');
          break;
        case 'auth/network-request-failed':
          setErrorMessage('Problème de connexion réseau. Vérifiez votre connexion Internet.');
          break;
        default:
          setErrorMessage('Une erreur s\'est produite. Veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
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

  const getCurrentTime = () => {
    // Using the provided current time
    return '15:17:18';
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
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Icon name="wallet-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.appName}>Finance App</Text>
            <Text style={styles.currentTime}>{getCurrentTime()}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>
              {isLogin ? 'Bienvenue !' : 'Créer un compte'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Connectez-vous pour accéder à vos finances' 
                : 'Inscrivez-vous pour commencer à gérer vos finances'}
            </Text>

            {/* Error message display */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Registration fields */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom complet</Text>
                <View style={styles.inputContainer}>
                  <Icon name="account" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom complet"
                    placeholderTextColor={colors.textDisabled}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Icon name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textDisabled}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={colors.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.visibilityIcon}>
                  <Icon 
                    name={passwordVisible ? "eye-off" : "eye"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password field (for registration) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock-check" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmez votre mot de passe"
                    placeholderTextColor={colors.textDisabled}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!confirmPasswordVisible}
                  />
                  <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.visibilityIcon}>
                    <Icon 
                      name={confirmPasswordVisible ? "eye-off" : "eye"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
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

            {/* Toggle between login and register */}
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

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              © 2025 Finance App • v1.0.0
            </Text>
            <Text style={styles.footerText}>
              2025-04-15
            </Text>
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
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.large,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing.extraLarge,
    marginBottom: spacing.large,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.medium,
    ...shadows.medium,
  },
  appName: {
    fontSize: typography.sizeXLarge,
    fontWeight: typography.weightBold,
    color: colors.primary,
    marginBottom: spacing.tiny,
  },
  currentTime: {
    fontSize: typography.sizeRegular,
    color: colors.textSecondary,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    width: '100%',
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
  inputGroup: {
    marginBottom: spacing.medium,
  },
  inputLabel: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  inputIcon: {
    paddingHorizontal: spacing.medium,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.textPrimary,
    fontSize: typography.sizeRegular,
  },
  visibilityIcon: {
    padding: spacing.medium,
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
  },
  footerContainer: {
    marginTop: spacing.extraLarge,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
  },
});

export default LogIn;