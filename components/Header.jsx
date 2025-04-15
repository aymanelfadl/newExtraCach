import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const Header = ({ screenName, onSearching }) => {
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (onSearching) {
      onSearching(query);
    }
  };

  const toggleSearch = () => {
    if (searching && searchQuery) {
      setSearchQuery('');
      if (onSearching) {
        onSearching('');
      }
    }
    setSearching(!searching);
  };

  return (
    <View style={styles.header}>
      {searching ? (
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          <TouchableOpacity onPress={toggleSearch}>
            <Icon name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{screenName}</Text>
          {onSearching && (
            <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
              <Icon name="magnify" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    paddingTop: spacing.extraLarge,
    paddingBottom: spacing.medium,
    paddingHorizontal: spacing.medium,
    ...shadows.small,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizeXLarge,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  searchButton: {
    padding: spacing.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    height: 50,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.small,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizeRegular,
    color: colors.textPrimary,
  },
});

export default Header;