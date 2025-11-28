// Frontend/src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Import the functions you need from the SDKs you need

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_n7jAZnE8-zCjxipqMYfE_g2CsgonPc8",
  authDomain: "webdev-81f59.firebaseapp.com",
  projectId: "webdev-81f59",
  storageBucket: "webdev-81f59.firebasestorage.app",
  messagingSenderId: "238728529399",
  appId: "1:238728529399:web:518f0d2eba531227eedaf2",
  measurementId: "G-WL43495EHS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
