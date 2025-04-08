import { useState }  from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

const ExpenseForm = ({ 
  description, 
  setDescription, 
  spends, 
  suggestions,
  setSpends, 
  setSelectedDate,
  onSubmit,
  onClose,
}) => {


  const formatDate = (date) =>{
    const currentDate = date;
        const day = currentDate.getDate().toString().padStart(2, '0');
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear().toString();
        return `${year}-${month}-${day}`
  }

  const [showDate, setShowDate] = useState(false);

  const filteredSuggestions = [...new Set(suggestions.filter(item =>
    new RegExp('^' + description.toLowerCase(), 'g').test(item.toLowerCase())
  ))];
  
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity onPress={() => setDescription(item)}>
      <Text style={styles.suggestionItem}>{item}</Text>
    </TouchableOpacity>
  );

  const onChangeDate = (event, date) => {
    if (date) {
      const formatted = formatDate(date);
      setSelectedDate(formatted);
    }
    setShowDate(false);
  };
  

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Nouvelle Dépense</Text>
         <View style={styles.mediaContainer}>
              <TouchableOpacity onPress={() => setShowDate(true)}>
                    <Icon
                      name="calendar-plus-o"
                      color="#333333"
                      style={{ paddingHorizontal: 10 }}
                      size={30}
                    />
                  </TouchableOpacity>
                  {showDate && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={new Date()}
                      onChange={onChangeDate}
                    />
                  )}
        </View>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Entrer description"
        placeholderTextColor="black"
        multiline={true}
        numberOfLines={2}
        value={description}
        onChangeText={setDescription}
      />
      
      {filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredSuggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => index.toString()}
            style={{height:"20%", marginBottom:10}}
          />
        </View>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Entrer montant dépense"
        placeholderTextColor="black"
        keyboardType="numeric"
        value={spends}
        onChangeText={(text) => {
          if (/^-?\d*\.?\d*$/.test(text)) {
            setSpends(text);
          }
        }}
      />
      
      <TouchableOpacity style={styles.btn} onPress={onSubmit}>
        <Text style={styles.btnText}>Ajouter Depense</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.btn, styles.closeButton]} onPress={onClose}>
        <Text style={styles.closeButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 25,
    fontWeight: '600',
    color: "rgb(38 38 38)"
  },
  input: {
    borderWidth: 1,
    borderColor: 'crimson',
    backgroundColor: "#FFF",
    height: 60,
    borderRadius: 15,
    color: "black",
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 10,
  },
  suggestionItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 2,
    borderColor: '#dcdcdc',
    fontSize: 15,
    color: 'black',
  },
  btn: {
    backgroundColor: "rgb(14 165 233)",
    padding: 13,
    marginTop: 15,
    borderRadius: 100,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "crimson",
    padding: 8,
    borderRadius: 100,
  },
  closeButtonText: {
    color: "#fff",
    textAlign: "center",
  },
});

export default ExpenseForm;