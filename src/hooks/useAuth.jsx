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
import { sendWelcomeEmail, sendAdminNewMemberAlert } from '../utils/emailjs'
import { notifyMatchingEmployersForCandidate } from '../utils/matchEngine'
import { logLogin } from '../utils/activityLogger'

const AuthContext = createContext(null)

// ── Add your admin Gmail(s) here ───────────────────────────────────────────
// Admin emails — hardcoded + also reads from VITE_ADMIN_EMAILS env var
const ADMIN_EMAILS = [
  'slnaiyar@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAILS
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean)
    : []),
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
    // Step 1: Create Firebase Auth account
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    
    try {
      await updateProfile(cred.user, { displayName })
    } catch (e) {
      console.warn('updateProfile failed:', e)
    }

    // Step 2: Write Firestore profile — retry once if it fails
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

    try {
      await setDoc(doc(db, 'nj_users', cred.user.uid), profileData)
    } catch (firestoreErr) {
      console.error('Firestore write failed, retrying...', firestoreErr)
      // Wait 1 second and retry — auth token may not have propagated yet
      await new Promise(r => setTimeout(r, 1000))
      await setDoc(doc(db, 'nj_users', cred.user.uid), profileData)
    }

    setProfile(profileData)
    // Welcome email (fire and forget)
    sendWelcomeEmail({ to_email: email, display_name: displayName }).catch(() => {})

    // If candidate — notify matching employers in background
    if ((extra.lookingFor === 'job' || extra.lookingFor === 'both')) {
      notifyMatchingEmployersForCandidate({
        uid: cred.user.uid, email, displayName,
        industry:    extra.industry    || '',
        skills:      extra.skills      || [],
        kovil:       extra.kovil       || '',
        city:        extra.city        || '',
        workExperience:       extra.workExperience       || '',
        currentQualification: extra.currentQualification || '',
        lookingFor:  extra.lookingFor,
      }).then(r => console.log(`[match] Notified ${r.sent} employers`)).catch(() => {})
    }

    // Notify admin of new registration
    sendAdminNewMemberAlert({
      display_name: displayName,
      email,
      kovil:      extra.kovil      || '',
      city:       extra.city       || '',
      lookingFor: extra.lookingFor || 'job',
      gender:     extra.gender     || '',
    }).catch(() => {})
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
      // Notify matching employers for new Google candidate
      notifyMatchingEmployersForCandidate({
        uid: cred.user.uid, email: cred.user.email,
        displayName: cred.user.displayName || '',
        industry: '', skills: [], kovil: '', city: '',
        lookingFor: 'job',
      }).then(r => console.log(`[match] Notified ${r.sent} employers`)).catch(() => {})
      // Notify admin of new Google registration
      sendAdminNewMemberAlert({
        display_name: cred.user.displayName || 'Nagarathar Member',
        email:        cred.user.email,
        kovil: '', city: '', lookingFor: 'job', gender: '',
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
