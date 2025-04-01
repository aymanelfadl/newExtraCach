import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDczSU5xKWp8VDajyY26tFN2FwrbAPrHyE",
  authDomain: "expense-manager-376bc.firebaseapp.com",
  projectId: "expense-manager-376bc",
  storageBucket: "expense-manager-376bc.appspot.com",
  messagingSenderId: "281673701772",
  appId: "1:281673701772:android:ed908eb5788c6409c2dea9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Rest of your Firebase service code...

export const uploadImage = async (thumbnail) => {
  try {
    if (!thumbnail) {
      return 'https://firebasestorage.googleapis.com/v0/b/expenses-manager-65f07.appspot.com/o/depenser-de.png?alt=media&token=f6fb0357-5e9c-471e-b1fe-80e6163fa817';
    }
    
    // Get the file name from the URI
    const imageName = 'depense_' + Date.now();
    
    // Create a reference to Firebase Storage
    const storageRef = ref(storage, imageName);
    
    // Convert image URI to blob
    const response = await fetch(thumbnail.uri);
    const blob = await response.blob();
    
    // Upload blob to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadAudio = async (audioFile) => {
  try {
    if (!audioFile) {
      return null;
    }

    const audioName = 'audio_' + Date.now() + '.m4a';
    const storageRef = ref(storage, audioName);
    
    // Read the file as binary data
    const fileInfo = await FileSystem.getInfoAsync(audioFile);
    const response = await fetch(fileInfo.uri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

export const addExpense = async (userId, expense) => {
  try {
    if (!userId) {
      console.error('No userId provided');
      return;
    }
    
    const expensesRef = collection(db, `Users/${userId}/DepensesCollection`);
    await addDoc(expensesRef, {
      ...expense,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const fetchExpenseSuggestions = (userId, callback) => {
  if (!userId) {
    console.error('No userId provided for suggestions');
    callback([]);
    return () => {};
  }
  
  const expensesRef = collection(db, `Users/${userId}/DepensesCollection`);
  const q = query(expensesRef);
  
  return onSnapshot(q, (snapshot) => {
    const suggestions = snapshot.docs.map(doc => doc.data().description);
    callback(suggestions);
  });
};