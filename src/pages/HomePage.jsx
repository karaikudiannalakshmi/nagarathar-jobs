// src/pages/HomePage.jsx
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'

export default function HomePage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroContent}>
          <div style={S.badge}>{t('home','badge')}</div>
          <h1 style={S.heroTitle}>
            {t('home','heroTitle1')}<br />
            <em style={{ color:'var(--gold)' }}>{t('home','heroTitle2')}</em>
          </h1>
          <p style={S.heroDesc}>{t('home','heroDesc')}</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {user ? (
              <>
                <Link to="/jobs"     className="btn btn-primary btn-lg">{t('home','browseBtn')}</Link>
                <Link to="/post-job" className="btn btn-outline btn-lg">{t('nav','postJob')}</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">{t('home','joinBtn')}</Link>
                <Link to="/login"    className="btn btn-outline btn-lg">{t('nav','signIn')}</Link>
              </>
            )}
          </div>
        </div>
        <div style={S.heroPattern} aria-hidden="true">
          <svg viewBox="0 0 300 300" width="300" height="300" opacity="0.06">
            {[...Array(6)].map((_,i) => (
              <polygon key={i} points="150,10 290,75 290,225 150,290 10,225 10,75"
                fill="none" stroke="#B8860B" strokeWidth="1.5"
                style={{ transformOrigin:'150px 150px', transform:`scale(${1-i*0.12})` }} />
            ))}
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsBar}>
        <div style={S.statsInner}>
          {[
            { n:'74',  label: t('home','stat1') },
            { n:'∞',   label: t('home','stat2') },
            { n:'🤝',  label: t('home','stat3') },
          ].map(s => (
            <div key={s.label} style={S.stat}>
              <div style={S.statNum}>{s.n}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="page" style={{ paddingTop:60 }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:'2rem', marginBottom:8 }}>{t('home','howTitle')}</h2>
          <p style={{ color:'var(--muted)' }}>{t('home','howSub')}</p>
        </div>
        <div className="grid-3">
          {[
            { icon:'👤', title: t('home','step1Title'), desc: t('home','step1Desc') },
            { icon:'📋', title: t('home','step2Title'), desc: t('home','step2Desc') },
            { icon:'🤝', title: t('home','step3Title'), desc: t('home','step3Desc') },
          ].map(f => (
            <div key={f.title} className="card">
              <div className="card-body" style={{ textAlign:'center' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontSize:'1.3rem', marginBottom:8 }}>{f.title}</h3>
                <p style={{ color:'var(--muted)', fontSize:'14px', lineHeight:1.7 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {!user && (
          <div style={S.cta}>
            <h2 style={{ fontSize:'1.8rem', marginBottom:8 }}>{t('home','ctaTitle')}</h2>
            <p style={{ color:'var(--muted)', marginBottom:24 }}>{t('home','ctaDesc')}</p>
            <Link to="/register" className="btn btn-primary btn-lg">{t('home','ctaBtn')}</Link>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  hero: { background:'linear-gradient(135deg,#FBF7EE 0%,#F5E9C8 100%)', borderBottom:'1px solid var(--border)', padding:'80px 20px', display:'flex', justifyContent:'center', alignItems:'center', position:'relative', overflow:'hidden' },
  heroContent: { maxWidth:580, position:'relative', zIndex:1 },
  badge: { display:'inline-block', padding:'4px 14px', borderRadius:20, background:'var(--white)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:'12px', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:20 },
  heroTitle: { fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(2.4rem,5vw,3.6rem)', fontWeight:700, lineHeight:1.15, marginBottom:20, color:'var(--charcoal)' },
  heroDesc: { fontSize:'1.05rem', color:'var(--slate)', lineHeight:1.7, marginBottom:32, maxWidth:480 },
  heroPattern: { position:'absolute', right:'5%', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' },
  statsBar: { background:'var(--charcoal)', padding:'24px 20px' },
  statsInner: { maxWidth:700, margin:'0 auto', display:'flex', justifyContent:'space-around', alignItems:'center', flexWrap:'wrap', gap:20 },
  stat: { textAlign:'center' },
  statNum: { fontFamily:"'Cormorant Garamond', serif", fontSize:'2.2rem', color:'var(--gold)', fontWeight:700 },
  statLabel: { fontSize:'13px', color:'#AAA', textTransform:'uppercase', letterSpacing:'0.06em' },
  cta: { margin:'64px auto 0', textAlign:'center', padding:'48px', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-sm)' },
}
