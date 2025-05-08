import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBdYyh2H44T0rSIWzGI_wKQvP7KemXnDzY",
  authDomain: "expense-manager-376bc.firebaseapp.com",
  projectId: "expense-manager-376bc",
  storageBucket: "expense-manager-376bc.appspot.com",
  messagingSenderId: "281673701772",
  appId: "1:281673701772:web:3a07c675bbc0a0bac2dea9",
  measurementId: "G-M7XF1V4BHR",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Set persistence using AsyncStorage
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting persistence:', error);
});

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
