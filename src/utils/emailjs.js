// src/utils/emailjs.js
// All emails now go through /api/send-email (Vercel serverless → Resend)
// No API keys needed in the frontend — all secrets stay server-side

async function sendEmail(type, data) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Email send failed')
    if (result.skipped) console.info(`[email] Resend not configured — skipped type: ${type}`)
    return result
  } catch (err) {
    // Never block the UI for email failures
    console.warn(`[email] Failed to send "${type}":`, err.message)
  }
}

// ── 1. Welcome on new registration ──────────────────────────────────────────
export function sendWelcomeEmail({ to_email, display_name }) {
  return sendEmail('welcome', { to_email, display_name })
}

// ── 2. Notify employer when someone applies ──────────────────────────────────
export function sendEmployerNotification({ to_email, poster_name, job_title, applicant_name, applicant_email, applicant_phone, applicant_kovil, cover_letter }) {
  return sendEmail('employer_notification', { to_email, poster_name, job_title, applicant_name, applicant_email, applicant_phone, applicant_kovil, cover_letter })
}

// ── 3. Confirm to applicant that their application was received ──────────────
export function sendApplicantConfirmation({ to_email, applicant_name, job_title, company }) {
  return sendEmail('applicant_confirmation', { to_email, applicant_name, job_title, company })
}

// ── 4. Status update when admin changes application status ───────────────────
export function sendStatusUpdate({ to_email, applicant_name, job_title, status }) {
  return sendEmail('status_update', { to_email, applicant_name, job_title, status })
}

// ── 5. Follow-up to employer after 7 days of no response ────────────────────
export function sendEmployerFollowup({ to_email, poster_name, job_title, applicant_name, days }) {
  return sendEmail('employer_followup', { to_email, poster_name, job_title, applicant_name, days })
}

// ── 6. Follow-up to job seeker after 7 days of no response ──────────────────
export function sendSeekerFollowup({ to_email, applicant_name, job_title, company, days }) {
  return sendEmail('seeker_followup', { to_email, applicant_name, job_title, company, days })
}

// ── 7. New member registration alert to admin ───────────────────────────────
export function sendAdminNewMemberAlert({ display_name, email, kovil, city, lookingFor, gender }) {
  return sendEmail('admin_new_member', { display_name, email, kovil, city, lookingFor, gender,
    to_email: import.meta.env.VITE_ADMIN_EMAILS?.split(',')[0]?.trim() || 'slnaiyar@gmail.com'
  })
}

// ── 8. Dormant member reminder after 30 days of no login ────────────────────
export function sendDormantReminder({ to_email, display_name, days }) {
  return sendEmail('dormant_reminder', { to_email, display_name, days })
}
