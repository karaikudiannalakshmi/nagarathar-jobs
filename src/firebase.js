// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyDYPtVSHpXDGCy9DkcsoCP4VL7yPomqQbc",
  authDomain:        "nagarathar-jobs.firebaseapp.com",
  projectId:         "nagarathar-jobs",
  storageBucket:     "nagarathar-jobs.firebasestorage.app",
  messagingSenderId: "885426936975",
  appId:             "1:885426936975:web:a17fdd0736b8fd1f79e4fa",
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
