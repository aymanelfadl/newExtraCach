import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AddExpense = ({ visible, onClose, onSave, initialData, isEditing = false }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize form with data when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setDescription(initialData.description || '');
      setAmount(initialData.spends?.toString() || '');
      
      // Parse date if it exists
      if (initialData.dateAdded) {
        try {
          // Try to parse the date string, assuming it's in DD/MM/YYYY format
          const parts = initialData.dateAdded.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS Date
            const year = parseInt(parts[2], 10);
            const parsedDate = new Date(year, month, day);
            
            if (!isNaN(parsedDate.getTime())) {
              setDate(parsedDate);
            }
          }
        } catch (e) {
          console.error('Error parsing date', e);
          setDate(new Date()); // Fallback to current date
        }
      }
    } else {
      // Reset form when adding new
      setDescription('');
      setAmount('');
      setDate(new Date());
    }
  }, [initialData, isEditing]);

  const handleSave = () => {
    if (!description.trim() || !amount.trim()) {
      // Validation: Both fields are required
      return;
    }

    // Format date as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const expenseData = {
      description: description.trim(),
      spends: parseFloat(amount.trim()),
      dateAdded: formattedDate
    };

    onSave(expenseData);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date());
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Format date for display
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            {isEditing ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Montant (MAD)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          
          {/* Date Selection */}
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={showDatepicker}
          >
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Icon name="calendar" size={24} color="#666" />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>
                {isEditing ? 'Modifier' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: '#000',
  },
  dateSelector: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#000',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AddExpense;