// src/utils/followUpScheduler.js
// Checks for follow-up conditions and sends emails via /api/send-email
// Called on Admin Dashboard load — runs silently in background

import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { sendEmployerFollowup, sendSeekerFollowup, sendDormantReminder } from './emailjs'

const DAY_MS = 86400000

export async function runFollowUpChecks() {
  const results = { pendingApps: 0, noResponseApps: 0, dormantMembers: 0 }
  await Promise.allSettled([
    checkPendingApplications(results),
    checkNoResponseApplications(results),
    checkDormantMembers(results),
  ])
  return results
}

// ── 1. Employer: application pending > 7 days ────────────────────────────────
async function checkPendingApplications(results) {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 7 * DAY_MS))
  const snap = await getDocs(query(
    collection(db, 'nj_applications'),
    where('status', '==', 'pending'),
    where('createdAt', '<=', cutoff)
  ))
  for (const d of snap.docs) {
    const app = { id: d.id, ...d.data() }
    const key = `employer_7d_${app.id}`
    if (await alreadySent(key)) continue
    await sendEmployerFollowup({
      to_email:       app.posterEmail,
      poster_name:    app.jobCompany,
      job_title:      app.jobTitle,
      applicant_name: app.applicantName,
      days:           daysSince(app.createdAt?.toDate()),
    })
    await markSent(key)
    results.pendingApps++
  }
}

// ── 2. Job seeker: applied but no response in 7 days ────────────────────────
async function checkNoResponseApplications(results) {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 7 * DAY_MS))
  const snap = await getDocs(query(
    collection(db, 'nj_applications'),
    where('status', '==', 'pending'),
    where('createdAt', '<=', cutoff)
  ))
  for (const d of snap.docs) {
    const app = { id: d.id, ...d.data() }
    const key = `seeker_7d_${app.id}`
    if (await alreadySent(key)) continue
    await sendSeekerFollowup({
      to_email:       app.applicantEmail,
      applicant_name: app.applicantName,
      job_title:      app.jobTitle,
      company:        app.jobCompany,
      days:           daysSince(app.createdAt?.toDate()),
    })
    await markSent(key)
    results.noResponseApps++
  }
}

// ── 3. Dormant member: no login in 30 days ───────────────────────────────────
async function checkDormantMembers(results) {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 30 * DAY_MS))
  const snap = await getDocs(query(
    collection(db, 'nj_users'),
    where('lastSeen', '<=', cutoff)
  ))
  for (const d of snap.docs) {
    const u = { id: d.id, ...d.data() }
    if (!u.email) continue
    const key = `dormant_30d_${u.id}`
    if (await alreadySent(key)) continue
    await sendDormantReminder({
      to_email:     u.email,
      display_name: u.displayName || 'Nagarathar Member',
      days:         daysSince(u.lastSeen?.toDate()),
    })
    await markSent(key)
    results.dormantMembers++
  }
}

async function alreadySent(key) {
  try {
    const snap = await getDocs(query(collection(db, 'nj_followup_sent'), where('key', '==', key)))
    return !snap.empty
  } catch { return false }
}

async function markSent(key) {
  try {
    await addDoc(collection(db, 'nj_followup_sent'), { key, sentAt: serverTimestamp() })
  } catch {}
}

function daysSince(date) {
  if (!date) return '?'
  return Math.floor((Date.now() - date.getTime()) / DAY_MS)
}
