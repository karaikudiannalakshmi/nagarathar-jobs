// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { KOVILS, INDUSTRIES, EDUCATION_LEVELS, SALARY_RANGES, GENDER_OPTIONS } from '../utils/constants'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

// Step indicator
function Steps({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < current ? 'var(--green)' : i === current ? 'var(--gold)' : 'var(--border)',
              color: i <= current ? 'white' : 'var(--muted)',
            }}>{i < current ? '✓' : i + 1}</div>
            <span style={{ fontSize: 10, color: i === current ? 'var(--gold)' : 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 40, height: 1, background: 'var(--border)', margin: '0 6px 16px' }} />}
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const { registerEmail, loginGoogle } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // role: null → 'candidate' | 'employer'
  const [role, setRole]     = useState(null)
  const [step, setStep]     = useState(0)   // 0=choose, 1=account, 2=profile, 3=details(candidate only)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Shared fields
  const [form, setForm] = useState({
    // Account
    displayName: '', email: '', password: '', confirm: '',
    // Community
    kovil: '', pirivu: '', phone: '', city: '', gender: '',
    // Candidate specific
    industry: '', currentQualification: '', workExperience: '',
    currentSalary: '', expectedSalary: '', preferredLocation: '',
    resumeText: '', skills: [],
    // Employer specific
    companyName: '', companyIndustry: '', designation: '',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Role selection ──────────────────────────────────────────────────────
  function handleRoleSelect(r) {
    setRole(r); setStep(1); setError('')
  }

  // ── Google login ────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError(''); setLoading(true)
    try { await loginGoogle(); navigate('/jobs') }
    catch (err) { if (err.code !== 'auth/popup-closed-by-user') setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Step 1: Account validation ──────────────────────────────────────────
  function handleStep1(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setStep(2)
  }

  // ── Step 2: Community profile → for employers this is final ────────────
  function handleStep2(e) {
    e.preventDefault()
    setError('')
    if (role === 'candidate') { setStep(3) }
    else { handleSubmit() }
  }

  // ── Final submit ────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setError(''); setLoading(true)
    try {
      const extra = role === 'candidate' ? {
        lookingFor:           'job',
        kovil:                form.kovil,
        pirivu:               form.pirivu,
        phone:                form.phone,
        city:                 form.city,
        gender:               form.gender,
        industry:             form.industry,
        currentQualification: form.currentQualification,
        workExperience:       form.workExperience,
        currentSalary:        form.currentSalary,
        expectedSalary:       form.expectedSalary,
        preferredLocation:    form.preferredLocation,
        resumeText:           form.resumeText,
        skills:               form.skills,
      } : {
        lookingFor:        'hire',
        kovil:             form.kovil,
        pirivu:            form.pirivu,
        phone:             form.phone,
        city:              form.city,
        gender:            form.gender,
        companyName:       form.companyName,
        industry:          form.companyIndustry,
        designation:       form.designation,
      }
      await registerEmail(form.email, form.password, form.displayName, extra)
      navigate('/jobs')
    } catch (err) {
      console.error('Registration error:', err)
      const msg = friendlyError(err.code) || err.message || 'Registration failed. Please try again.'
      setError(msg)
      if (err.code?.startsWith('auth/')) setStep(1)
    } finally { setLoading(false) }
  }

  const candidateSteps = ['Account', 'Community', 'Profile']
  const employerSteps  = ['Account', 'Details']

  return (
    <div style={S.wrap}>
      <div style={{ ...S.card, maxWidth: step === 3 ? 560 : 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 6 }}>𓃵</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.9rem' }}>
            Join Nagarathar Jobs
          </h1>
          {role && (
            <div style={{ marginTop: 8 }}>
              <span style={{ ...S.roleBadge, background: role === 'candidate' ? '#E8F5EE' : '#E8EEF5', color: role === 'candidate' ? 'var(--green)' : 'var(--blue)' }}>
                {role === 'candidate' ? '🔍 Job Seeker' : '💼 Employer'}
              </span>
              {step === 1 && <button onClick={() => { setRole(null); setStep(0); setError('') }} style={S.changeRole}>Change</button>}
            </div>
          )}
        </div>

        {/* Step indicator */}
        {role === 'candidate' && step > 0 && <Steps steps={candidateSteps} current={step - 1} />}
        {role === 'employer'  && step > 0 && <Steps steps={employerSteps}  current={step - 1} />}

        {error && <div className="alert alert-error">{error}</div>}

        {/* ══ STEP 0: Choose Role ══ */}
        {step === 0 && (
          <div>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '15px', marginBottom: 24 }}>
              I am joining as a…
            </p>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
              <button onClick={() => handleRoleSelect('candidate')} style={S.roleCard}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Job Seeker</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  I am looking for employment opportunities within the Nagarathar community
                </div>
              </button>
              <button onClick={() => handleRoleSelect('employer')} style={S.roleCard}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💼</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Employer</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  I want to post jobs and find talented Nagarathar candidates
                </div>
              </button>
            </div>
            <div style={S.divider}>
              <div style={S.divLine}/><span style={S.divText}>or sign up with Google</span><div style={S.divLine}/>
            </div>
            <button onClick={handleGoogle} disabled={loading} style={S.googleBtn}>
              <GoogleIcon /> Continue with Google
            </button>
            <p style={{ textAlign: 'center', fontSize: '14px', marginTop: 20, color: 'var(--muted)' }}>
              Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ══ STEP 1: Account ══ */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <button type="button" onClick={handleGoogle} disabled={loading} style={{ ...S.googleBtn, marginBottom: 16 }}>
              <GoogleIcon /> Sign up with Google
            </button>
            <div style={S.divider}>
              <div style={S.divLine}/><span style={S.divText}>or register with email</span><div style={S.divLine}/>
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-control" value={form.displayName} onChange={set('displayName')} required placeholder="e.g. Arunachalam Chettiar" />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input className="form-control" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input className="form-control" type="password" value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input className="form-control" type="password" value={form.confirm} onChange={set('confirm')} required placeholder="Repeat password" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setStep(0); setError('') }}>← Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '11px' }}>Continue →</button>
            </div>
          </form>
        )}

        {/* ══ STEP 2: Community Profile (both) ══ */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div className="grid-2">
              <div className="form-group">
                <label>Kovil (Clan)</label>
                <select className="form-control" value={form.kovil} onChange={set('kovil')}>
                  <option value="">Select Kovil</option>
                  {KOVILS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Pirivu</label>
                <input className="form-control" value={form.pirivu} onChange={set('pirivu')} placeholder="Optional" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98XXX XXXXX" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input className="form-control" value={form.city} onChange={set('city')} placeholder="Chennai, Karaikudi…" />
              </div>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" value={form.gender} onChange={set('gender')}>
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Employer extra fields in step 2 */}
            {role === 'employer' && (
              <>
                <div className="section-divider" />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>Company Details</div>
                <div className="form-group">
                  <label>Company / Business Name *</label>
                  <input className="form-control" value={form.companyName} onChange={set('companyName')} required={role === 'employer'} placeholder="Your company or business name" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Industry</label>
                    <select className="form-control" value={form.companyIndustry} onChange={set('companyIndustry')}>
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Your Designation</label>
                    <input className="form-control" value={form.designation} onChange={set('designation')} placeholder="e.g. Owner, Manager, HR" />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setStep(1); setError('') }}>← Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center', padding: '11px' }}>
                {role === 'employer' ? (loading ? 'Creating…' : '🎉 Create Account') : 'Continue →'}
              </button>
            </div>
          </form>
        )}

        {/* ══ STEP 3: Candidate Professional Details ══ */}
        {step === 3 && role === 'candidate' && (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>
              Professional Details
            </div>

            <div className="form-group">
              <label>Current Qualification</label>
              <select className="form-control" value={form.currentQualification} onChange={set('currentQualification')}>
                <option value="">Select Qualification</option>
                {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Work Experience</label>
                <select className="form-control" value={form.workExperience} onChange={set('workExperience')}>
                  <option value="">Select Experience</option>
                  <option value="Fresher">Fresher / No experience</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1–2 years</option>
                  <option value="2-5 years">2–5 years</option>
                  <option value="5-10 years">5–10 years</option>
                  <option value="10-15 years">10–15 years</option>
                  <option value="15+ years">15+ years</option>
                </select>
              </div>
              <div className="form-group">
                <label>Industry / Field</label>
                <select className="form-control" value={form.industry} onChange={set('industry')}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Current Salary</label>
                <select className="form-control" value={form.currentSalary} onChange={set('currentSalary')}>
                  <option value="">Select Range</option>
                  {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Expected Salary</label>
                <select className="form-control" value={form.expectedSalary} onChange={set('expectedSalary')}>
                  <option value="">Select Range</option>
                  {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Preferred Job Location</label>
              <input className="form-control" value={form.preferredLocation} onChange={set('preferredLocation')} placeholder="e.g. Chennai, Remote, Any Location" />
            </div>

            <div className="form-group">
              <label>Resume / Professional Summary <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="form-control" rows={4} value={form.resumeText} onChange={set('resumeText')}
                placeholder="Briefly describe your experience, skills, and what you are looking for…" style={{ minHeight: 100 }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setStep(2); setError('') }}>← Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center', padding: '11px' }}>
                {loading ? 'Creating account…' : '🎉 Create Account'}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: 12 }}>
              You can always update these details later from your profile.
            </p>
          </form>
        )}

        {step > 0 && (
          <p style={{ textAlign: 'center', fontSize: '14px', marginTop: 20, color: 'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in instead.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password should be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  }
  return map[code] || null
}

const S = {
  wrap: { display: 'flex', justifyContent: 'center', padding: '40px 16px 80px', minHeight: 'calc(100vh - 100px)' },
  card: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px', width: '100%', boxShadow: 'var(--shadow-md)' },
  roleCard: {
    flex: 1, padding: '24px 16px', borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--border)', background: 'var(--ivory)',
    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  },
  roleBadge: { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: '13px', fontWeight: 600, marginTop: 4 },
  changeRole: { background: 'none', border: 'none', color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', marginLeft: 8, textDecoration: 'underline' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 20px', border: '1.5px solid #dadce0', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer', fontSize: '15px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: 'var(--charcoal)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' },
  divLine: { flex: 1, height: 1, background: 'var(--border)' },
  divText: { fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' },
}
