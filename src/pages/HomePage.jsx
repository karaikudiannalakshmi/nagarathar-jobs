// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'

// ── Soft pastel palette — calm, elegant, community-feel ───────────────────
const C = {
  gold:       '#B8860B',
  goldLight:  '#D4A017',
  goldPale:   '#F5E9C8',
  goldBg:     '#FAF7F0',
  terracotta: '#C97B4B',   // soft warm terracotta — not aggressive
  terraPale:  '#F5E6D8',   // very light peach
  terraBg:    '#E8C9A8',   // medium warm sand
  dark:       '#2C1810',
  slate:      '#5A4A3A',
  muted:      '#8A7060',
  white:      '#FFFFFF',
  cream:      '#FBF8F3',
  ivory:      '#FAF7F0',
  border:     '#E8D5B8',
}

export default function HomePage() {
  const { user } = useAuth()
  const { t }    = useLanguage()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.dark }}>

      {/* ══ HERO ══ */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          {/* Left: text */}
          <div style={S.heroText}>
            <div style={S.heroBadge}>
For the Nagarathar Community
            </div>
            <h1 style={S.heroTitle}>
              Connect Talent with{' '}
              <em style={{ color: C.terracotta, fontStyle: 'italic' }}>Opportunity</em>
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
          {/* Right: decorative panel */}
          <div style={S.heroPanel}>
            <img src="/logo.png" style={{ width: 220, height: 'auto', opacity: 0.95, filter: 'drop-shadow(0 8px 24px rgba(184,134,11,0.3))' }} alt="Nagarathar Jobs" />
            <div style={S.heroPanelQuote}>
              "நகரத்தார் திறமை, நகரத்தார் வாய்ப்பு"
            </div>
            <div style={{ fontSize: '12px', color: C.muted, textAlign: 'center' }}>
              Nagarathar Talent, Nagarathar Opportunity
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <section style={S.statsBar}>
        <div style={S.container}>
          <div style={S.statsRow}>
            {[
              { n: '74',  icon: '📍', label: 'Villages Represented' },
              { n: '∞',   icon: '💼', label: 'Opportunities' },
              { n: '100%',icon: '🤝', label: 'Community First' },
            ].map(s => (
              <div key={s.label} style={S.statItem}>
                <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
                <span style={S.statNum}>{s.n}</span>
                <span style={S.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BUILT FOR OUR COMMUNITY ══ */}
      <section style={{ background: C.goldBg, padding: '80px 20px' }}>
        <div style={S.container}>
          <div style={S.twoCol}>
            <div>
              <p style={S.tagline}>Our Mission</p>
              <h2 style={S.sectionTitle}>
                Built <span style={{ color: C.terracotta }}>For Our Community</span>
              </h2>
              <p style={{ color: C.slate, lineHeight: 1.8, fontSize: '1rem', marginBottom: 24 }}>
                Nagarathar Jobs is more than a job board — it's a dedicated platform where
                community ties meet professional opportunity. Every connection made here
                strengthens the broader Nagarathar network.
              </p>
              <p style={{ color: C.muted, lineHeight: 1.8, fontSize: '15px' }}>
                Whether you are a fresh graduate, an experienced professional, or a business
                owner looking to hire — this is your community platform.
              </p>
            </div>
            <div style={S.statsGrid}>
              {[
                { n: '74', label: '74 Villages', desc: 'Members from across all Nagarathar villages, united on one platform.' },
                { n: '👥', label: 'Hundreds of Professionals', desc: 'A growing network of Nagarathar professionals actively connecting.' },
                { n: '🆓', label: 'Free to Join', desc: 'No fees, no barriers. Register and start connecting today.' },
                { n: '🔒', label: 'Trusted Network', desc: 'Exclusively for verified Nagarathar community members.' },
              ].map(s => (
                <div key={s.label} style={S.miniCard}>
                  <div style={{ fontSize: s.n.length <= 2 ? '1.8rem' : '1.4rem', fontFamily: 'Georgia,serif', fontWeight: 700, color: C.gold, marginBottom: 6 }}>{s.n}</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 4, color: C.dark }}>{s.label}</div>
                  <div style={{ fontSize: '13px', color: C.muted, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: C.white, padding: '80px 20px' }}>
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={S.tagline}>Simple Process</p>
            <h2 style={S.sectionTitle}>
              How It <span style={{ color: C.terracotta }}>Works</span>
            </h2>
            <p style={{ color: C.muted, maxWidth: 580, margin: '12px auto 0', lineHeight: 1.7 }}>
              Three simple steps to connect our community — from profile creation
              to meaningful professional relationships.
            </p>
          </div>

          {/* Steps */}
          {[
            {
              n: '01', title: 'Create Your Profile',
              sub: 'Register as a Member',
              desc: 'Sign up as a Nagarathar member. Add your Kovil, Pirivu, skills, and experience — whether you\'re seeking a role or looking to hire top talent from within the community.',
              bullets: ['Professional skills and expertise', 'Work experience and background', 'Your Kovil, Pirivu and village ties', 'Job preferences or hiring needs'],
              flip: false,
            },
            {
              n: '02', title: 'Post or Browse Jobs',
              sub: 'Find Your Match',
              desc: 'Employers post opportunities directly to the Nagarathar talent pool. Job seekers browse curated listings and apply with a single click — no lengthy forms, no barriers.',
              bullets: ['Filter by industry, location, salary', 'Gender preference for employers', 'Food & accommodation details', 'Education & experience requirements'],
              flip: true,
            },
            {
              n: '03', title: 'Connect & Grow',
              sub: 'Build Relationships',
              desc: 'Once matched, connect directly with employers or candidates. Get notified of relevant opportunities and help build the community professional network — one relationship at a time.',
              bullets: ['Instant email notifications', 'Direct contact — no middlemen', 'Application status tracking', 'Community success stories'],
              flip: false,
            },
          ].map((step, i) => (
            <div key={step.n} style={{ ...S.stepRow, flexDirection: step.flip ? 'row-reverse' : 'row', marginBottom: i < 2 ? 60 : 0 }}>
              <div style={S.stepLeft}>
                <div style={S.stepNum}>{step.n}</div>
                <p style={S.tagline}>{step.sub}</p>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '1.8rem', fontWeight: 700, marginBottom: 16, color: C.dark }}>{step.title}</h3>
                <p style={{ color: C.slate, lineHeight: 1.8, fontSize: '15px', marginBottom: 20 }}>{step.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {step.bullets.map(b => (
                    <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: C.terracotta, fontWeight: 700, marginTop: 2, flexShrink: 0 }}>›</span>
                      <span style={{ fontSize: '14px', color: C.slate }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.stepRight}>
                <div style={{ ...S.stepCard, background: i % 2 === 0 ? C.goldPale : C.terraPale }}>
                  <div style={{ fontSize: '5rem', marginBottom: 16 }}>
                    {['👤', '💼', '🤝'][i]}
                  </div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '3rem', fontWeight: 700, color: i % 2 === 0 ? C.gold : C.terracotta }}>
                    Step {step.n}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: C.dark, marginTop: 8 }}>{step.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FLOW DIAGRAM ══ */}
      <section style={{ background: C.cream, padding: '80px 20px' }}>
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={S.tagline}>The Journey</p>
            <h2 style={S.sectionTitle}>Your Path to <span style={{ color: C.terracotta }}>Success</span></h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { label: 'Create Profile', sub: 'Set up your community-ready profile', icon: '👤' },
              null,
              { label: 'Post or Browse Jobs', sub: 'Share or find relevant opportunities', icon: '💼', center: true },
              null,
              { label: 'Connect & Grow', sub: 'Build relationships, advance your career', icon: '🌱' },
            ].map((item, i) => item === null ? (
              <div key={i} style={{ fontSize: '1.8rem', color: C.terracotta, margin: '0 12px', fontWeight: 700 }}>→</div>
            ) : (
              <div key={i} style={{
                width: item.center ? 170 : 150,
                height: item.center ? 170 : 150,
                borderRadius: '50%',
                border: `2.5px solid ${item.center ? C.terracotta : C.gold}`,
                background: item.center ? C.terraPale : C.goldPale,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 16, textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: C.dark, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: C.muted, lineHeight: 1.4 }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: C.muted, maxWidth: 600, margin: '0 auto', fontSize: '15px', lineHeight: 1.7 }}>
            From registration to your first meaningful connection, the entire process is designed
            to be simple, fast, and community-centered.
          </p>
        </div>
      </section>

      {/* ══ WHY NAGARATHAR JOBS ══ */}
      <section style={{ background: C.goldBg, padding: '80px 20px' }}>
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={S.tagline}>Our Difference</p>
            <h2 style={S.sectionTitle}>Why <span style={{ color: C.terracotta }}>Nagarathar Jobs?</span></h2>
            <p style={{ color: C.muted, maxWidth: 640, margin: '12px auto 0', lineHeight: 1.7 }}>
              Unlike generic job platforms, Nagarathar Jobs is built exclusively for our community.
              Every connection is rooted in shared heritage and mutual trust.
            </p>
          </div>
          <div style={S.threeCol}>
            {[
              { icon: '🏛', title: 'Rooted in Heritage', desc: 'Every employer, candidate, and opportunity is connected by shared Nagarathar heritage and values.' },
              { icon: '🔐', title: 'Mutual Trust',       desc: 'Community ties create a foundation of trust that generic job platforms simply cannot replicate.' },
              { icon: '📈', title: 'Grow Together',      desc: 'When one member succeeds, our entire community benefits. Together we build a stronger network.' },
            ].map(f => (
              <div key={f.title} style={S.whyCard}>
                <div style={{ fontSize: '2.8rem', marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: C.dark }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={S.ctaSection}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
<h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: C.dark, marginBottom: 16 }}>
            Ready to Get <span style={{ color: C.terracotta }}>Started?</span>
          </h2>
          <p style={{ color: C.slate, fontSize: '1.05rem', lineHeight: 1.75, marginBottom: 36 }}>
            Join hundreds of Nagarathar professionals already on the platform. Create your free
            account today and take the first step toward meaningful community connections.
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
const C2 = { gold: '#B8860B', terracotta: '#C97B4B', dark: '#2C1810', slate: '#5A4A3A', muted: '#8A7060', goldPale: '#F5E9C8', terraPale: '#F5E6D8', goldBg: '#FAF7F0', cream: '#FBF8F3', white: '#FFFFFF', border: '#E8D5B8' }

const S = {
  container: { maxWidth: 1100, margin: '0 auto' },

  // Hero
  hero: { background: 'linear-gradient(135deg, #FAF7F0 0%, #F5E9C8 60%, #F0DFC0 100%)', padding: '80px 20px', borderBottom: '1px solid #E8D5B8' },
  heroInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' },
  heroText: { flex: 1, minWidth: 300 },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center',
    padding: '6px 16px', borderRadius: 24,
    background: '#FFFFFF', border: '1px solid #D4A017',
    color: '#B8860B', fontSize: '12px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2rem, 4vw, 3.4rem)',
    fontWeight: 700, lineHeight: 1.2,
    color: '#2C1810', margin: '0 0 20px',
  },
  heroDesc: { fontSize: '1.05rem', color: '#5A4A3A', lineHeight: 1.8, maxWidth: 520, margin: 0 },
  heroPanel: {
    flex: '0 0 280px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
    background: 'rgba(255,255,255,0.7)', borderRadius: 20,
    padding: '36px 28px', border: '1px solid #E8D5B8',
    boxShadow: '0 8px 32px rgba(184,134,11,0.12)',
    backdropFilter: 'blur(8px)',
  },
  heroPanelQuote: {
    fontFamily: 'Georgia, serif', fontSize: '1rem',
    color: '#B8860B', textAlign: 'center', lineHeight: 1.6,
    fontStyle: 'italic',
  },

  // Buttons
  btnPrimary: {
    display: 'inline-block', padding: '13px 28px',
    background: '#B8860B', color: '#FFFFFF',
    borderRadius: 8, fontWeight: 600, fontSize: '15px',
    textDecoration: 'none', boxShadow: '0 4px 14px rgba(184,134,11,0.3)',
  },
  btnOutline: {
    display: 'inline-block', padding: '13px 28px',
    background: 'transparent', color: '#B8860B',
    borderRadius: 8, fontWeight: 600, fontSize: '15px',
    textDecoration: 'none', border: '2px solid #B8860B',
  },

  // Stats bar
  statsBar: { background: '#2C1810', padding: '28px 20px' },
  statsRow: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  statItem: { display: 'flex', alignItems: 'center', gap: 12 },
  statNum: { fontFamily: 'Georgia,serif', fontSize: '2rem', fontWeight: 700, color: '#D4A017' },
  statLabel: { fontSize: '13px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.06em' },

  // Section typography
  tagline: { fontSize: '12px', fontWeight: 600, color: '#C97B4B', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' },
  sectionTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
    fontWeight: 700, lineHeight: 1.25,
    color: '#2C1810', margin: '0 0 16px',
  },

  // Two column layout
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },

  // Mini stats grid
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  miniCard: {
    background: '#FFFFFF', borderRadius: 12,
    padding: '20px', border: '1px solid #E8D5B8',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },

  // Steps
  stepRow: { display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' },
  stepLeft: { flex: 1, minWidth: 280 },
  stepRight: { flex: '0 0 280px' },
  stepNum: {
    fontSize: '4rem', fontFamily: 'Georgia,serif', fontWeight: 700,
    color: '#E8D5B8', lineHeight: 1, marginBottom: 8,
  },
  stepCard: {
    borderRadius: 20, padding: '48px 32px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', minHeight: 240,
    border: '1px solid #E8D5B8',
  },

  // Three col
  threeCol: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  whyCard: {
    background: '#FFFFFF', borderRadius: 14,
    padding: '32px 24px', textAlign: 'center',
    border: '1px solid #E8D5B8',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },

  // CTA
  ctaSection: {
    background: '#FAF7F0', borderTop: '1px solid #E8D5B8',
    padding: '100px 20px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtn: {
    display: 'inline-block', padding: '15px 36px',
    background: '#B8860B', color: '#FFFFFF',
    borderRadius: 8, fontWeight: 700, fontSize: '16px',
    textDecoration: 'none', boxShadow: '0 4px 14px rgba(184,134,11,0.3)',
  },
  ctaBtnOutline: {
    display: 'inline-block', padding: '15px 36px',
    background: 'transparent', color: '#B8860B',
    borderRadius: 8, fontWeight: 700, fontSize: '16px',
    textDecoration: 'none', border: '2px solid #B8860B',
  },
}
