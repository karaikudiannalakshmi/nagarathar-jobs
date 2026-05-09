# 𓃵 Nagarathar Jobs — Community Employment Exchange

A full-stack employment exchange platform for the Nagarathar community.  
Built with **React + Vite · Firebase Firestore · Vercel**.

---

## Features

| Feature | Details |
|---|---|
| **Authentication** | Email/password + Google Sign-in |
| **Job Postings** | Any member can post; filter by industry, type, location |
| **Applications** | One-click apply with cover letter; employer notified by email |
| **Candidate Profiles** | Skills, kovil, bio, resume text; searchable directory |
| **Admin Dashboard** | Overview stats, manage jobs/applications/users |
| **Email Notifications** | Via EmailJS — application alerts to employer |
| **Nagarathar-specific** | Kovil (74 clans), Pirivu, community-first design |

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create new project: **`nagarathar-jobs`**
3. Enable **Firestore Database** (production mode, `asia-south1` Mumbai region)
4. Enable **Authentication** → Sign-in methods:
   - Email/Password ✓
   - Google ✓

### 2. Deploy Firestore Rules & Indexes

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select existing project
firebase deploy --only firestore
```

### 3. Get Firebase Config

Firebase Console → Project Settings → Your apps → Add Web App  
Copy the config values into your `.env.local`.

---

## Local Development

```bash
# Clone and install
git clone https://github.com/karaikudiannalakshmi/nagarathar-jobs
cd nagarathar-jobs
npm install

# Set up environment
cp .env.example .env.local
# Fill in all VITE_FIREBASE_* values

npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Comma-separated admin Gmail addresses
VITE_ADMIN_EMAILS=youremail@gmail.com

# EmailJS (optional — for application notifications)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_APPLICATION=
VITE_EMAILJS_TEMPLATE_JOB_ALERT=
VITE_EMAILJS_PUBLIC_KEY=
```

---

## Vercel Deployment

1. Push to GitHub under `karaikudiannalakshmi/nagarathar-jobs`
2. Import project at [vercel.com](https://vercel.com)
3. Framework: **Vite**
4. Add all `VITE_*` env vars in Vercel → Settings → Environment Variables
5. Deploy ✓

The `vercel.json` handles SPA routing automatically.

---

## EmailJS Setup (for notifications)

1. Sign up at [emailjs.com](https://emailjs.com)
2. Create a Service (Gmail)
3. Create two templates:

**Template: Application Received** (`VITE_EMAILJS_TEMPLATE_APPLICATION`)
```
Subject: New Application for {{job_title}}

Hi {{poster_name}},

{{applicant_name}} has applied for your job posting "{{job_title}}".
Their email: {{applicant_email}}

Log in to Nagarathar Jobs to review the application.
```

**Template: Job Alert** (`VITE_EMAILJS_TEMPLATE_JOB_ALERT`)
```
Subject: New Job: {{job_title}} at {{company}}

Hi {{candidate_name}},

A new job matching your profile has been posted:

{{job_title}} at {{company}}
Location: {{location}}

View job: {{job_url}}
```

4. Copy Service ID, Template IDs, and Public Key into `.env.local`

---

## Firestore Data Structure

```
nj_users/{uid}
  displayName, email, kovil, pirivu, phone, city
  bio, skills[], resumeText, industry, linkedinUrl
  lookingFor: 'job' | 'hire' | 'both'
  role: 'member' | 'admin'
  createdAt

nj_jobs/{jobId}
  title, company, location, type, industry
  experience, salary, description, requirements
  skills[], contactEmail, contactPhone
  postedBy (uid), postedByName, postedByEmail, postedByKovil
  status: 'active' | 'closed'
  views, applicants
  createdAt

nj_applications/{appId}
  jobId, jobTitle, jobCompany
  posterUid, posterEmail
  applicantUid, applicantName, applicantEmail, applicantPhone
  coverLetter
  status: 'pending' | 'shortlisted' | 'rejected' | 'hired'
  createdAt
```

---

## Admin Access

Set `VITE_ADMIN_EMAILS` to comma-separated Gmail addresses.  
Admins see the **Admin** nav link and can:
- View platform stats
- Close / reopen / delete any job
- Update application statuses
- Browse all registered users

---

## Roadmap

- [ ] WhatsApp notification via Twilio/WATI
- [ ] 74-village Kovil dropdown (complete list)
- [ ] Resume PDF upload (Firebase Storage)
- [ ] Saved jobs / bookmarks
- [ ] Employer company profiles
- [ ] SMS OTP verification for members
- [ ] Job expiry (auto-close after 60 days)
