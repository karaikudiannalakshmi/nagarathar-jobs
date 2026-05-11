// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'

// ── Design tokens matching Gamma presentation ─────────────────────────────
const C = {
  coral:      '#C0392B',
  coralLight: '#E74C3C',
  coralPale:  '#FADBD8',
  coralBg:    '#C0392B',
  dark:       '#1A1A1A',
  slate:      '#3D3D3D',
  muted:      '#777',
  white:      '#FFFFFF',
  offWhite:   '#FAFAFA',
  cream:      '#FDF8F5',
}

export default function HomePage() {
  const { user } = useAuth()
  const { t }    = useLanguage()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.dark }}>

      {/* ══ HERO — full bleed with community photo overlay ══ */}
      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <p style={S.heroBadge}>FOR THE NAGARATHAR COMMUNITY</p>
          <h1 style={S.heroTitle}>
            Connect Talent with{' '}
            <span style={{ color: C.coralLight }}>Opportunity</span>
          </h1>
          <p style={S.heroDesc}>
            A trusted employment exchange exclusively for the Nagarathar community —
            find jobs, discover talent, and strengthen our network.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
            {user ? (
              <>
                <Link to="/jobs"     style={S.btnPrimary}>Browse Jobs</Link>
                <Link to="/post-job" style={S.btnOutline}>Post a Job</Link>
              </>
            ) : (
              <>
                <Link to="/register" style={S.btnPrimary}>Join the Community</Link>
                <Link to="/login"    style={S.btnOutline}>Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══ BUILT FOR OUR COMMUNITY — coral background ══ */}
      <section style={S.coralSection}>
        <div style={S.container}>
          <h2 style={{ ...S.sectionTitle, color: C.white }}>
            Built <span style={{ color: C.coralPale }}>For Our Community</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 700, marginBottom: 48 }}>
            Nagarathar Jobs is more than a job board — it's a dedicated platform where community
            ties meet professional opportunity. Every connection made here strengthens the broader
            Nagarathar network.
          </p>
          <div style={S.statsRow}>
            {[
              { n: '74', icon: '📍', label: 'Villages Represented', desc: 'Members from across the Nagarathar villages, united on one platform.' },
              { n: '∞',  icon: '👥', label: 'Opportunities',         desc: 'Unlimited potential for our growing network of professionals.' },
              { n: '100%', icon: '🤝', label: 'Community First',     desc: 'Exclusively built for Nagarathar professionals and businesses.' },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: '3.2rem', fontFamily: 'Georgia, serif', fontWeight: 700, color: C.white, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: C.coralPale, margin: '8px 0 6px' }}>{s.label}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: C.white, padding: '80px 20px' }}>
        <div style={S.container}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <h2 style={S.sectionTitle}>
                How It <span style={{ color: C.coral }}>Works</span>
              </h2>
              <p style={S.sectionDesc}>
                Three simple steps to connect our community — from profile creation
                to meaningful professional relationships.
              </p>
            </div>
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
              <img src="/logo.png" alt="Community" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} 
                onError={e => { e.target.style.display='none' }}/>
              <div style={{ width: '100%', height: 280, background: 'linear-gradient(135deg, #FADBD8, #C0392B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem', marginTop: -280 }}>
                🤝
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STEP 1 ══ */}
      <section style={{ background: C.coralBg, padding: '80px 20px' }}>
        <div style={S.container}>
          <h2 style={{ ...S.sectionTitle, color: C.white, marginBottom: 32 }}>
            Step 1: <span style={{ color: C.coralPale }}>Create Your Profile</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={S.stepCard}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12, color: C.dark }}>Register as a Member</h3>
              <p style={{ color: C.slate, lineHeight: 1.7, fontSize: '15px' }}>
                Sign up as a verified Nagarathar member. Add your skills, experience, and what
                you're looking for — whether you're seeking a new role or looking to hire top talent.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '28px 32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: C.white, marginBottom: 16 }}>What to Include</h3>
              {[
                'Professional skills and expertise',
                'Work experience and background',
                'Your village and community ties',
                'Kovil, Pirivu and family details',
                'Job preferences or hiring needs',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.coralPale, flexShrink: 0 }}/>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STEP 2 ══ */}
      <section style={{ background: C.white, padding: '80px 20px' }}>
        <div style={S.container}>
          <h2 style={{ ...S.sectionTitle, marginBottom: 40 }}>
            Step 2: <span style={{ color: C.coral }}>Post or Browse Jobs</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div style={S.featureCard}>
              <div style={S.featureIcon}>💼</div>
              <h3 style={S.featureTitle}>For Employers</h3>
              <p style={S.featureDesc}>
                Post opportunities directly to the Nagarathar talent pool. Reach qualified,
                community-vetted professionals quickly and efficiently.
              </p>
              {user && <Link to="/post-job" style={{ ...S.btnSmall, display: 'inline-block', marginTop: 16 }}>Post a Job →</Link>}
            </div>
            <div style={S.featureCard}>
              <div style={S.featureIcon}>🔍</div>
              <h3 style={S.featureTitle}>For Job Seekers</h3>
              <p style={S.featureDesc}>
                Browse curated listings from Nagarathar employers and apply with a single
                click — no lengthy forms, no barriers.
              </p>
              {user && <Link to="/jobs" style={{ ...S.btnSmall, display: 'inline-block', marginTop: 16 }}>Browse Jobs →</Link>}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STEP 3 ══ */}
      <section style={{ background: C.cream, padding: '80px 20px' }}>
        <div style={S.container}>
          <h2 style={{ ...S.sectionTitle, marginBottom: 12 }}>
            Step 3: <span style={{ color: C.coral }}>Connect & Grow</span>
          </h2>
          <p style={{ ...S.sectionDesc, marginBottom: 40 }}>
            Once matched, connect directly with employers or candidates. Get notified of relevant
            opportunities and help build the community together.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '🔔', title: 'Get Notified',      desc: 'Receive instant alerts when a matching job or candidate appears.' },
              { icon: '💬', title: 'Connect Directly',  desc: 'Reach out to employers or job seekers without middlemen.' },
              { icon: '🌱', title: 'Build Together',    desc: 'Every hire strengthens the Nagarathar professional network.' },
            ].map(f => (
              <div key={f.title} style={S.growCard}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: C.dark }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FLOW DIAGRAM ══ */}
      <section style={{ background: C.white, padding: '80px 20px' }}>
        <div style={S.container}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
            {/* Circle 1 */}
            <div style={S.flowCircle}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Create Profile</div>
              <div style={{ fontSize: '12px', color: C.muted, textAlign: 'center' }}>Set up a simple, community-ready profile</div>
            </div>
            {/* Arrow */}
            <div style={S.flowArrow}>→</div>
            {/* Circle 2 — center, bigger */}
            <div style={{ ...S.flowCircle, width: 160, height: 160, borderWidth: 3, background: C.coralPale }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: C.coral }}>Post or Browse Jobs</div>
              <div style={{ fontSize: '12px', color: C.slate, textAlign: 'center' }}>Share opportunities or find relevant roles</div>
            </div>
            {/* Arrow */}
            <div style={S.flowArrow}>→</div>
            {/* Circle 3 */}
            <div style={S.flowCircle}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Connect & Grow</div>
              <div style={{ fontSize: '12px', color: C.muted, textAlign: 'center' }}>Build relationships and advance your career</div>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: C.muted, marginTop: 40, fontSize: '15px', maxWidth: 600, margin: '40px auto 0' }}>
            From registration to your first meaningful connection, the entire process is designed
            to be simple, fast, and community-centered.
          </p>
        </div>
      </section>

      {/* ══ WHY NAGARATHAR JOBS ══ */}
      <section style={{ background: C.cream, padding: '80px 20px' }}>
        <div style={S.container}>
          <h2 style={{ ...S.sectionTitle, marginBottom: 16 }}>
            Why <span style={{ color: C.coral }}>Nagarathar Jobs?</span>
          </h2>
          <p style={{ ...S.sectionDesc, marginBottom: 48 }}>
            Unlike generic job platforms, Nagarathar Jobs is built exclusively for our community.
            Every employer, every candidate, and every opportunity is rooted in shared heritage
            and mutual trust — making every connection more meaningful.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: '📍', title: '74 Villages',             desc: 'Members representing Nagarathar villages from across the region, united on one platform.' },
              { icon: '👥', title: 'Hundreds of Professionals', desc: 'A growing network of Nagarathar professionals already active and connecting on the platform.' },
              { icon: '🤝', title: 'Community First',         desc: 'Every feature is designed with the Nagarathar community\'s values and needs at the center.' },
            ].map(f => (
              <div key={f.title} style={S.whyCard}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: C.dark }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA — READY TO GET STARTED ══ */}
      <section style={S.ctaSection}>
        <div style={S.ctaOverlay}/>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', color: C.white, marginBottom: 16 }}>
            Ready to Get <span style={{ color: C.coralPale }}>Started?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 36 }}>
            Join hundreds of Nagarathar professionals already on the platform. Create your free
            account today and take the first step toward connecting with trusted community talent.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link to="/jobs"     style={S.ctaBtn}>Browse Jobs</Link>
                <Link to="/post-job" style={S.ctaBtnOutline}>Post a Job</Link>
              </>
            ) : (
              <>
                <Link to="/register" style={S.ctaBtn}>Create Free Account</Link>
                <Link to="/login"    style={S.ctaBtnOutline}>Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  container: { maxWidth: 1100, margin: '0 auto' },

  // Hero
  hero: {
    position: 'relative', minHeight: 520,
    background: 'linear-gradient(135deg, #2C1810 0%, #5C2D1E 50%, #8B3A2A 100%)',
    display: 'flex', alignItems: 'center', padding: '80px 20px',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
  heroContent: { position: 'relative', zIndex: 1, maxWidth: 680 },
  heroBadge: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
    marginBottom: 20, margin: '0 0 20px',
  },
  heroTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
    fontWeight: 700, lineHeight: 1.15,
    color: '#FFFFFF', margin: '0 0 20px',
  },
  heroDesc: {
    fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.75, maxWidth: 580, margin: 0,
  },
  btnPrimary: {
    display: 'inline-block', padding: '13px 28px',
    background: '#C0392B', color: '#FFFFFF',
    borderRadius: 6, fontWeight: 600, fontSize: '15px',
    textDecoration: 'none', border: '2px solid #C0392B',
    transition: 'all 0.2s',
  },
  btnOutline: {
    display: 'inline-block', padding: '13px 28px',
    background: 'transparent', color: '#FFFFFF',
    borderRadius: 6, fontWeight: 600, fontSize: '15px',
    textDecoration: 'none', border: '2px solid rgba(255,255,255,0.6)',
  },

  // Coral section
  coralSection: { background: '#C0392B', padding: '80px 20px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 },
  statCard: {
    background: 'rgba(255,255,255,0.12)', borderRadius: 12,
    padding: '32px 28px', backdropFilter: 'blur(4px)',
  },

  // Section typography
  sectionTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
    fontWeight: 700, lineHeight: 1.2,
    margin: '0 0 16px',
  },
  sectionDesc: {
    fontSize: '1rem', color: '#555', lineHeight: 1.75, maxWidth: 680,
  },

  // Step cards
  stepCard: {
    background: '#FFFFFF', borderRadius: 12,
    padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },

  // Feature cards (step 2)
  featureCard: {
    border: '1px solid #F0E0DE', borderRadius: 12,
    padding: '32px 28px', background: '#FFFFFF',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  featureIcon: { fontSize: '2.5rem', marginBottom: 16 },
  featureTitle: { fontSize: '1.2rem', fontWeight: 700, marginBottom: 10, color: '#1A1A1A' },
  featureDesc: { fontSize: '14px', color: '#666', lineHeight: 1.75 },
  btnSmall: {
    padding: '8px 18px', background: '#C0392B', color: '#FFF',
    borderRadius: 6, fontWeight: 600, fontSize: '13px', textDecoration: 'none',
  },

  // Step 3 cards
  growCard: {
    background: '#FFFFFF', borderRadius: 12,
    padding: '28px 24px', border: '1px solid #F0E0DE',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },

  // Flow diagram
  flowCircle: {
    width: 140, height: 140, borderRadius: '50%',
    border: '2.5px solid #C0392B',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 20, color: '#1A1A1A',
  },
  flowArrow: {
    fontSize: '2rem', color: '#C0392B', margin: '0 16px', fontWeight: 700,
  },

  // Why cards
  whyCard: {
    background: '#FFFFFF', borderRadius: 12,
    padding: '32px 28px', border: '1px solid #EEE',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    textAlign: 'center',
  },

  // CTA section
  ctaSection: {
    position: 'relative', padding: '100px 20px',
    background: 'linear-gradient(135deg, #2C1810, #8B3A2A)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ctaOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(192,57,43,0.3)',
  },
  ctaBtn: {
    display: 'inline-block', padding: '15px 36px',
    background: '#C0392B', color: '#FFFFFF',
    borderRadius: 6, fontWeight: 700, fontSize: '16px',
    textDecoration: 'none', border: '2px solid #C0392B',
  },
  ctaBtnOutline: {
    display: 'inline-block', padding: '15px 36px',
    background: 'transparent', color: '#FFFFFF',
    borderRadius: 6, fontWeight: 700, fontSize: '16px',
    textDecoration: 'none', border: '2px solid rgba(255,255,255,0.6)',
  },
}
