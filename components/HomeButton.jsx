import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { typography, spacing, borderRadius, shadows } from '../styles/theme';

export const HomeButton = ({ btnData, compact = false }) => {
  const { title, description, onPress, backgroundColor, icon } = btnData;

  // Use compact style if compact prop is true
  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, { backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.compactIconContainer}>
          <Icon name={icon} size={24} color="white" />
        </View>
        <View style={styles.compactTextContainer}>
          <Text style={styles.compactTitle}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Original full-size button
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        <View style={styles.iconContainer}>
          <Icon name={icon} size={28} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Original button styles
  button: {
    borderRadius: borderRadius.large,
    marginVertical: spacing.medium,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    ...shadows.medium,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.medium,
  },
  title: {
    color: 'white',
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    marginBottom: spacing.tiny,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizeRegular,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.round,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Compact button styles
  compactButton: {
    borderRadius: borderRadius.large,
    marginBottom: spacing.medium,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.medium,
    ...shadows.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIconContainer: {
    marginRight: spacing.small,
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    color: 'white',
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightBold,
  },
});