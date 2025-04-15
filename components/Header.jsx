import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ screenName, onSearch }) => {
  const [openSearch, setOpenSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    if (onSearch && searchText.trim().length > 0) {
      onSearch(searchText);
    }
  };

  const toggleSearch = () => {
    setOpenSearch(!openSearch);
    if (openSearch) {
      setSearchText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{screenName}</Text>
        <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
          <Ionicons name={openSearch ? "close" : "search"} size={22} color="crimson" />
        </TouchableOpacity>
      </View>
      
      {openSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
            <Ionicons name="send" size={18} color="crimson" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 8,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingHorizontal: width * 0.05,
  },
  title: {
    fontSize: width > 400 ? 20 : 18,
    color: 'crimson',
    fontWeight: '100',
  },
  searchButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: width * 0.05,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'crimson',
    color: 'black',
  },
  searchIcon: {
    padding: 6,
    marginLeft: 6,
  }
});

export default Header;