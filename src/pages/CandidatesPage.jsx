// src/pages/CandidatesPage.jsx
// Employers can browse ALL candidates, filter, and contact anyone directly
import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { INDUSTRIES } from '../utils/constants'

export default function CandidatesPage() {
  const { user, profile } = useAuth()
  const [candidates, setCandidates]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterIndustry, setFI]       = useState('')
  const [filterKovil, setFK]          = useState('')
  const [filterExp, setFE]            = useState('')
  const [filterSalary, setFS]         = useState('')
  const [selected, setSelected]       = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast]             = useState('')

  useEffect(() => { loadCandidates() }, [])

  async function loadCandidates() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'nj_users'))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.lookingFor === 'job' || u.lookingFor === 'both')
      all.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setCandidates(all)
    } finally { setLoading(false) }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // All unique kovils from candidates
  const kovilList = [...new Set(candidates.map(c => c.kovil).filter(Boolean))].sort()
  const expList   = ['Fresher','Less than 1 year','1-2 years','2-5 years','5-10 years','10-15 years','15+ years']

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || [
      c.displayName, c.city, c.industry, c.kovil, c.workExperience,
      c.currentQualification, ...(c.skills||[])
    ].some(f => f?.toLowerCase().includes(q))
    const matchIndustry = !filterIndustry || c.industry === filterIndustry
    const matchKovil    = !filterKovil    || c.kovil    === filterKovil
    const matchExp      = !filterExp      || c.workExperience === filterExp
    return matchSearch && matchIndustry && matchKovil && matchExp
  })

  const activeFilters = [filterIndustry, filterKovil, filterExp, filterSalary].filter(Boolean).length

  return (
    <div className="page">
      {toast && (
        <div style={{ position:'fixed', top:80, right:20, zIndex:300, background:'var(--green)', color:'white', padding:'10px 20px', borderRadius:8, fontWeight:600, fontSize:'14px', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <h1 className="page-title" style={{ marginBottom:4 }}>Browse Candidates</h1>
        <p style={{ color:'var(--muted)', fontSize:'14px' }}>
          {loading ? 'Loading…' : `${filtered.length} of ${candidates.length} members available — view profiles and contact anyone directly`}
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}>🔍</span>
          <input className="form-control" style={{ paddingLeft:36 }}
            placeholder="Search by name, skill, city, kovil, industry…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)} style={{ position:'relative' }}>
          ⚙ Filters
          {activeFilters > 0 && (
            <span style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'var(--gold)', color:'white', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{activeFilters}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, marginBottom:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          {[
            ['Industry', filterIndustry, setFI, ['All Industries', ...INDUSTRIES]],
            ['Kovil',    filterKovil,    setFK, ['All Kovils', ...kovilList]],
            ['Experience', filterExp,   setFE, ['Any Experience', ...expList]],
          ].map(([label, val, setter, opts]) => (
            <div key={label} style={{ flex:1, minWidth:140 }}>
              <label style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', display:'block', marginBottom:5 }}>{label}</label>
              <select className="form-control" value={val} onChange={e => setter(e.target.value)}>
                {opts.map(o => <option key={o} value={o.startsWith('All')||o.startsWith('Any') ? '' : o}>{o}</option>)}
              </select>
            </div>
          ))}
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFI(''); setFK(''); setFE(''); setFS('') }}>✕ Clear all</button>
          )}
        </div>
      )}

      {/* Candidate grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i} className="card"><div className="card-body" style={{ padding:18 }}>
              <div style={{ height:12, background:'var(--border)', borderRadius:6, marginBottom:10, width:'60%' }}/>
              <div style={{ height:10, background:'var(--border)', borderRadius:6, width:'80%' }}/>
            </div></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><h3>No candidates found</h3><p>Try adjusting your search or filters.</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
              onClick={() => setSelected(c)}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
              <div className="card-body" style={{ padding:18 }}>
                {/* Avatar + name */}
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-pale),var(--gold))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.2rem', flexShrink:0, overflow:'hidden' }}>
                    {c.photoURL
                      ? <img src={c.photoURL} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/>
                      : c.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'15px', color:'var(--charcoal)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.displayName}</div>
                    {c.kovil && <div style={{ fontSize:'12px', color:'var(--gold)' }}>{c.kovil} Kovil</div>}
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                  {c.city        && <span className="tag" style={{ fontSize:'11px' }}>📍 {c.city}</span>}
                  {c.industry    && <span className="badge badge-blue" style={{ fontSize:'11px' }}>{c.industry}</span>}
                  {c.workExperience && <span className="badge badge-muted" style={{ fontSize:'11px' }}>⏱ {c.workExperience}</span>}
                  {c.gender      && <span className="badge badge-gold" style={{ fontSize:'11px' }}>{c.gender}</span>}
                </div>

                {/* Salary */}
                {c.expectedSalary && (
                  <div style={{ fontSize:'13px', color:'var(--green)', fontWeight:600, marginBottom:8 }}>💰 {c.expectedSalary}</div>
                )}

                {/* Skills */}
                {c.skills?.length > 0 ? (
                  <div className="tag-list" style={{ marginBottom:10 }}>
                    {c.skills.slice(0,4).map(s => <span key={s} className="tag" style={{ fontSize:'11px' }}>{s}</span>)}
                    {c.skills.length > 4 && <span style={{ fontSize:'11px', color:'var(--muted)' }}>+{c.skills.length-4} more</span>}
                  </div>
                ) : (
                  <div style={{ fontSize:'11px', color:'var(--muted)', marginBottom:10, fontStyle:'italic' }}>No skills listed</div>
                )}

                <div style={{ paddingTop:10, borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex:1, fontSize:'12px' }} onClick={e => { e.stopPropagation(); setSelected(c) }}>
                    👤 View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Full Profile Modal ── */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(44,24,16,0.65)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(3px)' }}
          onClick={() => setSelected(null)}>
          <div style={{ background:'var(--white)', borderRadius:20, maxWidth:560, width:'100%', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--white)', zIndex:10 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-pale),var(--gold))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.4rem', overflow:'hidden', flexShrink:0 }}>
                  {selected.photoURL ? <img src={selected.photoURL} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/> : selected.displayName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', fontWeight:700 }}>{selected.displayName}</div>
                  <div style={{ fontSize:'13px', color:'var(--gold)' }}>
                    {selected.kovil && selected.kovil + ' Kovil'}
                    {selected.city && (selected.kovil ? ' · ' : '') + selected.city}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--muted)', padding:'4px 8px' }}>✕</button>
            </div>

            <div style={{ padding:'20px 24px' }}>
              {/* Tags row */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                {selected.gender        && <span className="badge badge-blue">{selected.gender}</span>}
                {selected.industry      && <span className="badge badge-gold">{selected.industry}</span>}
                {selected.workExperience && <span className="badge badge-muted">⏱ {selected.workExperience}</span>}
                {selected.preferredLocation && <span className="tag">🗺 Prefers {selected.preferredLocation}</span>}
              </div>

              {/* Key details grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  ['Qualification',   selected.currentQualification],
                  ['Expected Salary', selected.expectedSalary],
                  ['Current Salary',  selected.currentSalary],
                  ['Industry',        selected.industry],
                  ['Experience',      selected.workExperience],
                  ['Location',        selected.city],
                ].filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} style={{ background:'var(--ivory)', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'10px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'var(--slate)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {selected.skills?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Skills</div>
                  <div className="tag-list">
                    {selected.skills.map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selected.resumeText && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>About</div>
                  <div style={{ background:'var(--ivory)', padding:'12px 14px', borderRadius:8, fontSize:'13px', lineHeight:1.75, color:'var(--slate)' }}>
                    {selected.resumeText}
                  </div>
                </div>
              )}

              {/* LinkedIn */}
              {selected.linkedinUrl && (
                <a href={selected.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginBottom:16, display:'inline-block' }}>
                  🔗 LinkedIn / Portfolio
                </a>
              )}

              {/* ── CONTACT BOX — always visible ── */}
              <div style={{ background:'var(--gold-pale)', border:'2px solid var(--gold)', borderRadius:12, padding:'16px 20px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
                  Contact This Candidate
                </div>

                {/* Email */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'10px 14px', background:'var(--white)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:'1.2rem' }}>📧</span>
                  <span style={{ flex:1, fontSize:'14px', color:'var(--dark)', fontWeight:500 }}>{selected.email}</span>
                  <button onClick={() => { navigator.clipboard?.writeText(selected.email); showToast('Email copied!') }}
                    className="btn btn-ghost btn-sm" style={{ fontSize:'11px', padding:'3px 10px' }}>Copy</button>
                  <a href={`mailto:${selected.email}?subject=Job Opportunity from Nagarathar Jobs`}
                    className="btn btn-primary btn-sm" style={{ fontSize:'11px', padding:'4px 12px' }}>Email</a>
                </div>

                {/* Phone */}
                {selected.phone ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--white)', borderRadius:8, border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'1.2rem' }}>📞</span>
                    <span style={{ flex:1, fontSize:'14px', color:'var(--dark)', fontWeight:500 }}>{selected.phone}</span>
                    <button onClick={() => { navigator.clipboard?.writeText(selected.phone); showToast('Phone copied!') }}
                      className="btn btn-ghost btn-sm" style={{ fontSize:'11px', padding:'3px 10px' }}>Copy</button>
                    <a href={`tel:${selected.phone}`}
                      className="btn btn-primary btn-sm" style={{ fontSize:'11px', padding:'4px 12px' }}>Call</a>
                  </div>
                ) : (
                  <div style={{ padding:'10px 14px', background:'#F5F5F5', borderRadius:8, fontSize:'13px', color:'var(--muted)', fontStyle:'italic' }}>
                    No phone number added by this candidate
                  </div>
                )}

                {/* WhatsApp if phone available */}
                {selected.phone && (
                  <div style={{ marginTop:10 }}>
                    <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g,'')}?text=Hello ${selected.displayName}, I found your profile on Nagarathar Jobs and would like to discuss a job opportunity with you.`}
                      target="_blank" rel="noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#25D366', color:'white', borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:'13px' }}>
                      <span style={{ fontSize:'1.2rem' }}>💬</span>
                      WhatsApp {selected.displayName?.split(' ')[0]}
                    </a>
                  </div>
                )}

                <button onClick={() => { navigator.clipboard?.writeText(`${selected.displayName}\n${selected.email}\n${selected.phone||''}`); showToast('All details copied!') }}
                  className="btn btn-ghost btn-sm" style={{ marginTop:10, width:'100%', fontSize:'12px' }}>
                  📋 Copy All Contact Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
