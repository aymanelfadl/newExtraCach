import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import { PermissionsAndroid } from 'react-native';

const AudioRecorder = ({ 
  isRecording, 
  setIsRecording, 
  setUploadType, 
  audioFile, 
  setAudioFile,
  isAudioPlaying,
  setIsAudioPlaying,
  sound,
  setSound,
  thumbnail
}) => {

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);

      if (
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Audio recording permissions granted');
        return true;
      } else {
        console.log('Audio recording permissions denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const startRecording = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;
    
    try {
      AudioRecord.init({
        sampleRate: 44100,
        channels: 2,
        bitsPerSample: 16,
        audioSource: 6,
      });

      AudioRecord.start();
      setIsRecording(true);
      setUploadType('audio');
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const audioFile = await AudioRecord.stop();
      console.log('Audio recording stopped:', audioFile);
      setAudioFile(audioFile);
      setIsRecording(false);

      const sound = new Sound(audioFile, '', (error) => {
        if (error) {
          console.log('Error loading sound:', error);
        }
      });
      setSound(sound);
    } catch (error) {
      console.error('Error stopping audio recording:', error);
    }
  };

  const playAudio = () => {
    setIsAudioPlaying(true);
    sound.play((success) => {
      if (success) {
        setIsAudioPlaying(false);
      } else {
        console.log('Playback failed due to audio decoding errors');
      }
    });
  };

  const stopPlayingAudio = () => {
    setIsAudioPlaying(false);
    sound.stop();
  };

  // Only show audio player if audio file exists
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

  // Only show recorder if no thumbnail and not currently recording/playing
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
    alignSelf: 'center'
  },
  icon: {
    alignItems: 'center',
  },
});

export default AudioRecorder;