import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

import MediaSelector from './MediaSelector';
import AudioRecorder from './AudioRecorder';
import ExpenseForm from './ExpenseForm';
import UploadProgress from './UploadProgress';

import { uploadImage, uploadAudio, addExpense, fetchExpenseSuggestions } from '../services/FirebaseService';


const AddExpense = ({ visible, onClose }) => {

  const formatDate = (date) => {
    const currentDate = date || new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear().toString();
    return `${year}-${month}-${day}`;
  };

  const [description, setDescription] = useState('');
  const [spends, setSpends] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [thumbnail, setThumbnail] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showDate, setShowDate] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);


  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId !== null) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error retrieving user ID from local storage:', error);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    let unsubscribe;
    
    if (userId) {
      unsubscribe = fetchExpenseSuggestions(userId, (fetchedSuggestions) => {
        setSuggestions(fetchedSuggestions);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const handleAddExpense = async () => {
    setIsUploading(true);
    const defaultName = "Depense " + formatDate(new Date());
    let finalDescription = description.trim() === '' ? defaultName : description;

    try {
      setUploadProgress(0);

      let mediaUrl;
      if (uploadType === 'image' || uploadType === null) {
        mediaUrl = await uploadImage(thumbnail);
      } else if (uploadType === 'audio') {
        mediaUrl = await uploadAudio(audioFile);
      }
      
      setUploadProgress(0.50);

      await addExpense(userId, {
        description: finalDescription,
        thumbnail: mediaUrl,
        thumbnailType: uploadType === null ? "image" : uploadType,
        spends: spends === '' ? 0 : spends,
        dateAdded: selectedDate
      });

      setUploadProgress(1);
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setSpends('');
    setThumbnail(null);
    setUploadType(null);
    setAudioFile(null);
    setIsAudioPlaying(false);
    setSound(null);
    setSelectedDate(formatDate(new Date()));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
    
  const onChangeDate = (event, selectedDate) => {
    setSelectedDate(formatDate(selectedDate));
    setShowDate(false);
  };


  const toggleMediaModal = () => {
    setMediaModalVisible(!mediaModalVisible);
  };

  const handleSelectMediaOption = (option) => {
    setUploadType(option);
    setMediaModalVisible(false); // Close the modal after selection
  };


  const renderMediaOptionsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={mediaModalVisible}
      onRequestClose={toggleMediaModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <AudioRecorder
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              setUploadType={setUploadType}
              audioFile={audioFile}
              setAudioFile={setAudioFile}
              isAudioPlaying={isAudioPlaying}
              setIsAudioPlaying={setIsAudioPlaying}
              sound={sound}
              setSound={setSound}
              thumbnail={thumbnail}
            />
            <MediaSelector
              thumbnail={thumbnail}
              setThumbnail={setThumbnail}
              setUploadType={setUploadType}
              isRecording={isRecording}
              audioFile={audioFile}
            />
        </View>
      </View>
    </Modal>
  );
  
  const renderModalContent = () => {
    return (
      <View style={styles.modalContent}>
        <ExpenseForm
          description={description}
          setDescription={setDescription}
          spends={spends}
          setSpends={setSpends}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setShowDate={setShowDate}
          suggestions={suggestions}
          onSubmit={handleAddExpense}
          onClose={handleClose}
          formatDate={formatDate}
        />
        
        <View style={styles.mediaContainer}>
          <TouchableOpacity onPress={() => setShowDate(true)}>
            <Icon name="calendar-plus-o" color="#333333" style={{paddingHorizontal: 10}} size={30} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleMediaModal}>
            <Icon name="plus-circle" color="#333333" style={{paddingHorizontal: 10}} size={30} />
          </TouchableOpacity>
  
          {showDate && (
              <DateTimePicker 
                testID='dateTimePicker' 
                value={new Date()} 
                onChange={onChangeDate} 
              />
          )}
  
          {renderMediaOptionsModal()}
        </View>
      </View>
    );
  };
  

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible && !isUploading}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>

      <UploadProgress 
        isUploading={isUploading} 
        uploadProgress={uploadProgress} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    width: '80%',
    shadowColor: 'crimson',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    elevation: 3,
  },
  mediaContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',  
    alignItems: 'center',
    marginVertical: 10,
    width: '75%',
    padding: 20,
    borderRadius: 10,
    borderWidth: 0.3,
    borderColor: "crimson",
  },
  
});

export default AddExpense;

