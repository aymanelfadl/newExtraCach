import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export const signInAsGuest = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in as guest:', error);
    throw error;
  }
};

export const uploadImage = async (thumbnail) => {
  try {
    if (!thumbnail) {
      return process.env.DEFAULT_IMAGE_URL || 'https://firebasestorage.googleapis.com/v0/b/expenses-manager-65f07.appspot.com/o/depenser-de.png?alt=media&token=f6fb0357-5e9c-471e-b1fe-80e6163fa817';
    }
    
    const imageName = 'depense_' + Date.now();
    const storageRef = ref(storage, imageName);
    
    const response = await fetch(thumbnail.uri);
    const blob = await response.blob();
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const addExpense = async (userId, expense) => {
  try {
    // if (!userId) {
    //   console.error('No userId provided');
    //   return;
    // }
    userId = 1;
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