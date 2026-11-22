import { initializeApp } from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXEkwZr0jC-K-JdUeOx9RsnQJgeNdSAW8",
  authDomain: "skillswap-ff359.firebaseapp.com",
  projectId: "skillswap-ff359",
  storageBucket: "skillswap-ff359.firebasestorage.app",
  messagingSenderId: "474185449100",
  appId: "1:474185449100:web:c928bf8807a3fdb271c5a9"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const authReady = setPersistence(
  auth,
  browserLocalPersistence
);