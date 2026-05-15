// api/weekly-digest.js — Vercel Cron Job (runs every Monday 8am IST)
// Sends personalised weekly digest to all members

const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getFirestore }                  = require('firebase-admin/firestore')

// Init Firebase Admin
if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId:   process.env.FIREBASE_PROJECT_ID   || 'nagarathar-jobs',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })})
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL     = process.env.FROM_EMAIL || 'Nagarathar Jobs <noreply@nagaratharjobs.com>'
const SITE_URL       = process.env.SITE_URL   || 'https://nagaratharjobs.com'

function isMatch(candidate, job) {
  const candIndustry = candidate.industry || ''
  const candSkills   = candidate.skills   || []
  const jobIndustry  = job.industry       || ''
  const jobSkills    = job.requiredSkills  || []
  if (candIndustry && jobIndustry && candIndustry === jobIndustry) return true
  if (candSkills.length > 0 && jobSkills.length > 0) {
    const candSet = new Set(candSkills.map(s => s.toLowerCase()))
    if (jobSkills.some(s => candSet.has(s.toLowerCase()))) return true
  }
  return false
}

async function sendEmail(to, subject, body) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL, to, subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#2C1810;background:#FBF8F3;">
        <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #D4A017;padding-bottom:16px;">
          <h2 style="color:#B8860B;margin:0;">Nagarathar Jobs</h2>
          <p style="color:#8A7060;font-size:13px;margin:4px 0 0;">Weekly Update</p>
        </div>
        ${body}
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8D5B8;text-align:center;font-size:12px;color:#8A7060;">
          <a href="${SITE_URL}" style="color:#B8860B;">nagaratharjobs.com</a> · 
          Serving the Nagarathar community
        </div>
      </body></html>`
    })
  })
  return res.ok
}

module.exports = async function handler(req, res) {
  // Security: only allow cron calls
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const db = getFirestore()
    const [usersSnap, jobsSnap, appsSnap] = await Promise.all([
      db.collection('nj_users').get(),
      db.collection('nj_jobs').where('status','==','active').get(),
      db.collection('nj_applications').get(),
    ])

    const users     = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const activeJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const apps      = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // This week boundary
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

    const newJobs       = activeJobs.filter(j => j.createdAt?.toDate() > weekAgo)
    const newCandidates = users.filter(u => (u.lookingFor==='job'||u.lookingFor==='both') && u.createdAt?.toDate() > weekAgo)

    let sentCount = 0

    for (const user of users) {
      if (!user.email) continue
      const isCand = user.lookingFor === 'job' || user.lookingFor === 'both'
      const isEmp  = user.lookingFor === 'hire' || user.lookingFor === 'both'

      let body = `<p>Dear <strong>${user.displayName || 'Member'}</strong>,</p>
        <p>Here is your weekly update from <strong>Nagarathar Jobs</strong>.</p>`

      let hasContent = false

      // For candidates — show new matching jobs this week
      if (isCand && newJobs.length > 0) {
        const matching = newJobs.filter(j => isMatch(user, j))
        if (matching.length > 0) {
          hasContent = true
          body += `<h3 style="color:#B8860B;">🆕 New Jobs This Week (${matching.length})</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`
          matching.slice(0, 5).forEach(j => {
            body += `<tr><td style="padding:10px;border-bottom:1px solid #E8D5B8;">
              <strong><a href="${SITE_URL}/jobs/${j.id}" style="color:#B8860B;text-decoration:none;">${j.title}</a></strong><br/>
              <span style="font-size:13px;color:#8A7060;">${j.company} · ${j.location||j.locationType||'Any Location'}</span>
            </td></tr>`
          })
          body += `</table>`
        }

        // Show application status updates
        const myApps = apps.filter(a => a.applicantUid === user.id)
        const updated = myApps.filter(a => ['shortlisted','interview','hired'].includes(a.status))
        if (updated.length > 0) {
          hasContent = true
          body += `<h3 style="color:#1A6B3C;">📨 Application Updates</h3>`
          updated.forEach(a => {
            body += `<p style="padding:8px 12px;background:#E8F5EE;border-radius:6px;margin-bottom:8px;">
              <strong>${a.jobTitle}</strong> — Status: <strong style="color:#1A6B3C;">${a.status}</strong>
            </p>`
          })
        }
      }

      // For employers — show new matching candidates this week
      if (isEmp) {
        const myJobs = activeJobs.filter(j => j.postedBy === user.id)
        if (myJobs.length > 0 && newCandidates.length > 0) {
          const matched = newCandidates.filter(c => myJobs.some(j => isMatch(c, j)))
          if (matched.length > 0) {
            hasContent = true
            body += `<h3 style="color:#B8860B;">👥 New Matching Candidates (${matched.length})</h3>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`
            matched.slice(0, 5).forEach(c => {
              body += `<tr><td style="padding:10px;border-bottom:1px solid #E8D5B8;">
                <strong>${c.displayName}</strong>${c.kovil ? ` · <span style="color:#B8860B;">${c.kovil} Kovil</span>` : ''}<br/>
                <span style="font-size:13px;color:#8A7060;">${c.city||''}${c.industry?' · '+c.industry:''}${c.workExperience?' · '+c.workExperience:''}</span><br/>
                <a href="mailto:${c.email}" style="font-size:12px;color:#B8860B;">${c.email}</a>
              </td></tr>`
            })
            body += `</table>`
          }
        }
      }

      if (!hasContent) continue // skip if nothing to report

      body += `<div style="margin-top:20px;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">
          View Your Dashboard →
        </a>
      </div>`

      await sendEmail(user.email, '📋 Your Weekly Nagarathar Jobs Update', body)
      sentCount++
    }

    res.json({ success: true, sent: sentCount, newJobs: newJobs.length, newCandidates: newCandidates.length })

  } catch(err) {
    console.error('Weekly digest error:', err)
    res.status(500).json({ error: err.message })
  }
}
