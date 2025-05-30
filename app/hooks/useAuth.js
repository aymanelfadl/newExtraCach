import { useState } from 'react';
import { Alert } from 'react-native';
import { authService } from '../../services/index';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const validateForm = (isLogin, email, password, confirmPassword = '', fullName = '') => {
    setErrorMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Veuillez saisir une adresse email valide');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
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

  const handleLogin = async (email, password, isOnline) => {
    if (!isOnline) {
      setErrorMessage('Mode hors ligne. Connexion Internet requise pour l\'authentification.');
      Alert.alert(
        'Connexion requise',
        'Une connexion Internet est nécessaire pour vous connecter. Veuillez vérifier votre connexion réseau et réessayer.',
        [{ text: 'OK' }]
      );
      return { success: false };
    }
    
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      
      if (!result.success) {
        setErrorMessage(result.error || 'Erreur de connexion');
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Une erreur s\'est produite. Veuillez réessayer plus tard.');
      
      const errorTitle = getErrorTitle(error.toString());
      const errorMsg = getErrorMessage(error.toString());
      
      Alert.alert(
        errorTitle,
        errorMsg,
        [{ text: 'OK' }]
      );
      
      return { success: false, error: error.toString() };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email, password, fullName, isOnline) => {
    if (!isOnline) {
      setErrorMessage('Mode hors ligne. Connexion Internet requise pour l\'inscription.');
      Alert.alert(
        'Connexion requise',
        'Une connexion Internet est nécessaire pour créer un compte. Veuillez vérifier votre connexion réseau et réessayer.',
        [{ text: 'OK' }]
      );
      return { success: false };
    }
    
    setLoading(true);
    try {
      const result = await authService.register(email, password, fullName);
      
      if (result.success) {
        Alert.alert(
          'Compte créé avec succès',
          'Bienvenue! Votre compte a été créé avec succès.',
          [{ text: 'OK' }]
        );
      } else {
        setErrorMessage(result.error || 'Erreur d\'inscription');
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Une erreur s\'est produite. Veuillez réessayer plus tard.');
      
      Alert.alert(
        'Erreur d\'inscription',
        'Une erreur s\'est produite lors de la création de votre compte. Veuillez réessayer plus tard.',
        [{ text: 'OK' }]
      );
      
      return { success: false, error: error.toString() };
    } finally {
      setLoading(false);
    }
  };

  const getErrorTitle = (errorString) => {
    if (errorString.includes('timed out') || errorString.includes('timeout') || errorString.includes('expirée')) {
      return 'Délai d\'attente dépassé';
    } else if (errorString.includes('network') || errorString.includes('internet') || errorString.includes('connection')) {
      return 'Problème de connexion';
    } else if (errorString.includes('auth') || errorString.includes('Firebase') || errorString.includes('authentication')) {
      return 'Erreur d\'authentification';
    }
    return 'Erreur';
  };

  const getErrorMessage = (errorString) => {
    if (errorString.includes('timed out') || errorString.includes('timeout') || errorString.includes('expirée')) {
      return 'La connexion a pris trop de temps. Veuillez vérifier votre connexion internet et réessayer.';
    } else if (errorString.includes('network') || errorString.includes('internet') || errorString.includes('connection')) {
      return 'Nous rencontrons des difficultés pour vous connecter. Veuillez vérifier votre connexion internet et réessayer.';
    } else if (errorString.includes('auth') || errorString.includes('Firebase') || errorString.includes('authentication')) {
      return 'Problème lors de l\'authentification. Veuillez essayer de vous connecter à nouveau.';
    }
    return 'Une erreur inattendue est survenue. Veuillez réessayer.';
  };

  return {
    loading,
    errorMessage,
    setErrorMessage,
    handleLogin,
    handleRegister,
    validateForm
  };
};
