// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { KOVILS } from '../utils/constants'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

export default function RegisterPage() {
  const { registerEmail, loginGoogle } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)   // 1 = account, 2 = community profile
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    displayName: '', email: '', password: '', confirm: '',
    kovil: '', pirivu: '', phone: '', city: '',
    lookingFor: 'job',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleGoogle() {
    setError(''); setLoading(true)
    try {
      await loginGoogle()
      navigate('/jobs')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message)
    } finally { setLoading(false) }
  }

  function handleStep1(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await registerEmail(form.email, form.password, form.displayName, {
        kovil: form.kovil, pirivu: form.pirivu,
        phone: form.phone, city: form.city,
        lookingFor: form.lookingFor,
      })
      navigate('/jobs')
    } catch (err) {
      setError(friendlyError(err.code))
      setStep(1)
    } finally { setLoading(false) }
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>𓃵</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.9rem' }}>Join Nagarathar Jobs</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 4 }}>
            {step === 1 ? 'Create your account' : 'Tell us about yourself'}
          </p>
        </div>

        {/* Step 1 only: Google signup option */}
        {step === 1 && (
          <>
            <button onClick={handleGoogle} disabled={loading} style={S.googleBtn}>
              <GoogleIcon />
              Sign up with Google
            </button>
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={S.dividerText}>or register with email</span>
              <div style={S.dividerLine} />
            </div>
          </>
        )}

        {/* Step indicator (step 2 only) */}
        {step === 2 && (
          <div style={S.steps}>
            <StepDot n={1} active={step >= 1} done={step > 1} label="Account" />
            <div style={S.stepLine} />
            <StepDot n={2} active={step >= 2} done={false} label="Profile" />
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Step 1: Account details ── */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={form.displayName}
                onChange={set('displayName')} required placeholder="e.g. Arunachalam Chettiar" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-control" type="email" value={form.email}
                onChange={set('email')} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" value={form.password}
                onChange={set('password')} required placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className="form-control" type="password" value={form.confirm}
                onChange={set('confirm')} required placeholder="Repeat password" />
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '15px' }}>
              Continue →
            </button>
          </form>
        )}

        {/* ── Step 2: Community profile ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
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
                <input className="form-control" value={form.pirivu}
                  onChange={set('pirivu')} placeholder="Optional" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" type="tel" value={form.phone}
                  onChange={set('phone')} placeholder="+91 98XXX XXXXX" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input className="form-control" value={form.city}
                  onChange={set('city')} placeholder="Chennai, Karaikudi…" />
              </div>
            </div>
            <div className="form-group">
              <label>I am here to…</label>
              <select className="form-control" value={form.lookingFor} onChange={set('lookingFor')}>
                <option value="job">Find a Job / Opportunity</option>
                <option value="hire">Hire / Post Jobs</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setStep(1); setError('') }}>
                ← Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ flex: 2, justifyContent: 'center', padding: '11px' }}>
                {loading ? 'Creating account…' : '🎉 Create Account'}
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '14px', marginTop: 20, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function StepDot({ n, active, done, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', fontSize: '13px', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--green)' : active ? 'var(--gold)' : 'var(--border)',
        color: active || done ? 'white' : 'var(--muted)',
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: '11px', color: active ? 'var(--gold)' : 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password should be at least 6 characters.',
  }
  return map[code] || 'Registration failed. Please try again.'
}

const S = {
  wrap: {
    display: 'flex', justifyContent: 'center',
    padding: '48px 16px 80px', minHeight: 'calc(100vh - 100px)',
  },
  card: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '40px',
    width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)',
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', padding: '11px 20px',
    border: '1.5px solid #dadce0', borderRadius: 'var(--radius)',
    background: 'var(--white)', cursor: 'pointer',
    fontSize: '15px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    color: 'var(--charcoal)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.15s',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' },
  steps: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 },
  stepLine: { width: 60, height: 1, background: 'var(--border)', margin: '0 8px 20px' },
}
