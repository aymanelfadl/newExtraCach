import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

export const Header = () => {

  const [openSearch, setOpenSearch] = useState(false);
  
  return (
    <View style={styles.container}>
        <Text style={styles.title}>Gestion des dépenses</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    marginBottom: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginLeft: 15,
  },
  dateContainer:{
    flexDirection:"row",
    justifyContent:"center",
    borderRadius:100,
    width:"50%",
    backgroundColor:"crimson" 
  },
  title: {
    fontSize: 20,
    color: 'crimson',
    fontWeight: '100',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding:10,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'crimson',
    color: 'black',
  },
});
