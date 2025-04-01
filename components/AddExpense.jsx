import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MediaSelector from './MediaSelector';
import AudioRecorder from './AudioRecorder';
import ExpenseForm from './ExpenseForm';
import UploadProgress from './UploadProgress';

import { uploadImage, uploadAudio, addExpense, fetchExpenseSuggestions } from '../services/FirebaseService';

const AddExpense = ({ visible, onClose }) => {
  // Utility functions
  const formatDate = (date) => {
    const currentDate = date || new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear().toString();
    return `${year}-${month}-${day}`;
  };

  // State management
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

  // Load user ID from AsyncStorage
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

  // Load suggestions from Firestore
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

  // Handle form submission
  const handleAddExpense = async () => {
    setIsUploading(true);
    const defaultName = "Depense " + formatDate(new Date());
    let finalDescription = description.trim() === '' ? defaultName : description;

    try {
      setUploadProgress(0);

      // Handle media upload
      let mediaUrl;
      if (uploadType === 'image' || uploadType === null) {
        mediaUrl = await uploadImage(thumbnail);
      } else if (uploadType === 'audio') {
        mediaUrl = await uploadAudio(audioFile);
      }
      
      setUploadProgress(0.50);

      // Add expense to Firestore
      await addExpense(userId, {
        description: finalDescription,
        thumbnail: mediaUrl,
        thumbnailType: uploadType === null ? "image" : uploadType,
        spends: spends === '' ? 0 : spends,
        dateAdded: selectedDate
      });

      setUploadProgress(1);
      
      // Reset form state
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form state
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

  // Render modal content
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
          showDate={showDate}
          setShowDate={setShowDate}
          suggestions={suggestions}
          onSubmit={handleAddExpense}
          onClose={onClose}
          formatDate={formatDate}
        />
        
        <View style={styles.mediaContainer}>
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
});

export default AddExpense;

