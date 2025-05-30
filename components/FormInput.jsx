import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

/**
 * Reusable input field component with icon and optional visibility toggle
 */
const FormInput = ({
  label,
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  showToggleVisibility,
  isVisible,
  toggleVisibility
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon name={iconName} size={20} color={colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
        />
        {showToggleVisibility && (
          <TouchableOpacity onPress={toggleVisibility} style={styles.visibilityIcon}>
            <Icon 
              name={isVisible ? "eye-off" : "eye"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default FormInput;
