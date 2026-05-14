// api/send-email.js — Vercel serverless function
// Handles all email types for Nagarathar Jobs via Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SITE_URL       = process.env.SITE_URL || 'https://nagaratharjobs.com'
const FROM_EMAIL     = process.env.FROM_EMAIL || 'Nagarathar Jobs <onboarding@resend.dev>'
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || 'slnaiyar@gmail.com'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, data } = req.body

  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping')
    return res.status(200).json({ ok: true, skipped: true })
  }

  try {
    const email = buildEmail(type, data)
    if (!email) return res.status(400).json({ error: `Unknown email type: ${type}` })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [email.to],
        subject: email.subject,
        html:    wrapHtml(email.subject, email.body),
      }),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Resend API error')
    return res.status(200).json({ ok: true, id: result.id })

  } catch (err) {
    console.error('[email error]', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email templates
// ─────────────────────────────────────────────────────────────────────────────
function buildEmail(type, d) {
  switch (type) {

    case 'welcome':
      return {
        to:      d.to_email,
        subject: `Welcome to Nagarathar Jobs, ${d.display_name}!`,
        body: `
          <h2>வணக்கம் ${d.display_name}!</h2>
          <p>Welcome to <strong>Nagarathar Jobs</strong> — the community employment exchange for our Nagarathar family.</p>
          <p>You can now:</p>
          <ul>
            <li>📋 <strong>Browse job listings</strong> posted by community members</li>
            <li>👤 <strong>Complete your profile</strong> so employers can find you</li>
            <li>💼 <strong>Post jobs</strong> if you are looking to hire</li>
            <li>🤝 <strong>Connect with candidates</strong> in our community</li>
          </ul>
          <p>The stronger our community network, the better opportunities we create for each other.</p>
          <a href="${SITE_URL}/jobs" style="${btnStyle}">Browse Jobs Now →</a>
        `,
      }

    case 'employer_notification':
      return {
        to:      d.to_email,
        subject: `New Application: ${d.applicant_name} applied for ${d.job_title}`,
        body: `
          <h2>New Application Received</h2>
          <p>Dear <strong>${d.poster_name}</strong>,</p>
          <p>A community member has applied for your job posting.</p>
          <table style="${tableStyle}">
            <tr><td style="${tdLabel}">Job Title</td><td style="${tdValue}">${d.job_title}</td></tr>
            <tr><td style="${tdLabel}">Applicant</td><td style="${tdValue}">${d.applicant_name}</td></tr>
            <tr><td style="${tdLabel}">Email</td><td style="${tdValue}"><a href="mailto:${d.applicant_email}">${d.applicant_email}</a></td></tr>
            ${d.applicant_phone ? `<tr><td style="${tdLabel}">Phone</td><td style="${tdValue}">${d.applicant_phone}</td></tr>` : ''}
            ${d.applicant_kovil ? `<tr><td style="${tdLabel}">Kovil</td><td style="${tdValue}">${d.applicant_kovil}</td></tr>` : ''}
          </table>
          ${d.cover_letter && d.cover_letter !== '(no cover letter)' ? `
          <p><strong>Cover Letter:</strong></p>
          <blockquote style="border-left:3px solid #B8860B;padding:12px 16px;margin:0;background:#FBF7EE;color:#4A4A4A;font-style:italic;">
            ${d.cover_letter}
          </blockquote>` : ''}
          <p style="margin-top:20px">Please log in to review and update the application status.</p>
          <a href="${SITE_URL}/admin" style="${btnStyle}">Review Application →</a>
        `,
      }

    case 'applicant_confirmation':
      return {
        to:      d.to_email,
        subject: `Application Submitted: ${d.job_title} at ${d.company}`,
        body: `
          <h2>Application Submitted ✓</h2>
          <p>Dear <strong>${d.applicant_name}</strong>,</p>
          <p>Your application has been successfully submitted. The employer has been notified.</p>
          <table style="${tableStyle}">
            <tr><td style="${tdLabel}">Job Title</td><td style="${tdValue}">${d.job_title}</td></tr>
            <tr><td style="${tdLabel}">Company</td><td style="${tdValue}">${d.company}</td></tr>
            <tr><td style="${tdLabel}">Status</td><td style="${tdValue}"><span style="color:#1A6B3C;font-weight:600;">Application Received</span></td></tr>
          </table>
          <p>You will receive an email when your application status changes. You can also track all your applications from your profile.</p>
          <a href="${SITE_URL}/profile" style="${btnStyle}">View My Applications →</a>
        `,
      }

    case 'status_update':
      const statusColor = { shortlisted: '#1A4A7A', interview: '#7B6CF6', hired: '#1A6B3C', rejected: '#C0392B', pending: '#8A8070' }[d.status] || '#8A8070'
      const statusMsg   = {
        shortlisted: 'Congratulations! You have been shortlisted for this position.',
        interview:   'Great news! The employer would like to interview you. Expect to be contacted soon.',
        hired:       '🎉 Congratulations! You have been selected for this position. The employer will contact you with further details.',
        rejected:    'Thank you for your interest. Unfortunately your application was not shortlisted this time. Keep applying — the right opportunity is ahead!',
        pending:     'Your application is under review.',
      }[d.status] || 'Your application status has been updated.'
      return {
        to:      d.to_email,
        subject: `Application Update: ${d.job_title} — ${d.status.charAt(0).toUpperCase() + d.status.slice(1)}`,
        body: `
          <h2>Application Status Update</h2>
          <p>Dear <strong>${d.applicant_name}</strong>,</p>
          <p>${statusMsg}</p>
          <table style="${tableStyle}">
            <tr><td style="${tdLabel}">Job Title</td><td style="${tdValue}">${d.job_title}</td></tr>
            <tr><td style="${tdLabel}">New Status</td><td style="${tdValue}"><strong style="color:${statusColor};text-transform:capitalize;">${d.status}</strong></td></tr>
          </table>
          <a href="${SITE_URL}/profile" style="${btnStyle}">View My Applications →</a>
        `,
      }

    case 'admin_new_member':
      return {
        to:      d.to_email,
        subject: `New Member Registration: ${d.display_name}`,
        body: `
          <h2>New Member Registered 🎉</h2>
          <p>A new member has joined <strong>Nagarathar Jobs</strong>.</p>
          <table style="${tableStyle}">
            <tr><td style="${tdLabel}">Name</td><td style="${tdValue}"><strong>${d.display_name}</strong></td></tr>
            <tr><td style="${tdLabel}">Email</td><td style="${tdValue}">${d.email}</td></tr>
            <tr><td style="${tdLabel}">Kovil</td><td style="${tdValue}">${d.kovil || 'Not specified'}</td></tr>
            <tr><td style="${tdLabel}">City</td><td style="${tdValue}">${d.city || 'Not specified'}</td></tr>
            <tr><td style="${tdLabel}">Gender</td><td style="${tdValue}">${d.gender || 'Not specified'}</td></tr>
            <tr><td style="${tdLabel}">Here to</td><td style="${tdValue}">${
              d.lookingFor === 'job' ? '🔍 Find a Job' :
              d.lookingFor === 'hire' ? '💼 Hire / Post Jobs' : '🤝 Both'
            }</td></tr>
          </table>
          <a href="${SITE_URL}/admin" style="${btnStyle}">View in Admin Dashboard →</a>
        `,
      }

    case 'employer_followup':
      return {
        to:      d.to_email,
        subject: `Reminder: ${d.applicant_name}'s application for ${d.job_title} needs your attention`,
        body: `
          <h2>Application Pending Your Response</h2>
          <p>Dear <strong>${d.poster_name}</strong>,</p>
          <p><strong>${d.applicant_name}</strong> applied for <strong>${d.job_title}</strong> <strong>${d.days} days ago</strong> and is still waiting for a response.</p>
          <p>As a community platform, we encourage timely responses to keep our members engaged and our community strong.</p>
          <p>Please log in to review the application and update its status — even a rejection is better than silence for our community members.</p>
          <a href="${SITE_URL}/admin" style="${btnStyle}">Review Application →</a>
          <p style="margin-top:20px;font-size:13px;color:#8A8070;">If you have already contacted this applicant directly, please update the status in the admin dashboard.</p>
        `,
      }

    case 'seeker_followup':
      return {
        to:      d.to_email,
        subject: `Application Update: ${d.job_title} at ${d.company}`,
        body: `
          <h2>Following Up on Your Application</h2>
          <p>Dear <strong>${d.applicant_name}</strong>,</p>
          <p>You applied for <strong>${d.job_title}</strong> at <strong>${d.company}</strong> <strong>${d.days} days ago</strong>.</p>
          <p>Your application is still under review. While you wait, we encourage you to:</p>
          <ul>
            <li>Complete your profile with more details and skills</li>
            <li>Browse other open positions in the community</li>
            <li>Connect with employers directly through the Candidates page</li>
          </ul>
          <a href="${SITE_URL}/jobs" style="${btnStyle}">Browse More Jobs →</a>
        `,
      }

    case 'dormant_reminder':
      return {
        to:      d.to_email,
        subject: `We miss you, ${d.display_name} — new opportunities on Nagarathar Jobs`,
        body: `
          <h2>வணக்கம் ${d.display_name}!</h2>
          <p>It's been <strong>${d.days} days</strong> since your last visit to Nagarathar Jobs.</p>
          <p>Our community has been active — new job postings, new candidates, and new connections are waiting for you.</p>
          <p>Come back and explore what's new:</p>
          <ul>
            <li>💼 New job postings from community employers</li>
            <li>👥 New candidate profiles to discover</li>
            <li>🤝 Opportunities to strengthen our Nagarathar network</li>
          </ul>
          <a href="${SITE_URL}/jobs" style="${btnStyle}">Return to Nagarathar Jobs →</a>
        `,
      }

    default:
      return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML wrapper — consistent branded template
// ─────────────────────────────────────────────────────────────────────────────
function wrapHtml(subject, body) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1C1C1C,#3A3A2A);padding:24px 32px;text-align:center;">
            <div style="font-size:28px;margin-bottom:6px;">𓃵</div>
            <div style="color:#B8860B;font-size:20px;font-weight:700;letter-spacing:1px;">NAGARATHAR JOBS</div>
            <div style="color:#AAA;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Community Employment Exchange</div>
          </td>
        </tr>
        <!-- Gold rule -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#F5E9C8,#B8860B,#F5E9C8);"></td></tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;color:#1C1C1C;font-size:15px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#FAF7F0;padding:20px 32px;border-top:1px solid #E2D9C5;text-align:center;">
            <p style="margin:0;font-size:12px;color:#8A8070;">
              This email was sent by Nagarathar Jobs · Community Employment Exchange<br>
              <a href="${SITE_URL}" style="color:#B8860B;">nagaratharjobs.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Style constants
const btnStyle = `display:inline-block;background:#B8860B;color:#FFFFFF;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;margin-top:16px;`
const tableStyle = `border-collapse:collapse;width:100%;margin:16px 0;`
const tdLabel = `padding:10px 14px;background:#FAF7F0;border:1px solid #E2D9C5;font-size:13px;color:#8A8070;width:140px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;`
const tdValue = `padding:10px 14px;border:1px solid #E2D9C5;font-size:14px;color:#1C1C1C;`
