import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../../styles/theme';

const SplashScreen = () => {
  console.log("SplashScreen rendered");
  const [imageError, setImageError] = useState(false);
  
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
          {!imageError ? (
            <Image 
              source={require('../../assets/images/income.png')} 
              style={styles.logo}
              resizeMode="contain"
              onError={() => {
                console.log("Image failed to load");
                setImageError(true);
              }}
            />
          ) : null}
          <Text style={[styles.logoText, imageError && {opacity: 1}]}>EC</Text>
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.large,
    paddingHorizontal: spacing.large,
    borderWidth: 3,
    borderColor: 'transparent',
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
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.large,
    ...shadows.medium,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoText: {
    position: 'absolute',
    fontSize: 42,
    fontWeight: typography.weightBold,
    color: colors.primary,
    opacity: 0.3,
  },
  appName: {
    fontSize: typography.sizeXXLarge,
    fontWeight: typography.weightBold,
    color: colors.primary,
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
