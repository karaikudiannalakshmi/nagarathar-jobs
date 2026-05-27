// api/send-email.js — Vercel serverless function
// Sends emails via GoDaddy SMTP using nodemailer

import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || 'smtpout.secureserver.net'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const SMTP_USER = process.env.SMTP_USER || 'admin@nagaratharjobs.com'
const SMTP_PASS = process.env.SMTP_PASS || ''
const FROM_EMAIL = `Nagarathar Jobs <${SMTP_USER}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'slnaiyar@gmail.com'
const SITE_URL = process.env.SITE_URL || 'https://nagaratharjobs.com'

// Create transporter
function getTransporter() {
  return nodemailer.createTransporter({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  })
}

async function sendMail(to, subject, html) {
  const transporter = getTransporter()
  const result = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
    <body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#2C1810;background:#FBF8F3;">
      <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #D4A017;padding-bottom:16px;">
        <img src="${SITE_URL}/logo.png" alt="Nagarathar Jobs" style="height:60px;"/>
        <p style="color:#8A7060;font-size:13px;margin:4px 0 0;">Community Employment Exchange</p>
      </div>
      ${html}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8D5B8;text-align:center;font-size:12px;color:#8A7060;">
        <a href="${SITE_URL}" style="color:#B8860B;">nagaratharjobs.com</a> · Serving the Nagarathar community
      </div>
    </body></html>`,
  })
  return result
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, data: d } = req.body || {}

  if (!SMTP_PASS) {
    console.warn('[email] SMTP_PASS not set — skipping')
    return res.status(200).json({ ok: true, skipped: true })
  }

  try {
    let to, subject, html

    if (type === 'welcome') {
      to = d.to_email
      subject = 'Welcome to Nagarathar Jobs!'
      html = '<h2>Welcome to Nagarathar Jobs! 🙏</h2><p>Dear <strong>' + (d.display_name || 'Member') + '</strong>,</p><p>Your account has been created successfully. You are now part of the Nagarathar community employment network.</p><p>Complete your profile to start getting matched with the right opportunities.</p><a href="' + SITE_URL + '/dashboard" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Go to Dashboard →</a>'
    }
    else if (type === 'admin_new_member') {
      to = ADMIN_EMAIL
      subject = 'New Member: ' + d.display_name
      html = '<h2>New Member Registered</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;width:40%">Name</td><td style="padding:8px;">' + d.display_name + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Email</td><td style="padding:8px;">' + d.email + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Kovil</td><td style="padding:8px;">' + (d.kovil || 'Not specified') + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">City</td><td style="padding:8px;">' + (d.city || 'Not specified') + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Looking for</td><td style="padding:8px;">' + (d.lookingFor === 'job' ? 'Find a Job' : d.lookingFor === 'hire' ? 'Hire' : 'Both') + '</td></tr></table><a href="' + SITE_URL + '/admin" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">View in Admin →</a>'
    }
    else if (type === 'employer_notification') {
      to = d.to_email
      subject = 'New Application: ' + d.applicant_name + ' for ' + d.job_title
      html = '<h2>New Application Received!</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><p><strong>' + d.applicant_name + '</strong> has applied for your job posting <strong>' + d.job_title + '</strong>.</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;width:40%">Applicant</td><td style="padding:8px;">' + d.applicant_name + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Email</td><td style="padding:8px;">' + d.applicant_email + '</td></tr>' + (d.applicant_phone ? '<tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Phone</td><td style="padding:8px;">' + d.applicant_phone + '</td></tr>' : '') + '</table>' + (d.cover_letter ? '<p><strong>Message:</strong> ' + d.cover_letter + '</p>' : '') + '<a href="' + SITE_URL + '/admin" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Review Application →</a>'
    }
    else if (type === 'applicant_confirmation') {
      to = d.to_email
      subject = 'Application Submitted: ' + d.job_title
      html = '<h2>Application Submitted! ✅</h2><p>Dear <strong>' + (d.applicant_name || 'Member') + '</strong>,</p><p>Your application for <strong>' + d.job_title + '</strong> at ' + d.company + ' has been submitted successfully.</p><p>The employer has been notified and will contact you if shortlisted.</p><a href="' + SITE_URL + '/profile" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Track Application →</a>'
    }
    else if (type === 'status_update') {
      to = d.to_email
      subject = 'Application Update: ' + d.job_title
      const statusColors = { shortlisted: '#B8860B', interview: '#1A4A7A', hired: '#1A6B3C', rejected: '#8A7060' }
      const color = statusColors[d.status] || '#B8860B'
      html = '<h2>Application Status Updated</h2><p>Dear <strong>' + (d.applicant_name || 'Member') + '</strong>,</p><p>Your application for <strong>' + d.job_title + '</strong> has been updated to:</p><div style="text-align:center;padding:20px;margin:16px 0;background:#FAF7F0;border-radius:8px;border:2px solid ' + color + ';"><span style="font-size:1.5rem;font-weight:700;color:' + color + ';">' + (d.status || '').toUpperCase() + '</span></div><a href="' + SITE_URL + '/profile" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">View My Applications →</a>'
    }
    else if (type === 'job_posted_confirmation') {
      to = d.to_email
      subject = 'Your job "' + d.job_title + '" is now live!'
      html = '<h2>Your Job is Live! 🎉</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><p>Your job posting has been published successfully.</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;width:40%">Job Title</td><td style="padding:8px;"><strong>' + d.job_title + '</strong></td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Company</td><td style="padding:8px;">' + d.company + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Status</td><td style="padding:8px;color:#1A6B3C;font-weight:600;">✅ Active</td></tr></table><p>Matching candidates in our community have been notified about this opportunity.</p><div style="display:flex;gap:12px;margin-top:16px;"><a href="' + d.job_url + '" style="display:inline-block;padding:12px 24px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">View Job →</a> <a href="' + SITE_URL + '/candidates" style="display:inline-block;padding:12px 24px;border:2px solid #B8860B;color:#B8860B;border-radius:6px;text-decoration:none;font-weight:600;">Browse Candidates →</a></div>'
    }
    else if (type === 'job_match_candidate') {
      to = d.to_email
      subject = 'Job Match: ' + d.job_title + ' at ' + d.company
      html = '<h2>A Job Matches Your Profile! ✨</h2><p>Dear <strong>' + (d.candidate_name || 'Member') + '</strong>,</p><p>A new job has been posted that matches your profile.</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;width:40%">Job</td><td style="padding:8px;"><strong>' + d.job_title + '</strong></td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Company</td><td style="padding:8px;">' + d.company + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Location</td><td style="padding:8px;">' + (d.location || 'Any Location') + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Salary</td><td style="padding:8px;">' + (d.salary || 'Negotiable') + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Match Reason</td><td style="padding:8px;color:#B8860B;font-weight:600;">✨ ' + (d.match_reason || 'Profile match') + '</td></tr></table><a href="' + d.job_url + '" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">View & Apply Now →</a>'
    }
    else if (type === 'job_match_employer') {
      to = d.to_email
      subject = 'Matching Candidate: ' + d.candidate_name
      html = '<h2>New Matching Candidate! 👥</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><p>A new member has joined whose profile matches your job <strong>' + d.job_title + '</strong>.</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;width:40%">Name</td><td style="padding:8px;"><strong>' + d.candidate_name + '</strong></td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Email</td><td style="padding:8px;">' + d.candidate_email + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">City</td><td style="padding:8px;">' + (d.candidate_city || '') + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Experience</td><td style="padding:8px;">' + (d.candidate_experience || '') + '</td></tr><tr><td style="padding:8px;background:#FAF7F0;font-weight:600;">Match</td><td style="padding:8px;color:#B8860B;font-weight:600;">✨ ' + (d.match_reason || 'Profile match') + '</td></tr></table><a href="' + SITE_URL + '/candidates" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">View All Candidates →</a>'
    }
    else if (type === 'job_digest') {
      to = d.to_email
      subject = d.job_count + ' Jobs Waiting for You on Nagarathar Jobs'
      html = '<h2>Jobs Matching Your Profile 💼</h2><p>Dear <strong>' + (d.candidate_name || 'Member') + '</strong>,</p><p>Here are <strong>' + d.job_count + ' job opportunities</strong> that match your profile:</p><table style="width:100%;border-collapse:collapse;border:1px solid #E8D5B8;margin-bottom:20px;">' + d.jobs_list + '</table><a href="' + SITE_URL + '/jobs" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Browse All Jobs →</a>'
    }
    else if (type === 'candidate_digest') {
      to = d.to_email
      subject = d.candidate_count + ' Matching Candidates for "' + d.job_title + '"'
      html = '<h2>Matching Candidates Available 👥</h2><p>Dear <strong>' + (d.employer_name || 'Employer') + '</strong>,</p><p><strong>' + d.candidate_count + ' candidates</strong> match your job posting <strong>' + d.job_title + '</strong>.</p><table style="width:100%;border-collapse:collapse;border:1px solid #E8D5B8;margin-bottom:20px;">' + d.candidates_list + '</table><a href="' + SITE_URL + '/candidates" style="display:inline-block;padding:12px 28px;background:#B8860B;color:white;border-radius:6px;text-decoration:none;font-weight:600;">View All Candidates →</a>'
    }
    else {
      return res.status(400).json({ error: 'Unknown email type: ' + type })
    }

    const result = await sendMail(to, subject, html)
    console.log('[email] Sent:', type, 'to', to, result.messageId)
    return res.status(200).json({ ok: true, messageId: result.messageId })

  } catch (err) {
    console.error('[email] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
