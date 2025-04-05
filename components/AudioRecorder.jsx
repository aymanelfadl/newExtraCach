import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';

const AudioRecorder = ({ 
  isRecording, 
  setIsRecording, 
  setUploadType, 
  audioFile, 
  setAudioFile,
  isAudioPlaying,
  setIsAudioPlaying,
  thumbnail 
}) => {
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState();

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync(); // Clean up sound object
        }
      : undefined;
  }, [sound]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        setUploadType('audio');
        console.log('Audio recording started');
      } else {
        console.log('Permission denied');
      }
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Audio recording stopped:', uri);
        setAudioFile(uri);
        setIsRecording(false);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );
        setSound(sound);
      }
    } catch (error) {
      console.error('Error stopping audio recording:', error);
    }
  };

  const playAudio = async () => {
    try {
      setIsAudioPlaying(true);
      await sound.playAsync();
      setIsAudioPlaying(false);
    } catch (error) {
      console.log('Error playing audio:', error);
    }
  };

  const stopPlayingAudio = async () => {
    try {
      setIsAudioPlaying(false);
      await sound.stopAsync();
    } catch (error) {
      console.log('Error stopping audio:', error);
    }
  };

  const renderAudioPlayer = () => {
    if (!audioFile) return null;

    return (
      <View style={styles.audioIconContainer}>
        {isAudioPlaying ? (
          <TouchableOpacity onPress={stopPlayingAudio}>
            <Icon name="stop" size={60} color="black" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={playAudio}>
            <Icon name="play" size={60} color="black" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRecordButton = () => {
    if (thumbnail || isAudioPlaying) return null;

    if (isRecording) {
      return (
        <View style={styles.iconWrapper}>
          <TouchableOpacity onPress={stopRecording}>
            <View style={styles.icon}>
              <Icon name="microphone-slash" size={30} color="red" />
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.iconWrapper}>
          <TouchableOpacity onPress={startRecording}>
            <View style={styles.icon}>
              <Icon name="microphone" size={30} color="black" />
            </View>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View>
      {renderAudioPlayer()}
      {renderRecordButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  audioIconContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  iconWrapper: {
    marginHorizontal: 10,
    borderRadius: 40,
    borderWidth: 0.1,
    borderColor: "crimson",
    padding: 10,
    width: "30%",
    alignSelf: 'center',
  },
  icon: {
    alignItems: 'center',
  },
});

export default AudioRecorder;
