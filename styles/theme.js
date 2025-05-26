// theme.js - Central place for app styling

export const colors = {
  // Primary brand colors - Deeper Blue Gradient
  primary: '#0369A1',        // Ocean Blue - Sophisticated, trustworthy primary color
  primaryLight: '#38BDF8',   // Sky Blue - Lighter version for backgrounds and highlights
  primaryDark: '#0C4A6E',    // Deep Ocean Blue - Darker version for buttons and emphasis
  
  // Secondary brand colors - Elegant Cool Gray
  secondary: '#F2F5FA',      // Ultra Light Gray - Subtle secondary color
  secondaryLight: '#FFFFFF', // White - Brightest version
  secondaryDark: '#E5E9F0',  // Light Gray - Slightly darker for subtle differentiation
  
  // Accent color - Money Green (Keeping this as you liked it)
  accent: '#37B876',         // Money Green - Fresh accent color for financial actions
  accentLight: '#83E2AD',    // Light Green - Lighter accent for highlights
  accentDark: '#259A5D',     // Dark Green - Deeper accent for emphasis
  
  // Financial indicators - Clear Semantic Colors
  income: '#37B876',         // Money Green - Green for income/positive (kept as is)
  expense: '#F43F5E',        // Rose Red - Modern, vibrant red for expenses
  neutral: '#7D8597',        // Slate Gray - Neutral transactions or informational
  warning: '#FFBB38',        // Amber - Warm yellow for warnings (not too alarming)
  error: '#E11D48',          // Crimson - Bold but refined error indicator
  
  // UI colors
  background: '#F8FAFC',     // Snow White - Clean, subtle light background
  backgroundAlt: '#EDF2F7',  // Light Gray - Subtle alternative background
  card: '#FFFFFF',           // Pure White - For cards and elevated elements
  textPrimary: '#1A202C',    // Almost Black - Main text, very dark blue-gray
  textSecondary: '#4A5568',  // Charcoal - Secondary text, dark gray
  textDisabled: '#A0AEC0',   // Gray Blue - Disabled text
  divider: '#E2E8F0',        // Pale Gray - Subtle divider
  
  success: '#37B876',        // Money Green - Success indicators
  warning: '#FFBB38',        // Amber - Warning indicators
  error: '#E11D48',          // Crimson - Bold but refined error indicator
  info: '#0369A1',           // Ocean Blue - Information indicators
  
  white: '#FFFFFF',          // Pure White
  tabBarActive: '#0369A1',   // Ocean Blue - Active tab
  tabBarInactive: '#A0AEC0', // Gray Blue - Inactive tab
  
  // Additional palette colors for flexible usage
  darkBlue: '#0C4A6E',       // Deep Ocean Blue - Dark blue for emphasis
  oceanBlue: '#0369A1',      // Ocean Blue - Primary blue
  skyBlue: '#38BDF8',        // Sky Blue - Light blue for backgrounds
  moneyGreen: '#37B876',     // Money Green - Success/income green (kept as is)
  lightGreen: '#83E2AD',     // Light Green - Softer green
  roseRed: '#F43F5E',        // Rose Red - Modern, vibrant red for expenses
  crimson: '#E11D48',        // Crimson - Deeper red for emphasis
  amber: '#FFBB38',          // Amber - Warning yellow (kept as is)
  lightAmber: '#FFD580',     // Light Amber - Soft yellow
  charcoal: '#4A5568',       // Charcoal - Dark gray text
  platinum: '#E2E8F0'        // Platinum - Light gray backgrounds
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