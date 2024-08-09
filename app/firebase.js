import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPDc21Ak0JSd_EMry9N9uRjehGEibhIi8",
  authDomain: "customer-support-ai-fde58.firebaseapp.com",
  projectId: "customer-support-ai-fde58",
  storageBucket: "customer-support-ai-fde58.appspot.com",
  messagingSenderId: "903966233114",
  appId: "1:903966233114:web:5355a6a5dd9e93ef1e37a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };