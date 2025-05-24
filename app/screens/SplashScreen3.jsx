import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import Constants from 'expo-constants';

// Renamed to CustomSplashScreen to avoid naming conflicts with expo-splash-screen
const CustomSplashScreen = ({ showLoader = true }) => {
  // Get version from app.json
  const appVersion = Constants.expoConfig?.version || '1.0.2';
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/exchanging.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.appName}>ExtraCash</Text>
          <Text style={styles.tagline}>Gérez vos finances en toute simplicité</Text>
          
          {showLoader && (
            <ActivityIndicator 
              size="large" 
              color="#4A90E2" 
              style={{ marginTop: spacing.large }}
            />
          )}
        </View>
      </View>

      <Text style={styles.versionText}>Version {appVersion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.large,
    paddingHorizontal: spacing.large,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.divider,
    elevation: 8,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoText: {
    position: 'absolute',
    fontSize: 60,
    fontWeight: 'bold',
    color: colors.textPrimary,
    opacity: 0.9,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.sizeXXLarge,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.small,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: typography.sizeMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  versionText: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
});

export default CustomSplashScreen;
