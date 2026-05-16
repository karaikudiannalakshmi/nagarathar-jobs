// src/components/OnboardingTour.jsx
// Animated walkthrough shown on first login — different for candidate vs employer
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const CANDIDATE_STEPS = [
  {
    icon: '🙏',
    title: 'Welcome to Nagarathar Jobs!',
    subtitle: 'Your community employment exchange',
    desc: 'This is an exclusive platform for the Nagarathar community — connecting job seekers and employers within our trusted network.',
    visual: <WelcomeVisual />,
    tip: null,
  },
  {
    icon: '👤',
    title: 'Step 1: Complete Your Profile',
    subtitle: 'The more you share, the better your matches',
    desc: 'Add your Kovil, industry, skills, experience, and expected salary. Employers search by these fields to find the right candidate.',
    visual: <ProfileVisual />,
    tip: 'Profiles with skills and industry get 5x more views',
    action: { label: '✏️ Complete My Profile', to: '/profile' },
  },
  {
    icon: '✨',
    title: 'Step 2: See Your Job Matches',
    subtitle: 'Jobs matched to your profile automatically',
    desc: 'Your dashboard shows jobs that match your industry and skills. No need to search — relevant jobs come to you.',
    visual: <MatchVisual type="jobs" />,
    tip: 'New matches appear every time an employer posts a job',
  },
  {
    icon: '📨',
    title: 'Step 3: Apply with One Click',
    subtitle: 'Simple, fast, community-trusted',
    desc: 'Click Apply Now on any job. Add a short message if you like. The employer gets notified instantly and can contact you directly.',
    visual: <ApplyVisual />,
    tip: 'You can track all your applications in your dashboard',
  },
  {
    icon: '🔔',
    title: 'Stay Connected',
    subtitle: 'We keep you updated automatically',
    desc: 'You will receive email alerts when:\n• A new job matches your profile\n• An employer shortlists you\n• Your application status changes\n• Every Monday — a digest of new opportunities',
    visual: <NotifyVisual type="candidate" />,
    tip: null,
  },
]

const EMPLOYER_STEPS = [
  {
    icon: '🙏',
    title: 'Welcome to Nagarathar Jobs!',
    subtitle: 'Your community employment exchange',
    desc: 'Find trusted Nagarathar talent for your business. Every candidate on this platform is from our community network.',
    visual: <WelcomeVisual />,
    tip: null,
  },
  {
    icon: '🏢',
    title: 'Step 1: Complete Your Profile',
    subtitle: 'Candidates trust verified employers',
    desc: 'Add your company name, industry, and designation. Candidates are more likely to apply when they can see who is hiring.',
    visual: <ProfileVisual employer />,
    tip: 'Complete profiles get 3x more applications',
    action: { label: '✏️ Complete My Profile', to: '/profile' },
  },
  {
    icon: '💼',
    title: 'Step 2: Post a Job',
    subtitle: 'Reach the right candidates instantly',
    desc: 'Fill in job title, skills required, salary range, and location. As soon as you publish — matching candidates get email notifications automatically.',
    visual: <PostJobVisual />,
    tip: 'Adding required skills improves match quality significantly',
    action: { label: '+ Post a Job', to: '/post-job' },
  },
  {
    icon: '👥',
    title: 'Step 3: See Matching Candidates',
    subtitle: 'Community-vetted talent, ready to connect',
    desc: 'Your dashboard shows candidates whose industry and skills match your job. You can contact them directly by email — no middlemen.',
    visual: <MatchVisual type="candidates" />,
    tip: 'Browse the Candidates page to see full profiles and resumes',
  },
  {
    icon: '🔔',
    title: 'Stay Connected',
    subtitle: 'We keep you updated automatically',
    desc: 'You will receive email alerts when:\n• A candidate applies to your job\n• A new candidate matches your job profile\n• Every Monday — new candidates who joined that week',
    visual: <NotifyVisual type="employer" />,
    tip: null,
  },
]

