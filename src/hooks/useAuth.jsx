// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { sendWelcomeEmail } from '../utils/emailjs'
import { logLogin } from '../utils/activityLogger'

const AuthContext = createContext(null)

// ── Add your admin Gmail(s) here ───────────────────────────────────────────
const ADMIN_EMAILS = [
  'nagarathar.nalan@gmail.com',  // ← your admin Gmail
]
// ──────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'nj_users', u.uid))
        if (snap.exists()) setProfile(snap.data())
        else setProfile(null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email))

  // ── Email + Password login ────────────────────────────────────────────────
  async function loginEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'nj_users', cred.user.uid))
    if (snap.exists()) setProfile(snap.data())
    logLogin({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName || '' }).catch(() => {})
    return cred.user
  }

  // ── Email + Password register ─────────────────────────────────────────────
  async function registerEmail(email, password, displayName, extra = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    const profileData = {
      uid: cred.user.uid,
      email,
      displayName,
      photoURL: '',
      role: 'member',
      kovil: '', pirivu: '', phone: '', city: '',
      bio: '', skills: [], resumeText: '', linkedinUrl: '',
      industry: '', lookingFor: 'job',
      createdAt: serverTimestamp(),
      ...extra,
    }
    await setDoc(doc(db, 'nj_users', cred.user.uid), profileData)
    setProfile(profileData)
    // Welcome email
    sendWelcomeEmail({ to_email: email, display_name: displayName }).catch(() => {})
    return cred.user
  }

  // ── Google login ──────────────────────────────────────────────────────────
  async function loginGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const cred = await signInWithPopup(auth, provider)
    const ref  = doc(db, 'nj_users', cred.user.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      // First-time Google user → create profile
      const profileData = {
        uid:         cred.user.uid,
        email:       cred.user.email,
        displayName: cred.user.displayName || '',
        photoURL:    cred.user.photoURL    || '',
        role:        ADMIN_EMAILS.includes(cred.user.email) ? 'admin' : 'member',
        kovil: '', pirivu: '', phone: '', city: '',
        bio: '', skills: [], resumeText: '', linkedinUrl: '',
        industry: '', lookingFor: 'job',
        createdAt: serverTimestamp(),
      }
      await setDoc(ref, profileData)
      setProfile(profileData)
      sendWelcomeEmail({
        to_email:     cred.user.email,
        display_name: cred.user.displayName || 'Nagarathar Member',
      }).catch(() => {})
    } else {
      setProfile(snap.data())
    }
    logLogin({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName || '' }).catch(() => {})
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, setProfile, isAdmin, loading,
      loginEmail, registerEmail, loginGoogle, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
