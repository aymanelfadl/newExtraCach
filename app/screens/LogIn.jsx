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
import { authService } from '../../services/index';
import { useUser } from '../../context/UserContext';
// Import the Firebase recovery module for production environments
import { recoverFirebaseAuth, getFirebaseDiagnostics } from '../../services/firebaseRecovery';

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
      Alert.alert(
        'Connexion requise',
        'Une connexion Internet est nécessaire pour vous connecter. Veuillez vérifier votre connexion réseau et réessayer.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return;
    }      // Maximum retry attempts
    const maxRetries = 2;
    let currentRetry = 0;
    let result = null;

    try {
      setLoading(true);
      
      // In production, check for Firebase health and try to recover if needed
      if (!__DEV__ && currentRetry === 0) {
        console.log('Production environment detected, running Firebase diagnostics...');
        const diagnostics = getFirebaseDiagnostics();
        console.log('Firebase diagnostics:', diagnostics);
        
        // If we detect issues with Firebase in production, try to recover
        if (!diagnostics.hasAuth || !diagnostics.hasApp) {
          console.log('Firebase services missing in production, attempting recovery...');
          try {
            const recoveryResult = await recoverFirebaseAuth();
            if (recoveryResult.success) {
              console.log('Firebase auth successfully recovered in production');
            } else {
              console.error('Firebase recovery failed:', recoveryResult.error);
            }
          } catch (recoveryError) {
            console.error('Error during Firebase recovery:', recoveryError);
          }
        }
      }
      
      while (currentRetry <= maxRetries) {
        try {
          if (isLogin) {
            // Handle login using authService
            result = await authService.login(email, password);
            
            if (result.success) {
              // Successfully logged in
              break;
            } else if (
              result.error.includes('connexion') || 
              result.error.includes('réseau') || 
              result.error.includes('disponible') ||
              result.error.includes('authentification') ||
              result.error.includes('timed out')
            ) {
              // Network or service related issues, we might retry
              currentRetry++;
              if (currentRetry <= maxRetries) {
                // If in production and not the last retry, try recovery
                if (!__DEV__ && currentRetry < maxRetries) {
                  try {
                    console.log(`Retry ${currentRetry}: Attempting Firebase recovery...`);
                    await recoverFirebaseAuth();
                  } catch (e) {
                    console.error('Firebase recovery failed during retry:', e);
                  }
                }
                
                // Wait a moment before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            } else {
              // User error (wrong password, etc), no need to retry
              break;
            }
          } else {
            // Handle registration using authService
            result = await authService.register(email, password, fullName);
            
            if (result.success) {
              // Registration successful
              Alert.alert(
                'Compte créé avec succès',
                'Bienvenue! Votre compte a été créé avec succès.',
                [{ text: 'OK' }]
              );
              break;
            } else {
              // If registration failed, break immediately as it's likely a user error
              break;
            }
          }
        } catch (innerError) {
          console.error(`Authentication attempt ${currentRetry + 1} failed:`, innerError);
          currentRetry++;
          if (currentRetry > maxRetries) throw innerError;
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Set error message if authentication failed
      if (result && !result.success) {
        setErrorMessage(result.error);
        console.log('Authentication failed with error:', result.error);
      }
    } catch (error) {
      console.error('Authentication error after retries:', error);
      setErrorMessage('Une erreur s\'est produite. Veuillez réessayer plus tard.');
      
      // Show a more detailed alert for serious errors
      const errorString = error.toString();
      const isNetworkError = errorString.includes('network') || errorString.includes('internet') || errorString.includes('connection') || errorString.includes('timed out');
      const isAuthError = errorString.includes('auth') || errorString.includes('Firebase') || errorString.includes('authentication');
      const isTimeoutError = errorString.includes('timed out') || errorString.includes('timeout') || errorString.includes('expirée');
      
      // For production environment, provide more specific guidance
      let errorTitle = 'Erreur';
      let errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      
      if (isTimeoutError) {
        errorTitle = 'Délai d\'attente dépassé';
        errorMessage = 'La connexion a pris trop de temps. Veuillez vérifier votre connexion internet et réessayer.';
      } else if (isNetworkError) {
        errorTitle = 'Problème de connexion';
        errorMessage = 'Nous rencontrons des difficultés pour vous connecter. Veuillez vérifier votre connexion internet et réessayer.';
      } else if (isAuthError) {
        errorTitle = 'Erreur d\'authentification';
        errorMessage = 'Problème lors de l\'authentification. Veuillez essayer de vous connecter à nouveau.';
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [{ 
          text: 'OK',
          onPress: () => {
            if (isAuthError) {
              // For auth errors in production, we should attempt to recover
              try {
                // Try to clear any cached auth state that might be causing issues
                const { signOut } = require('firebase/auth');
                const { auth } = require('../../services/firebase');
                
                if (auth && typeof auth.signOut === 'function') {
                  console.log('Attempting to sign out to reset auth state');
                  signOut(auth).catch(e => console.error('Error signing out:', e));
                }
                
                console.log('Clearing login form');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              } catch (recoveryError) {
                console.error('Error during auth recovery:', recoveryError);
              }
            }
          }
        }]
      );
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
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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