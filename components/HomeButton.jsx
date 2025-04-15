import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { typography, spacing, borderRadius, shadows, colors } from '../styles/theme';

export const HomeButton = ({ btnData, compact = false }) => {
  const { title, description, onPress, backgroundColor, icon } = btnData;

  // Modern circular style if compact prop is true
  if (compact) {
    return (
      <View style={styles.circleButtonWrapper}>
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor }]}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <Icon name={icon} size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.circleButtonLabel}>{title}</Text>
      </View>
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
  
  // Modern circle button styles
  circleButtonWrapper: {
    alignItems: 'center',
    width: 88,
  },
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
    marginBottom: spacing.small,
  },
  circleButtonLabel: {
    fontSize: typography.sizeSmall,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});