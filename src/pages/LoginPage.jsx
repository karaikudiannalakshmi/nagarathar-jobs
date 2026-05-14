// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

export default function LoginPage() {
  const { loginEmail, loginGoogle } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleEmail(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const u = await loginEmail(email, password)
      // Admin emails redirect to admin dashboard
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'slnaiyar@gmail.com').split(',').map(e => e.trim())
      navigate(adminEmails.includes(u.email) ? '/admin' : '/jobs')
    }
    catch (err) { setError(friendlyError(err.code)) }
    finally { setLoading(false) }
  }

  async function handleGoogle() {
    setError(''); setLoading(true)
    try {
      const u = await loginGoogle()
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'slnaiyar@gmail.com').split(',').map(e => e.trim())
      navigate(adminEmails.includes(u.email) ? '/admin' : '/jobs')
    }
    catch (err) { if (err.code !== 'auth/popup-closed-by-user') setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:'2.2rem', marginBottom:6 }}>𓃵</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'2rem' }}>{t('login','title')}</h1>
          <p style={{ color:'var(--muted)', fontSize:'14px', marginTop:4 }}>{t('login','subtitle')}</p>
        </div>

        <button onClick={handleGoogle} disabled={loading} style={S.googleBtn}>
          <GoogleIcon />{t('login','googleBtn')}
        </button>

        <div style={S.divider}>
          <div style={S.divLine}/><span style={S.divText}>{t('login','orEmail')}</span><div style={S.divLine}/>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleEmail}>
          <div className="form-group">
            <label>{t('login','emailLabel')}</label>
            <input className="form-control" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"/>
          </div>
          <div className="form-group">
            <label>{t('login','passwordLabel')}</label>
            <input className="form-control" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password"/>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:'15px' }}>
            {loading ? t('login','signingIn') : t('login','signInBtn')}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:'14px', marginTop:20, color:'var(--muted)' }}>
          {t('login','noAccount')}{' '}
          <Link to="/register" style={{ fontWeight:600 }}>{t('login','createAccount')}</Link>
        </p>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-not-found':     'No account with this email.',
    'auth/wrong-password':     'Incorrect password.',
    'auth/too-many-requests':  'Too many attempts — please wait.',
  }
  return map[code] || 'Sign-in failed. Please try again.'
}

const S = {
  wrap: { display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'60px 16px', minHeight:'calc(100vh - 100px)' },
  card: { background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'40px', width:'100%', maxWidth:440, boxShadow:'var(--shadow-md)' },
  googleBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'11px 20px', border:'1.5px solid #dadce0', borderRadius:'var(--radius)', background:'var(--white)', cursor:'pointer', fontSize:'15px', fontFamily:"'DM Sans', sans-serif", fontWeight:500, color:'var(--charcoal)', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' },
  divider: { display:'flex', alignItems:'center', gap:10, margin:'22px 0' },
  divLine: { flex:1, height:1, background:'var(--border)' },
  divText: { fontSize:'12px', color:'var(--muted)', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.05em' },
}
