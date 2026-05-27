// api/send-email.js — Vercel serverless — Resend REST API (no npm packages needed)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL     = process.env.FROM_EMAIL || 'Nagarathar Jobs <admin@nagaratharjobs.com>'
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || 'slnaiyar@gmail.com'
const SITE_URL       = process.env.SITE_URL   || 'https://nagaratharjobs.com'

function wrap(html) {
  return '<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#2C1810;background:#FBF8F3;"><div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #D4A017;padding-bottom:16px;"><img src="' + SITE_URL + '/logo.png" alt="Nagarathar Jobs" style="height:56px;"/></div>' + html + '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8D5B8;text-align:center;font-size:12px;color:#8A7060;"><a href="' + SITE_URL + '" style="color:#B8860B;">nagaratharjobs.com</a></div></body></html>'
}

function btn(url, label) {
  return '<a href="' + url + '" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">' + label + '</a>'
}

function row(label, value) {
  return '<tr><td style="padding:8px 12px;background:#FAF7F0;font-weight:600;width:40%;border-bottom:1px solid #E8D5B8;">' + label + '</td><td style="padding:8px 12px;border-bottom:1px solid #E8D5B8;">' + value + '</td></tr>'
}

function tbl(rows) {
  return '<table style="width:100%;border-collapse:collapse;border:1px solid #E8D5B8;margin:16px 0;">' + rows + '</table>'
}

async function send(to, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: to, subject: subject, html: wrap(html) }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.message || JSON.stringify(data))
  return data
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!RESEND_API_KEY) {
    console.warn('[email] No RESEND_API_KEY set')
    return res.status(200).json({ ok: true, skipped: true })
  }

  const { type, data: d } = req.body || {}
  console.log('[email] Sending type:', type, 'to:', d && d.to_email)

  try {
    let to, subject, html

    if (type === 'welcome') {
      to = d.to_email
      subject = 'Welcome to Nagarathar Jobs!'
      html = '<h2>Welcome to Nagarathar Jobs! 🙏</h2><p>Dear <strong>' + (d.display_name || 'Member') + '</strong>,</p><p>Your account has been created. Complete your profile to start getting matched with opportunities.</p>' + btn(SITE_URL + '/dashboard', 'Go to Dashboard →')

    } else if (type === 'admin_new_member') {
      to = ADMIN_EMAIL
      subject = 'New Member: ' + d.display_name
      html = '<h2>New Member Registered</h2>' + tbl(row('Name', d.display_name) + row('Email', d.email) + row('Kovil', d.kovil || 'Not specified') + row('City', d.city || 'Not specified') + row('Role', d.lookingFor === 'job' ? 'Job Seeker' : d.lookingFor === 'hire' ? 'Employer' : 'Both')) + btn(SITE_URL + '/admin', 'View in Admin →')

    } else if (type === 'employer_notification') {
      to = d.to_email
      subject = 'New Application: ' + d.applicant_name + ' for ' + d.job_title
      html = '<h2>New Application Received!</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><p><strong>' + d.applicant_name + '</strong> applied for <strong>' + d.job_title + '</strong>.</p>' + tbl(row('Applicant', d.applicant_name) + row('Email', d.applicant_email) + (d.applicant_phone ? row('Phone', d.applicant_phone) : '') + (d.cover_letter ? row('Message', d.cover_letter) : '')) + btn(SITE_URL + '/admin', 'Review Application →')

    } else if (type === 'applicant_confirmation') {
      to = d.to_email
      subject = 'Application Submitted: ' + d.job_title
      html = '<h2>Application Submitted! ✅</h2><p>Dear <strong>' + (d.applicant_name || 'Member') + '</strong>,</p><p>Your application for <strong>' + d.job_title + '</strong> at ' + d.company + ' has been submitted successfully.</p>' + btn(SITE_URL + '/profile', 'Track Application →')

    } else if (type === 'status_update') {
      to = d.to_email
      subject = 'Application Update: ' + d.job_title
      html = '<h2>Application Status Updated</h2><p>Dear <strong>' + (d.applicant_name || 'Member') + '</strong>,</p><p>Your application for <strong>' + d.job_title + '</strong> status:</p><div style="text-align:center;padding:20px;background:#FAF7F0;border-radius:8px;border:2px solid #B8860B;margin:16px 0;font-size:1.4rem;font-weight:700;color:#B8860B;">' + (d.status || '').toUpperCase() + '</div>' + btn(SITE_URL + '/profile', 'View My Applications →')

    } else if (type === 'job_posted_confirmation') {
      to = d.to_email
      subject = 'Your job "' + d.job_title + '" is now live!'
      html = '<h2>Your Job is Live! 🎉</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><p>Your job posting is published. Matching candidates have been notified.</p>' + tbl(row('Job Title', '<strong>' + d.job_title + '</strong>') + row('Company', d.company) + row('Status', '<span style="color:#1A6B3C;font-weight:600;">Active ✅</span>')) + btn(d.job_url, 'View Job →')

    } else if (type === 'job_match_candidate') {
      to = d.to_email
      subject = 'Job Match Found: ' + d.job_title
      html = '<h2>A Job Matches Your Profile! ✨</h2><p>Dear <strong>' + (d.candidate_name || 'Member') + '</strong>,</p>' + tbl(row('Job', '<strong>' + d.job_title + '</strong>') + row('Company', d.company) + row('Location', d.location || 'Any') + row('Salary', d.salary || 'Negotiable') + row('Match', '<span style="color:#B8860B;">✨ ' + (d.match_reason || 'Profile match') + '</span>')) + btn(d.job_url, 'View & Apply Now →')

    } else if (type === 'job_match_employer') {
      to = d.to_email
      subject = 'Matching Candidate: ' + d.candidate_name
      html = '<h2>New Matching Candidate! 👥</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p>' + tbl(row('Name', d.candidate_name) + row('Email', d.candidate_email) + row('City', d.candidate_city || '') + row('Experience', d.candidate_experience || '') + row('Match', '<span style="color:#B8860B;">✨ ' + (d.match_reason || 'Profile match') + '</span>')) + btn(SITE_URL + '/candidates', 'View All Candidates →')

    } else if (type === 'job_digest') {
      to = d.to_email
      subject = d.job_count + ' Jobs Waiting for You on Nagarathar Jobs'
      html = '<h2>Jobs Matching Your Profile 💼</h2><p>Dear <strong>' + (d.candidate_name || 'Member') + '</strong>,</p><p><strong>' + d.job_count + ' jobs</strong> match your profile:</p><table style="width:100%;border-collapse:collapse;border:1px solid #E8D5B8;margin:16px 0;">' + d.jobs_list + '</table>' + btn(SITE_URL + '/jobs', 'Browse All Jobs →')

    } else if (type === 'candidate_digest') {
      to = d.to_email
      subject = d.candidate_count + ' Matching Candidates for "' + d.job_title + '"'
      html = '<h2>Matching Candidates 👥</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><table style="width:100%;border-collapse:collapse;border:1px solid #E8D5B8;margin:16px 0;">' + d.candidates_list + '</table>' + btn(SITE_URL + '/candidates', 'View All Candidates →')

    } else {
      return res.status(400).json({ error: 'Unknown type: ' + type })
    }

    const result = await send(to, subject, html)
    console.log('[email] OK:', type, '->', to, result.id)
    return res.status(200).json({ ok: true, id: result.id })

  } catch(err) {
    console.error('[email] FAILED:', type, err.message)
    return res.status(500).json({ error: err.message })
  }
}
