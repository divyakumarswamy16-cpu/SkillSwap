import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase.js";

// STUDENT REGISTRATION
export async function registerUser(name, email, password) {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await setDoc(doc(db, "users", result.user.uid), {
    name: name,
    email: email,
    skillsTeach: [],
    skillsLearn: [],
    createdAt: serverTimestamp()
  });

  return result.user;
}

// STUDENT LOGIN
export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return result.user;
}

// STUDENT LOGOUT
export async function logoutUser() {
  await signOut(auth);
}