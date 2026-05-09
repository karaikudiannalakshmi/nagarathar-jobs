// src/pages/JobsPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { INDUSTRIES, JOB_TYPES } from '../utils/constants'

export default function JobsPage() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterType, setFilterType]         = useState('')

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'nj_jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const snap = await getDocs(q)
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      j.title?.toLowerCase().includes(q) ||
      j.company?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    const matchIndustry = !filterIndustry || j.industry === filterIndustry
    const matchType     = !filterType     || j.type === filterType
    return matchSearch && matchIndustry && matchType
  })

  return (
    <div className="page">
      <h1 className="page-title">Job Listings</h1>
      <p className="page-subtitle">Opportunities within the Nagarathar community</p>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          className="form-control" style={{ flex: 2, minWidth: 200 }}
          placeholder="🔍  Search by title, company, location…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="form-control" style={{ flex: 1, minWidth: 160 }}
          value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
          <option value="">All Industries</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select className="form-control" style={{ flex: 1, minWidth: 140 }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <Link to="/post-job" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Post Job</Link>
      </div>

      <div style={{ marginBottom: 16, fontSize: '14px', color: 'var(--muted)' }}>
        {loading ? 'Loading…' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''} found`}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your filters or <Link to="/post-job">post the first job</Link>.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(job => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  )
}

function JobCard({ job }) {
  const age = timeAgo(job.createdAt?.toDate?.())

  return (
    <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={styles.jobCard}>
          <div style={styles.jobMain}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div style={styles.companyLogo}>
                {job.company?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 3, color: 'var(--charcoal)' }}>{job.title}</h3>
                <div style={{ fontSize: '14px', color: 'var(--slate)', fontWeight: 500 }}>{job.company}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {job.location && <span className="tag">📍 {job.location}</span>}
              {job.type     && <span className="badge badge-blue">{job.type}</span>}
              {job.industry && <span className="badge badge-muted">{job.industry}</span>}
            </div>
          </div>
          <div style={styles.jobMeta}>
            {job.salary && <div style={styles.salary}>{job.salary}</div>}
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 4 }}>{age}</div>
            <div className="badge badge-green" style={{ marginTop: 8 }}>Active</div>
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
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days/30)} months ago`
  return `${Math.floor(days/365)} years ago`
}

const styles = {
  filters: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  jobCard: {
    padding: '20px 24px',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 16,
  },
  jobMain: { flex: 1 },
  jobMeta: { textAlign: 'right', flexShrink: 0 },
  companyLogo: {
    width: 44, height: 44, borderRadius: 8,
    background: 'linear-gradient(135deg, var(--gold-pale), var(--gold))',
    color: 'white', fontWeight: 700, fontSize: '1.2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  salary: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--green)' },
}
