import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Header = ({ title, onSearching, MyIcon , mySecondIcon, onIconPress, onSecondIconPress, dateSelcted, endDate}) => {

  const [openSearch, setOpenSearch] = useState(false);
  
  return (
    <View style={styles.container}>
      {MyIcon ? (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
            {dateSelcted && (
              <View style={styles.dateContainer}>
                <Text style={{color:"white",fontSize:12,fontWeight:"bold"}}>
                    {dateSelcted} à {endDate}
                </Text>      
              </View>
            )}
          <View style={{flexDirection:"row"}}>
            {mySecondIcon &&
            <TouchableOpacity style={{marginRight:15}}onPress={onSecondIconPress}>
              <Icon name={mySecondIcon} size={30} color="crimson" />
            </TouchableOpacity>
            }
            <TouchableOpacity style={{marginRight:10}} onPress={onIconPress}>
              <Icon name={MyIcon} size={30} color="crimson" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={() => setOpenSearch(!openSearch)} style={{ paddingLeft: 6 }}>
            <Icon name="card-search-outline" size={40} color="crimson"  />
          </TouchableOpacity>
        </View>
      )}
      {openSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="gray"
            onChangeText={(text) => {
              onSearching(text);
            }}
          />
        </View>
      )}
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

export default Header;