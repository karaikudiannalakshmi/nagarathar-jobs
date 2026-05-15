// src/utils/matchEngine.js
// Matching engine — fires when job posted or candidate registers
// Sends email alerts to matched parties

import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

// ── Core match function ────────────────────────────────────────────────────
// Returns true if candidate matches job based on industry OR skills
export function isMatch(candidate, job) {
  const candIndustry = candidate.industry || ''
  const candSkills   = candidate.skills   || []
  const jobIndustry  = job.industry       || ''
  const jobSkills    = job.requiredSkills  || []

  // Industry match
  if (candIndustry && jobIndustry && candIndustry === jobIndustry) return true

  // Skills overlap — any skill in common
  if (candSkills.length > 0 && jobSkills.length > 0) {
    const candSet = new Set(candSkills.map(s => s.toLowerCase()))
    if (jobSkills.some(s => candSet.has(s.toLowerCase()))) return true
  }

  // If job has no industry and no skills specified — match all seekers
  if (!jobIndustry && jobSkills.length === 0) return true

  return false
}

// ── 1. New job posted → find matching candidates → email them ──────────────
export async function notifyMatchingCandidatesForJob(job) {
  try {
    const snap = await getDocs(collection(db, 'nj_users'))
    const candidates = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(u =>
        (u.lookingFor === 'job' || u.lookingFor === 'both') &&
        u.email &&
        isMatch(u, job)
      )

    console.log(`[match] Job "${job.title}" → ${candidates.length} matching candidates`)

    let sent = 0
    for (const c of candidates) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'job_match_candidate',
            data: {
              to_email:       c.email,
              candidate_name: c.displayName || 'Nagarathar Member',
              job_title:      job.title,
              company:        job.company,
              location:       job.locationType === 'Any Location / Remote'
                                ? 'Any Location / Remote'
                                : (job.location || 'Not specified'),
              salary:         job.salaryType === 'negotiable'
                                ? 'Negotiable'
                                : (job.salary || 'Not specified'),
              industry:       job.industry || '',
              job_url:        `https://nagaratharjobs.com/jobs/${job.id}`,
              match_reason:   getMatchReason(c, job),
            }
          })
        })
        sent++
      } catch(e) {
        console.warn('[match] email failed for', c.email, e.message)
      }
    }
    return { matched: candidates.length, sent }
  } catch(e) {
    console.error('[match] notifyMatchingCandidatesForJob error:', e)
    return { matched: 0, sent: 0 }
  }
}

// ── 2. New candidate registers → find matching jobs → email employer ────────
export async function notifyMatchingEmployersForCandidate(candidate) {
  try {
    const snap = await getDocs(collection(db, 'nj_jobs'))
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(j => j.status === 'active' && j.postedByEmail && isMatch(candidate, j))

    console.log(`[match] Candidate "${candidate.displayName}" → ${jobs.length} matching jobs`)

    let sent = 0
    for (const job of jobs) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'job_match_employer',
            data: {
              to_email:        job.postedByEmail,
              employer_name:   job.postedByName  || 'Employer',
              job_title:       job.title,
              candidate_name:  candidate.displayName || 'Nagarathar Member',
              candidate_email: candidate.email,
              candidate_city:  candidate.city       || 'Not specified',
              candidate_kovil: candidate.kovil      || 'Not specified',
              candidate_industry: candidate.industry || 'Not specified',
              candidate_experience: candidate.workExperience || 'Not specified',
              candidate_qualification: candidate.currentQualification || 'Not specified',
              match_reason:    getMatchReason(candidate, job),
              candidates_url:  `https://nagaratharjobs.com/candidates`,
              job_url:         `https://nagaratharjobs.com/jobs/${job.id}`,
            }
          })
        })
        sent++
      } catch(e) {
        console.warn('[match] email failed for', job.postedByEmail, e.message)
      }
    }
    return { matched: jobs.length, sent }
  } catch(e) {
    console.error('[match] notifyMatchingEmployersForCandidate error:', e)
    return { matched: 0, sent: 0 }
  }
}

// ── Helper: explain why it's a match ──────────────────────────────────────
function getMatchReason(candidate, job) {
  const reasons = []
  if (candidate.industry && job.industry && candidate.industry === job.industry) {
    reasons.push(`Industry: ${candidate.industry}`)
  }
  const candSkills = (candidate.skills || []).map(s => s.toLowerCase())
  const jobSkills  = (job.requiredSkills || []).filter(s => candSkills.includes(s.toLowerCase()))
  if (jobSkills.length > 0) {
    reasons.push(`Skills: ${jobSkills.slice(0,3).join(', ')}`)
  }
  return reasons.length > 0 ? reasons.join(' · ') : 'Profile match'
}
