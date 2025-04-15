import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const AddExpense = ({ visible, onClose, onSave, initialData, isEditing = false }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Initialize form with data when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setDescription(initialData.description || '');
      setAmount(initialData.spends?.toString() || '');
    } else {
      // Reset form when adding new
      setDescription('');
      setAmount('');
    }
  }, [initialData, isEditing]);

  const handleSave = () => {
    if (!description.trim() || !amount.trim()) {
      // Validation: Both fields are required
      return;
    }

    const expenseData = {
      description: description.trim(),
      spends: parseFloat(amount.trim()),
    };

    onSave(expenseData);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
  };

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