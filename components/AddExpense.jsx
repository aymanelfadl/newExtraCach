import React, { useState, useEffect } from "react";
import { View, Modal, StyleSheet} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


import ExpenseForm from "./ExpenseForm";
import UploadProgress from "./UploadProgress";

import {
  uploadImage,
  uploadAudio,
  addExpense,
  fetchExpenseSuggestions,
} from "../services/FirebaseService";

const AddExpense = ({ visible, onClose }) => {

  const formatDate = (date) =>{
    const currentDate = date;
        const day = currentDate.getDate().toString().padStart(2, '0');
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear().toString();
        return `${year}-${month}-${day}`
  }
  const [description, setDescription] = useState("");
  const [spends, setSpends] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [uploadType, setUploadType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId !== null) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Error retrieving user ID from local storage:", error);
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
    let finalDescription = description.trim() === "" ? defaultName : description;

    try {
      setUploadProgress(0);
      if (spends === "") {
        alert("Please enter a valid amount");
      }
      else
      {
        let mediaUrl;
        if (uploadType === "image" || uploadType === null) {
          mediaUrl = await uploadImage(thumbnail);
        }
        setUploadProgress(0.5);
        await addExpense(userId, {
          description: finalDescription,
          thumbnail: mediaUrl,
          thumbnailType: uploadType === null ? "image" : uploadType,
          spends: spends,
          dateAdded: selectedDate,
        });
      }
      setUploadProgress(1);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setSpends("");
    setThumbnail(null);
    setUploadType(null);
    setSelectedDate(formatDate(new Date()));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderModalContent = () => {
    return (
      <View style={styles.modalContent}>
      <ExpenseForm
        description={description}
        setDescription={setDescription}
        spends={spends}
        setSpends={setSpends}
        suggestions={suggestions}
        onSubmit={handleAddExpense}
        onClose={handleClose}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

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
        <View style={styles.modalContainer}>{renderModalContent()}</View>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    width: "80%",
    shadowColor: "crimson",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    elevation: 3,
  },
  mediaContainer: {
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    padding: 20,
    borderRadius: 10,
    borderWidth: 0.3,
    borderColor: "crimson",
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

export default AddExpense;
