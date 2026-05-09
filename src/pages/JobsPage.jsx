// src/pages/JobsPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { INDUSTRIES, JOB_TYPES, EDUCATION_LEVELS } from '../utils/constants'

export default function JobsPage() {
  const [jobs, setJobs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterIndustry, setFI]   = useState('')
  const [filterType, setFT]       = useState('')
  const [filterEdu, setFE]        = useState('')
  const [filterFood, setFF]       = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { loadJobs() }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'nj_jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      j.title?.toLowerCase().includes(q) ||
      j.company?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.requiredSkills?.some(s => s.toLowerCase().includes(q))
    const matchIndustry = !filterIndustry || j.industry === filterIndustry
    const matchType     = !filterType     || j.jobType  === filterType
    const matchEdu      = !filterEdu      || j.education === filterEdu
    const matchFood     = !filterFood     || j.foodAccommodation === filterFood
    return matchSearch && matchIndustry && matchType && matchEdu && matchFood
  })

  const activeFilterCount = [filterIndustry, filterType, filterEdu, filterFood].filter(Boolean).length

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Job Listings</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Opportunities within the Nagarathar community</p>
        </div>
        <Link to="/post-job" className="btn btn-primary" style={{ marginTop: 8 }}>+ Post Job</Link>
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, marginTop: 24 }}>
        <input className="form-control" style={{ flex: 1 }}
          placeholder="🔍  Search title, company, skill, location…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-ghost btn-sm"
          onClick={() => setShowFilters(!showFilters)}
          style={{ whiteSpace: 'nowrap', position: 'relative' }}>
          ⚙ Filters {activeFilterCount > 0 && (
            <span style={{ background: 'var(--gold)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Industry</label>
            <select className="form-control" value={filterIndustry} onChange={e => setFI(e.target.value)}>
              <option value="">All Industries</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Job Type</label>
            <select className="form-control" value={filterType} onChange={e => setFT(e.target.value)}>
              <option value="">All Types</option>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Education</label>
            <select className="form-control" value={filterEdu} onChange={e => setFE(e.target.value)}>
              <option value="">Any Education</option>
              {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Food & Stay</label>
            <select className="form-control" value={filterFood} onChange={e => setFF(e.target.value)}>
              <option value="">Any</option>
              <option value="Food Provided">Food Provided</option>
              <option value="Accommodation Provided">Accommodation Provided</option>
              <option value="Both Food & Accommodation Provided">Both Provided</option>
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFI(''); setFT(''); setFE(''); setFF('') }}>
              Clear all
            </button>
          )}
        </div>
      )}

      <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 16 }}>
        {loading ? 'Loading…' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''} found`}
        {activeFilterCount > 0 && !loading && <span style={{ marginLeft: 8, color: 'var(--gold)' }}>({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active)</span>}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search or <Link to="/post-job">post a job</Link>.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(job => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  )
}

function JobCard({ job }) {
  const age = timeAgo(job.createdAt?.toDate?.())
  const loc = job.locationType === 'Any Location / Remote' ? '🌐 Remote / Any' : job.location ? `📍 ${job.location}` : ''

  return (
    <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
      <div className="card">
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={S.logo}>{job.company?.[0]?.toUpperCase() || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>{job.title}</h3>
                  <div style={{ fontSize: '14px', color: 'var(--slate)' }}>{job.company}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {(job.salary || job.salaryType === 'negotiable') && (
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--green)' }}>
                      {job.salaryType === 'negotiable' ? 'Negotiable' : job.salary}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{age}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {loc && <span className="tag">{loc}</span>}
                {job.jobType && <span className="badge badge-blue">{job.jobType}</span>}
                {job.industry && <span className="badge badge-muted">{job.industry}</span>}
                {job.education && <span className="badge badge-gold">🎓 {job.education}</span>}
                {job.foodAccommodation && job.foodAccommodation !== 'Not Provided' &&
                  <span className="badge badge-green">🍽 {job.foodAccommodation}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days/30)}mo ago`
}

const S = {
  logo: {
    width: 44, height: 44, borderRadius: 8, flexShrink: 0,
    background: 'linear-gradient(135deg, var(--gold-pale), var(--gold))',
    color: 'white', fontWeight: 700, fontSize: '1.2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
