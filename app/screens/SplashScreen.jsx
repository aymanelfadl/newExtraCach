import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, shadows } from '../../styles/theme';

const SplashScreen = () => {
  const scaleAnim = new Animated.Value(0.8);
  const opacityAnim = new Animated.Value(0);
  const textOpacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // Fade in logo
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Scale logo
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back()),
      }),
      
      // Fade in text
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      })
    ]).start();
  }, []);

  const logoAnimatedStyle = {
    opacity: opacityAnim,
    transform: [{ scale: scaleAnim }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Icon name="wallet-outline" size={60} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={{ opacity: textOpacityAnim }}>
          <Text style={styles.appName}>Finance App</Text>
          <Text style={styles.tagline}>Gérez vos finances en toute simplicité</Text>
        </Animated.View>
      </View>
      
      <Animated.View style={{ opacity: textOpacityAnim }}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.large,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
    ...shadows.medium,
  },
  appName: {
    fontSize: typography.sizeXXLarge,
    fontWeight: typography.weightBold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  tagline: {
    fontSize: typography.sizeMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  versionText: {
    fontSize: typography.sizeSmall,
    color: colors.textSecondary,
  },
});

export default SplashScreen;