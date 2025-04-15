import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const AddRevenue = ({ visible, onClose, onSave, initialData, isEditing = false }) => {
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
  }, [initialData, isEditing, visible]);

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

    const revenueData = {
      description: description.trim(),
      spends: parseFloat(amount.trim()),
      dateAdded: formattedDate
    };

    onSave(revenueData);
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Modifier le revenu' : 'Ajouter un revenu'}
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Description du revenu"
                placeholderTextColor={colors.textDisabled}
                value={description}
                onChangeText={setDescription}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant (MAD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textDisabled}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            
            {/* Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={showDatepicker}
              >
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Icon name="calendar" size={24} color={colors.income} />
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                accentColor={colors.income}
              />
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
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
    width: '85%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.extraLarge,
    alignItems: 'center',
    ...shadows.large,
    overflow: 'hidden',
  },
  modalHeader: {
    width: '100%',
    backgroundColor: colors.income,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.sizeLarge,
    fontWeight: typography.weightBold,
    color: colors.card,
  },
  formContainer: {
    width: '100%',
    padding: spacing.large,
  },
  inputGroup: {
    marginBottom: spacing.medium,
  },
  inputLabel: {
    fontSize: typography.sizeRegular,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
    marginBottom: spacing.tiny,
    paddingLeft: spacing.tiny,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontSize: typography.sizeRegular,
  },
  dateSelector: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: typography.sizeRegular,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: spacing.medium,
    backgroundColor: colors.background,
  },
  button: {
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    minWidth: 120,
    alignItems: 'center',
    ...shadows.small,
  },
  saveButton: {
    backgroundColor: colors.income,
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.income,
  },
  saveButtonText: {
    color: colors.card,
    fontWeight: typography.weightBold,
    fontSize: typography.sizeMedium,
  },
  cancelButtonText: {
    color: colors.income,
    fontWeight: typography.weightBold,
    fontSize: typography.sizeMedium,
  },
});

export default AddRevenue;