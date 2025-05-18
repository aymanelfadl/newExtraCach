import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../../styles/theme';

const SplashScreen = () => {
  console.log("SplashScreen rendered");
  
  // Animation values
  const scaleAnim = new Animated.Value(0.5);
  const opacityAnim = new Animated.Value(0);
  const textOpacityAnim = new Animated.Value(0);
  const slideUpAnim = new Animated.Value(30);

  useEffect(() => {
    console.log("Starting SplashScreen animations");
    
    // Animation sequence
    Animated.sequence([
      // Fade in logo
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Scale logo
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.7)),
      }),
      
      // Fade in and slide up text
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        })
      ])
    ]).start();
  }, []);

  const logoAnimatedStyle = {
    opacity: opacityAnim,
    transform: [{ scale: scaleAnim }],
  };

  const textAnimatedStyle = {
    opacity: textOpacityAnim,
    transform: [{ translateY: slideUpAnim }]
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image 
            source={require('../../assets/images/logologo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>EC</Text>
        </Animated.View>
        
        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.appName}>ExtraCash</Text>
          <Text style={styles.tagline}>Gérez vos finances en toute simplicité</Text>
        </Animated.View>
      </View>
      
      <Animated.View style={textAnimatedStyle}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.View>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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

export default SplashScreen;
