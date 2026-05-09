// src/utils/emailjs.js
// Free tier: 200 emails/month at emailjs.com
//
// SETUP (one-time):
//   1. Sign up at https://emailjs.com
//   2. Add Gmail as a service → copy Service ID
//   3. Create 3 email templates (see README for variables)
//   4. Copy Public Key from Account → API Keys
//   5. Add to .env.local / Vercel env vars:
//        VITE_EMAILJS_SERVICE_ID
//        VITE_EMAILJS_PUBLIC_KEY
//        VITE_EMAILJS_TEMPLATE_WELCOME
//        VITE_EMAILJS_TEMPLATE_NOTIFY_EMPLOYER
//        VITE_EMAILJS_TEMPLATE_CONFIRM_APPLICANT
//        VITE_EMAILJS_TEMPLATE_STATUS_UPDATE

const SVC        = import.meta.env.VITE_EMAILJS_SERVICE_ID             || ''
const KEY        = import.meta.env.VITE_EMAILJS_PUBLIC_KEY             || ''
const T_WELCOME  = import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME       || ''
const T_EMPLOYER = import.meta.env.VITE_EMAILJS_TEMPLATE_NOTIFY_EMPLOYER  || ''
const T_CONFIRM  = import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRM_APPLICANT || ''
const T_STATUS   = import.meta.env.VITE_EMAILJS_TEMPLATE_STATUS_UPDATE || ''

async function send(templateId, params) {
  if (!SVC || !KEY || !templateId) {
    console.info('[EmailJS] Not configured — skipping:', templateId, params)
    return
  }
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:      SVC,
      template_id:     templateId,
      user_id:         KEY,
      template_params: params,
    }),
  })
  if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME — sent to new user on first sign-in (email or Google)
//    Template variables: {{display_name}}, {{to_email}}
// ─────────────────────────────────────────────────────────────────────────────
export function sendWelcomeEmail({ to_email, display_name }) {
  return send(T_WELCOME, { to_email, display_name })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NOTIFY EMPLOYER — sent when someone applies to their job
//    Template variables: {{to_email}}, {{poster_name}}, {{job_title}},
//                        {{applicant_name}}, {{applicant_email}}, {{cover_letter}}
// ─────────────────────────────────────────────────────────────────────────────
export function sendEmployerNotification({ to_email, poster_name, job_title, applicant_name, applicant_email, cover_letter }) {
  return send(T_EMPLOYER, { to_email, poster_name, job_title, applicant_name, applicant_email, cover_letter })
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONFIRM APPLICANT — sent to the person who just applied
//    Template variables: {{to_email}}, {{applicant_name}}, {{job_title}}, {{company}}
// ─────────────────────────────────────────────────────────────────────────────
export function sendApplicantConfirmation({ to_email, applicant_name, job_title, company }) {
  return send(T_CONFIRM, { to_email, applicant_name, job_title, company })
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. STATUS UPDATE — sent when admin/employer changes application status
//    Template variables: {{to_email}}, {{applicant_name}}, {{job_title}}, {{status}}
// ─────────────────────────────────────────────────────────────────────────────
export function sendStatusUpdate({ to_email, applicant_name, job_title, status }) {
  return send(T_STATUS, { to_email, applicant_name, job_title, status })
}
