import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzVUkKOk4XckuhiDdki0iBCw6TAtRs5Q4",
  authDomain: "payroll-system-enhanced.firebaseapp.com",
  projectId: "payroll-system-enhanced",
  storageBucket: "payroll-system-enhanced.firebasestorage.app",
  messagingSenderId: "103191711655",
  appId: "1:103191711655:web:08b7eae398882e96e87082",
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
