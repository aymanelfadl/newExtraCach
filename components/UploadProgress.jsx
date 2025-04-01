import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';

const UploadProgress = ({ isUploading, uploadProgress }) => {
  const [dots, setDots] = useState('');
  
  const updateDots = () => {
    setDots(prevDots => {
      if (prevDots === '...') {
        return '';
      } else {
        return prevDots + '.';
      }
    });
  };

  useEffect(() => {
    let intervalId;

    if (isUploading) {
      intervalId = setInterval(updateDots, 500);
    } else {
      clearInterval(intervalId);
      setDots('');
    }

    return () => clearInterval(intervalId);
  }, [isUploading]);

  if (!isUploading) return null;

  return (
    <View style={styles.uploadingContainer}>
      <Text style={{ color: 'crimson', marginBottom: 10, fontSize: 15 }}>
        Uploading{dots}
      </Text>
      <Progress.Circle progress={uploadProgress} size={50} color='crimson' />
    </View>
  );
};

const styles = StyleSheet.create({
  uploadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 250, 0.9)',
  },
});

export default UploadProgress;