// ── Visual components ──────────────────────────────────────────────────────
function WelcomeVisual() {
  return (
    <div style={V.box}>
      <img src="/logo.png" alt="Nagarathar Jobs" style={{ height: 80, width: 'auto', marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(184,134,11,0.3))' }} />
      <div style={{ fontSize: '13px', color: '#8A7060', marginTop: 4 }}>Community Employment Exchange</div>
      <div style={{ display: 'flex', gap: 20, marginTop: 20, justifyContent: 'center' }}>
        {[['60+', 'Members'], ['7', 'Active Jobs'], ['74', 'Villages']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#B8860B', fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: '11px', color: '#8A7060', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileVisual({ employer }) {
  return (
    <div style={V.box}>
      <div style={V.mockCard}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={V.avatar}>A</div>
          <div>
            <div style={V.mockTitle}>Annamalai Chettiar</div>
            <div style={V.mockSub}>Ilayathakudi Kovil · Chennai</div>
          </div>
        </div>
        {employer ? (
          <>
            <MockField label="Company" value="Saishan Business" filled />
            <MockField label="Industry" value="Banking & Finance" filled />
            <MockField label="Designation" value="Owner" filled />
          </>
        ) : (
          <>
            <MockField label="Industry" value="Banking & Finance" filled />
            <MockField label="Skills" value="Accounting, Tally, GST" filled />
            <MockField label="Expected Salary" value="₹20,000 – ₹35,000" filled />
            <MockField label="Experience" value="5–10 years" filled />
          </>
        )}
        <div style={{ marginTop: 10, height: 6, background: '#E8D5B8', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '85%', background: '#B8860B', borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: '11px', color: '#B8860B', marginTop: 4, textAlign: 'right' }}>85% complete ✓</div>
      </div>
    </div>
  )
}

function MatchVisual({ type }) {
  const items = type === 'jobs' ? [
    { title: 'Accountant', company: 'Saishan Business', badge: '✨ Match', color: '#1A6B3C' },
    { title: 'CRM Executive', company: 'Innovative Homes', badge: '✨ Match', color: '#1A6B3C' },
    { title: 'Art and Craft', company: 'Valli Arts', badge: 'Browse', color: '#8A7060' },
  ] : [
    { title: 'Annamalai C.', company: 'Banking · 5 yrs', badge: '✨ Match', color: '#1A6B3C' },
    { title: 'Meenakshi K.', company: 'Finance · 3 yrs', badge: '✨ Match', color: '#1A6B3C' },
    { title: 'Saravan R.', company: 'IT · Fresher', badge: 'Browse', color: '#8A7060' },
  ]
  return (
    <div style={V.box}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {items.map((item, i) => (
          <div key={i} style={{ ...V.mockCard, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#2C1810' }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: '#8A7060' }}>{item.company}</div>
            </div>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: 10, background: `${item.color}20`, color: item.color, fontWeight: 600 }}>
              {item.badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PostJobVisual() {
  return (
    <div style={V.box}>
      <div style={V.mockCard}>
        <div style={V.mockTitle}>Post a Job</div>
        <MockField label="Job Title" value="Senior Accountant" filled />
        <MockField label="Company" value="Saishan Business" filled />
        <MockField label="Skills" value="Tally, GST, Accounting" filled />
        <MockField label="Salary" value="₹20,000 – ₹35,000/month" filled />
        <div style={{ marginTop: 14, padding: '8px 16px', background: '#B8860B', color: 'white', borderRadius: 6, fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
          🚀 Publish Job → Candidates Notified!
        </div>
      </div>
    </div>
  )
}

function ApplyVisual() {
  return (
    <div style={V.box}>
      <div style={V.mockCard}>
        <div style={V.mockTitle}>Apply for Accountant</div>
        <div style={{ fontSize: '12px', color: '#8A7060', marginBottom: 10 }}>Applying as: Annamalai Chettiar</div>
        <div style={{ background: '#FAF7F0', border: '1px solid #E8D5B8', borderRadius: 6, padding: '8px 10px', fontSize: '12px', color: '#5A4A3A', marginBottom: 12, lineHeight: 1.5 }}>
          "I have 8 years of experience in accounts and banking. I am proficient in Tally and GST filing…"
        </div>
        <div style={{ padding: '8px 16px', background: '#B8860B', color: 'white', borderRadius: 6, fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
          ✓ Application Submitted!
        </div>
        <div style={{ fontSize: '11px', color: '#1A6B3C', textAlign: 'center', marginTop: 8 }}>
          Employer notified instantly via email
        </div>
      </div>
    </div>
  )
}

function NotifyVisual({ type }) {
  const items = type === 'candidate' ? [
    { icon: '✨', text: 'New job matches your profile', time: 'Now' },
    { icon: '⭐', text: 'Employer shortlisted you!', time: '2h ago' },
    { icon: '📅', text: 'Interview invitation received', time: 'Yesterday' },
    { icon: '📋', text: 'Weekly job digest — 3 new jobs', time: 'Monday' },
  ] : [
    { icon: '📨', text: 'New application for Accountant', time: 'Now' },
    { icon: '✨', text: 'New matching candidate joined', time: '1h ago' },
    { icon: '👥', text: '5 candidates match your CRM job', time: 'Yesterday' },
    { icon: '📋', text: 'Weekly digest — 8 new candidates', time: 'Monday' },
  ]
  return (
    <div style={V.box}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {items.map((item, i) => (
          <div key={i} style={{ ...V.mockCard, padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: '12px', color: '#2C1810' }}>{item.text}</span>
            <span style={{ fontSize: '11px', color: '#8A7060' }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockField({ label, value, filled }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '10px', color: '#8A7060', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '12px', padding: '5px 8px', background: filled ? '#FAF7F0' : '#F5F5F5', border: `1px solid ${filled ? '#E8D5B8' : '#E0E0E0'}`, borderRadius: 4, color: filled ? '#2C1810' : '#BDBDBD' }}>
        {filled ? value : 'Not filled…'}
      </div>
    </div>
  )
}

const V = {
  box: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '8px 0' },
  mockCard: { background: 'white', border: '1px solid #E8D5B8', borderRadius: 12, padding: '16px', width: '100%', boxShadow: '0 2px 12px rgba(184,134,11,0.1)' },
  mockTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 700, color: '#2C1810', marginBottom: 12 },
  mockSub: { fontSize: '12px', color: '#B8860B' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#B8860B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
}

// ── Main Tour Component ────────────────────────────────────────────────────
export default function OnboardingTour({ role, onComplete }) {
  const steps = role === 'employer' ? EMPLOYER_STEPS : CANDIDATE_STEPS
  const [step, setStep]       = useState(0)
  const [animating, setAnim]  = useState(false)

  function goNext() {
    if (step >= steps.length - 1) { onComplete(); return }
    setAnim(true)
    setTimeout(() => { setStep(s => s + 1); setAnim(false) }, 250)
  }
  function goPrev() {
    if (step === 0) return
    setAnim(true)
    setTimeout(() => { setStep(s => s - 1); setAnim(false) }, 250)
  }

  const current = steps[step]
  const isLast  = step === steps.length - 1

  return (
    <div style={T.overlay}>
      <div style={T.modal}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? '#B8860B' : '#E8D5B8',
              cursor: 'pointer', transition: 'all 0.3s ease',
            }}/>
          ))}
        </div>

        {/* Content */}
        <div style={{ ...T.content, opacity: animating ? 0 : 1, transition: 'opacity 0.25s ease' }}>
          {/* Visual area */}
          <div style={T.visual}>
            {current.visual}
          </div>

          {/* Text */}
          <div style={T.text}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{current.icon}</div>
            <h2 style={T.title}>{current.title}</h2>
            <p style={T.subtitle}>{current.subtitle}</p>
            <p style={T.desc}>{current.desc}</p>

            {current.tip && (
              <div style={T.tip}>
                💡 {current.tip}
              </div>
            )}

            {current.action && (
              <Link to={current.action.to} onClick={onComplete}
                className="btn btn-outline btn-sm" style={{ marginTop: 12, display: 'inline-block' }}>
                {current.action.label}
              </Link>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={T.nav}>
          <button onClick={goPrev} disabled={step === 0}
            className="btn btn-ghost btn-sm" style={{ opacity: step === 0 ? 0 : 1 }}>
            ← Back
          </button>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {step + 1} of {steps.length}
          </span>
          <button onClick={goNext} className="btn btn-primary btn-sm">
            {isLast ? '🚀 Get Started!' : 'Next →'}
          </button>
        </div>

        {/* Skip */}
        <button onClick={onComplete} style={T.skip}>
          Skip tour
        </button>
      </div>
    </div>
  )
}

const T = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,24,16,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' },
  modal: { background: 'var(--ivory)', borderRadius: 20, padding: '32px', maxWidth: 760, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  content: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center', marginBottom: 24 },
  visual: { background: 'var(--gold-pale)', borderRadius: 16, padding: '24px', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  text: { display: 'flex', flexDirection: 'column' },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.7rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4, lineHeight: 1.2 },
  subtitle: { fontSize: '14px', color: 'var(--gold)', fontWeight: 600, marginBottom: 12 },
  desc: { fontSize: '14px', color: 'var(--slate)', lineHeight: 1.75, whiteSpace: 'pre-line' },
  tip: { marginTop: 14, padding: '10px 14px', background: 'var(--white)', border: '1px solid var(--gold)', borderRadius: 8, fontSize: '13px', color: 'var(--gold)', fontWeight: 500 },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  skip: { display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' },
}
