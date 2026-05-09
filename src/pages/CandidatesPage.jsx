// src/pages/CandidatesPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { logProfileView } from '../utils/activityLogger'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { KOVILS, INDUSTRIES } from '../utils/constants'

export default function CandidatesPage() {
  const { user, profile } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterKovil, setFilterKovil]       = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadCandidates() }, [])

  async function loadCandidates() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'nj_users'),
        where('lookingFor', 'in', ['job', 'both']),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      setCandidates(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } finally { setLoading(false) }
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.displayName?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q) ||
      c.skills?.some(s => s.toLowerCase().includes(q)) ||
      c.resumeText?.toLowerCase().includes(q)
    const matchKovil    = !filterKovil    || c.kovil    === filterKovil
    const matchIndustry = !filterIndustry || c.industry === filterIndustry
    return matchSearch && matchKovil && matchIndustry
  })

  return (
    <div className="page">
      <h1 className="page-title">Candidates</h1>
      <p className="page-subtitle">Nagarathar professionals open to opportunities</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input className="form-control" style={{ flex: 2, minWidth: 200 }}
          placeholder="🔍  Search by name, skills, location, bio…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ flex: 1, minWidth: 160 }}
          value={filterKovil} onChange={e => setFilterKovil(e.target.value)}>
          <option value="">All Kovils</option>
          {KOVILS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="form-control" style={{ flex: 1, minWidth: 160 }}
          value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
          <option value="">All Industries</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16, fontSize: '14px', color: 'var(--muted)' }}>
        {loading ? 'Loading…' : `${filtered.length} candidate${filtered.length !== 1 ? 's' : ''} found`}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">👤</div>
          <h3>No candidates found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}

      <div className="grid-2">
        {filtered.map(c => (
          <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={styles.avatar}>{c.displayName?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{c.displayName}</div>
                  {c.kovil && <div style={{ fontSize: '13px', color: 'var(--gold)' }}>{c.kovil} Kovil</div>}
                  {c.city  && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>📍 {c.city}</div>}
                </div>
              </div>
              {c.bio && <p style={{ fontSize: '13px', color: 'var(--slate)', lineHeight: 1.6, marginBottom: 10 }}>{c.bio.slice(0, 120)}{c.bio.length > 120 ? '…' : ''}</p>}
              {c.skills?.length > 0 && (
                <div className="tag-list">
                  {c.skills.slice(0, 5).map(s => <span key={s} className="tag">{s}</span>)}
                  {c.skills.length > 5 && <span className="tag">+{c.skills.length - 5}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ ...styles.avatar, width: 48, height: 48, fontSize: '1.3rem' }}>{selected.displayName?.[0]?.toUpperCase()}</div>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem' }}>{selected.displayName}</h3>
                  {selected.kovil && <div style={{ fontSize: '13px', color: 'var(--gold)' }}>{selected.kovil} Kovil</div>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {selected.city     && <span className="tag">📍 {selected.city}</span>}
                {selected.industry && <span className="badge badge-blue">{selected.industry}</span>}
              </div>
              {selected.bio && <p style={{ lineHeight: 1.7, color: 'var(--slate)', marginBottom: 16 }}>{selected.bio}</p>}
              {selected.skills?.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Skills</div>
                  <div className="tag-list" style={{ marginBottom: 16 }}>
                    {selected.skills.map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                </>
              )}
              {selected.resumeText && (
                <>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Resume Summary</div>
                  <div style={{ background: 'var(--ivory)', padding: '12px 16px', borderRadius: 'var(--radius)', fontSize: '13px', lineHeight: 1.7, color: 'var(--slate)', maxHeight: 200, overflowY: 'auto' }}>
                    {selected.resumeText}
                  </div>
                </>
              )}
              {selected.linkedinUrl && (
                <a href={selected.linkedinUrl} target="_blank" rel="noreferrer"
                  className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
                  🔗 LinkedIn / Website
                </a>
              )}
            </div>
            <div className="modal-footer">
              <a href={`mailto:${selected.email}`} className="btn btn-primary">✉️ Contact</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--gold-pale), var(--gold))',
    color: 'white', fontWeight: 700, fontSize: '1.1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}
