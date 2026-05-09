// src/components/Layout.jsx
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

export default function Layout() {
  const { user, profile, isAdmin, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() { await logout(); navigate('/') }

  const active = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={S.nav}>
        <div style={S.navInner}>
          <Link to="/" style={S.logo}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>𓃵</span>
            <span>
              <div style={S.logoMain}>Nagarathar Jobs</div>
              <div style={S.logoSub}>Community Employment Exchange</div>
            </span>
          </Link>

          {user && (
            <div style={S.navLinks} className="nav-links-desktop">
              <NavLink to="/jobs"       active={active('/jobs')}>Browse Jobs</NavLink>
              <NavLink to="/candidates" active={active('/candidates')}>Candidates</NavLink>
              <NavLink to="/post-job"   active={active('/post-job')}>Post a Job</NavLink>
              {isAdmin && <NavLink to="/admin"   active={active('/admin')}>Admin</NavLink>}
              {isAdmin && <NavLink to="/reports" active={active('/reports')}>Reports</NavLink>}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <Link to="/profile" style={S.userChip}>
                  <span style={S.avatar}>
                    {profile?.photoURL
                      ? <img src={profile.photoURL} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      : (profile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?')}
                  </span>
                  <span style={S.userName} className="hide-mobile">
                    {profile?.displayName?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm hide-mobile">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join</Link>
              </>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} style={S.hamburger} className="show-mobile">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && user && (
          <div style={S.mobileMenu}>
            {[
              ['/jobs',       'Browse Jobs'],
              ['/candidates', 'Candidates'],
              ['/post-job',   'Post a Job'],
              ['/profile',    'My Profile'],
              ...(isAdmin ? [['/admin', 'Admin'], ['/reports', 'Reports']] : []),
            ].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={S.mobileLink}>{label}</Link>
            ))}
            <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="btn btn-ghost btn-sm" style={{ margin: '8px 16px' }}>Sign Out</button>
          </div>
        )}
      </nav>

      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--gold-pale), var(--gold), var(--gold-pale))' }} />

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={S.footer}>
        <div style={S.footerInner}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', color: 'var(--gold)' }}>𓃵 Nagarathar Jobs</span>
          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Serving the Nagarathar community</span>
        </div>
      </footer>

      <style>{`
        .nav-links-desktop { display: flex; align-items: center; gap: 4px; }
        .hide-mobile {}
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      padding: '6px 14px', borderRadius: 'var(--radius)',
      fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s',
      color: active ? 'var(--gold)' : 'var(--slate)',
      background: active ? 'var(--gold-pale)' : 'transparent',
    }}>{children}</Link>
  )
}

const S = {
  nav: { background: 'var(--white)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' },
  navInner: { maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' },
  logoMain: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--charcoal)', lineHeight: 1.2 },
  logoSub: { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 4 },
  userChip: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', border: '1.5px solid var(--border)', borderRadius: 40, textDecoration: 'none', color: 'var(--charcoal)' },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, overflow: 'hidden', flexShrink: 0 },
  userName: { fontSize: '13px', fontWeight: 500 },
  hamburger: { background: 'none', border: 'none', fontSize: '20px', color: 'var(--charcoal)', padding: '4px 8px', borderRadius: 4 },
  mobileMenu: { borderTop: '1px solid var(--border)', background: 'var(--white)', paddingBottom: 8 },
  mobileLink: { display: 'block', padding: '12px 20px', color: 'var(--charcoal)', fontWeight: 500, fontSize: '15px', textDecoration: 'none', borderBottom: '1px solid var(--border)' },
  footer: { background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '20px' },
  footerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
}
