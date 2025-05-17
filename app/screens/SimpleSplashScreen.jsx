import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles/theme';

const SimpleSplashScreen = () => {
  useEffect(() => {
    console.log("SimpleSplashScreen rendered and mounted");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.logo}>EC</Text>
      </View>
      <Text style={styles.title}>ExtraCash</Text>
      <Text style={styles.subtitle}>Gérez vos finances en toute simplicité</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,
    elevation: 13,
  },
  logo: {
    fontSize: 80,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 24,
  },
});

export default SimpleSplashScreen;
