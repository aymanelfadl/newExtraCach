import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';

const MediaSelector = ({ thumbnail, setThumbnail, setUploadType, isRecording, audioFile }) => {
  
  const handleLaunchCamera = () => {
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && !response.error) {
        setThumbnail({ uri: response.assets[0].uri });
        setUploadType('image');
      }
    });
  };

  const handleLaunchImageLibrary = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && !response.error) {
        setThumbnail({ uri: response.assets[0].uri });
        setUploadType('image');
      }
    });
  };

  // Only show thumbnail if it exists
  const renderThumbnail = () => {
    if (thumbnail) {
      return <Image source={thumbnail} style={styles.thumbnail} />;
    }
    return null;
  };

  // Don't show media options if recording or audio exists
  const shouldShowMediaOptions = !isRecording && !audioFile;

  return (
    <View>
      {renderThumbnail()}
      {shouldShowMediaOptions && (
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <TouchableOpacity onPress={handleLaunchCamera}>
              <View style={styles.icon}>
                <Icon name="camera" size={30} color="black" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.iconWrapper}>
            <TouchableOpacity onPress={handleLaunchImageLibrary}>
              <View style={styles.icon}>
                <Icon name="folder-open" color="black" size={30} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 25,
  },
  iconWrapper: {
    marginHorizontal: 10,
    borderRadius: 40,
    borderWidth: 0.1,
    borderColor: "crimson",
    padding: 10,
    width: "30%"
  },
  icon: {
    alignItems: 'center',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
});

export default MediaSelector;