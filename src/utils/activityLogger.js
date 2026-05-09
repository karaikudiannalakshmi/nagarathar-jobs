// src/utils/activityLogger.js
// Logs all trackable events to nj_activity collection in Firestore

import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Central activity logger — call from any page/action
 * eventType: 'profile_view' | 'job_view' | 'application' | 'login' | 'status_change'
 */
export async function logActivity(eventType, data) {
  try {
    await addDoc(collection(db, 'nj_activity'), {
      eventType,
      ...data,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    // Never block UI for logging failures
    console.warn('[activity]', e.message)
  }
}

// ── Specific helpers ──────────────────────────────────────────────────────────

export function logProfileView({ viewerUid, viewerName, viewerEmail, targetUid, targetName, targetEmail }) {
  return logActivity('profile_view', { viewerUid, viewerName, viewerEmail, targetUid, targetName, targetEmail })
}

export function logJobView({ viewerUid, viewerName, jobId, jobTitle, jobCompany, postedBy }) {
  return logActivity('job_view', { viewerUid, viewerName, jobId, jobTitle, jobCompany, postedBy })
}

export function logLogin({ uid, email, displayName }) {
  // Also update last_seen on user doc
  updateDoc(doc(db, 'nj_users', uid), {
    lastSeen: serverTimestamp(),
    loginCount: 1, // will be incremented via FieldValue in real usage
  }).catch(() => {})
  return logActivity('login', { uid, email, displayName })
}

export function logApplication({ applicantUid, applicantName, applicantEmail, jobId, jobTitle, company, posterUid }) {
  return logActivity('application', { applicantUid, applicantName, applicantEmail, jobId, jobTitle, company, posterUid })
}

export function logStatusChange({ adminUid, applicationId, applicantUid, applicantName, applicantEmail, jobTitle, oldStatus, newStatus }) {
  return logActivity('status_change', { adminUid, applicationId, applicantUid, applicantName, applicantEmail, jobTitle, oldStatus, newStatus })
}
