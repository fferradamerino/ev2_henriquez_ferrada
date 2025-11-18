// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAG3sHQrhdMqlEGCNTyGuu_7V_6mZW_jjg",
  authDomain: "reactfb-517e1.firebaseapp.com",
  projectId: "reactfb-517e1",
  storageBucket: "reactfb-517e1.firebasestorage.app",
  messagingSenderId: "965742556016",
  appId: "1:965742556016:web:49abaf2762d97f8c3a15b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);