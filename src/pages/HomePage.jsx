// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>For the Nagarathar Community</div>
          <h1 style={styles.heroTitle}>
            Connect Talent with<br />
            <em style={{ color: 'var(--gold)' }}>Opportunity</em>
          </h1>
          <p style={styles.heroDesc}>
            A trusted employment exchange exclusively for the Nagarathar community —
            find jobs, discover talent, and strengthen our network.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link to="/jobs"     className="btn btn-primary btn-lg">Browse Jobs</Link>
                <Link to="/post-job" className="btn btn-outline btn-lg">Post a Job</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Join the Community</Link>
                <Link to="/login"    className="btn btn-outline btn-lg">Sign In</Link>
              </>
            )}
          </div>
        </div>
        <div style={styles.heroPattern} aria-hidden="true">
          <svg viewBox="0 0 300 300" width="300" height="300" opacity="0.06">
            {[...Array(6)].map((_,i) => (
              <polygon key={i}
                points="150,10 290,75 290,225 150,290 10,225 10,75"
                fill="none" stroke="#B8860B" strokeWidth="1.5"
                transform={`scale(${1 - i*0.12}) translate(${150*i*0.12/1}, ${150*i*0.12/1})`}
                style={{ transformOrigin: '150px 150px' }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.statsInner}>
          {[
            { n: '74', label: 'Villages Represented' },
            { n: '∞', label: 'Opportunities' },
            { n: '🤝', label: 'Community First' },
          ].map(s => (
            <div key={s.label} style={styles.stat}>
              <div style={styles.statNum}>{s.n}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="page" style={{ paddingTop: 60 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>How It Works</h2>
          <p style={{ color: 'var(--muted)' }}>Three simple steps to connect our community</p>
        </div>
        <div className="grid-3">
          {[
            { icon: '👤', title: 'Create Your Profile', desc: 'Register as a Nagarathar member. Add your skills, experience, and what you\'re looking for.' },
            { icon: '📋', title: 'Post or Browse Jobs', desc: 'Employers post opportunities. Job seekers browse and apply with a single click.' },
            { icon: '🤝', title: 'Connect & Grow', desc: 'Get notified of matches. Connect directly. Build the community together.' },
          ].map(f => (
            <div key={f.title} className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!user && (
          <div style={styles.cta}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Ready to get started?</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Join hundreds of Nagarathar professionals already on the platform.</p>
            <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #FBF7EE 0%, #F5E9C8 100%)',
    borderBottom: '1px solid var(--border)',
    padding: '80px 20px',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  heroContent: { maxWidth: 580, position: 'relative', zIndex: 1 },
  badge: {
    display: 'inline-block',
    padding: '4px 14px', borderRadius: 20,
    background: 'var(--white)', border: '1px solid var(--gold)',
    color: 'var(--gold)', fontSize: '12px', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
    fontWeight: 700, lineHeight: 1.15,
    marginBottom: 20, color: 'var(--charcoal)',
  },
  heroDesc: { fontSize: '1.05rem', color: 'var(--slate)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 },
  heroPattern: { position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  statsBar: { background: 'var(--charcoal)', padding: '24px 20px' },
  statsInner: {
    maxWidth: 700, margin: '0 auto',
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    flexWrap: 'wrap', gap: 20,
  },
  stat: { textAlign: 'center' },
  statNum: { fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', color: 'var(--gold)', fontWeight: 700 },
  statLabel: { fontSize: '13px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.06em' },
  cta: {
    margin: '64px auto 0', textAlign: 'center',
    padding: '48px', background: 'var(--white)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  },
}
