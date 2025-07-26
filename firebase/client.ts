// Import the functions you need from the SDKs you need
import { initializeApp,getApp,getApps } from "firebase/app";
import {getAuth } from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyAsjOKEAaXIFCdVQm1v4FmTSpie7DoNs44",
    authDomain: "prepwise-3831c.firebaseapp.com",
    projectId: "prepwise-3831c",
    storageBucket: "prepwise-3831c.firebasestorage.app",
    messagingSenderId: "51164535798",
    appId: "1:51164535798:web:a1ed60f86f804e156c05d7",
    measurementId: "G-MB4587PQWF"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
