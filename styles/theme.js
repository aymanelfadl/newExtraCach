// theme.js - Central place for app styling

export const colors = {
  // Primary brand colors
  primary: '#3498db',        // Main blue color
  primaryLight: '#5dade2',   // Lighter blue
  primaryDark: '#2980b9',    // Darker blue
  
  // Secondary brand colors
  secondary: '#2ecc71',      // Emerald green
  secondaryLight: '#55d98d', // Lighter green
  secondaryDark: '#27ae60',  // Darker green
  
  // Accent color
  accent: '#9b59b6',         // Purple
  accentLight: '#b07cc6',    // Lighter purple
  accentDark: '#8e44ad',     // Darker purple
  
  // Financial indicators
  income: '#27ae60',         // Green for income/positive
  expense: '#e74c3c',        // Red for expense/negative
  neutral: '#f39c12',        // Orange for neutral
  warning: '#f39c12',        // Warning color (orange)
  error: '#e74c3c',          // Error color (red)
  
  // UI colors
  background: '#f5f7fa',     // Light background
  card: '#ffffff',           // White for cards
  textPrimary: '#2c3e50',    // Dark blue/gray for main text
  textSecondary: '#7f8c8d',  // Medium gray for secondary text
  textDisabled: '#bdc3c7',   // Light gray for disabled text
  divider: '#ecf0f1',        // Very light gray for dividers
  
  success: '#2ecc71',        // Green for success
  warning: '#f1c40f',        // Yellow for warnings
  error: '#e74c3c',          // Red for errors
  info: '#3498db',           // Blue for information
  
  white: '#ffffff',         // White tab bar
  tabBarActive: '#3498db',   // Blue for active tab
  tabBarInactive: '#bdc3c7', // Gray for inactive tab
};

export const typography = {
  sizeXSmall: 10,
  sizeSmall: 12,
  sizeRegular: 14,
  sizeMedium: 16,
  sizeLarge: 18,
  sizeXLarge: 22,
  sizeXXLarge: 28,
  
  weightRegular: '400',
  weightMedium: '500',
  weightSemiBold: '600',
  weightBold: '700',
};

export const spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
  huge: 48
};

export const borderRadius = {
  small: 4,
  medium: 8,
  large: 16,
  extraLarge: 24,
  round: 50,
};

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.27,
    elevation: 5,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8.65,
    elevation: 8,
  },
};

// Common component styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    padding: spacing.medium,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    ...shadows.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
};