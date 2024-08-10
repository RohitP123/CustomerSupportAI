import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_ricqSRJkvHafGTL-KqS312dtKAdOOiw",
  authDomain: "customer-support-ai-58e2a.firebaseapp.com",
  projectId: "customer-support-ai-58e2a",
  storageBucket: "customer-support-ai-58e2a.appspot.com",
  messagingSenderId: "731692506847",
  appId: "1:731692506847:web:7dad442ecc850400c2936a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };