// src/pages/JobsPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { INDUSTRIES, JOB_TYPES, EDUCATION_LEVELS } from '../utils/constants'

function timeAgo(ts) {
  if (!ts?.toDate) return ''
  const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 1000)
  if (diff < 86400) return 'Today'
  if (diff < 172800) return 'Yesterday'
  return Math.floor(diff / 86400) + 'd ago'
}

export default function JobsPage() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterIndustry, setFI] = useState('')
  const [filterType, setFT]     = useState('')
  const [filterEdu, setFE]      = useState('')
  const [filterFood, setFF]     = useState('')
  const [filterGender, setFG]   = useState('')

  useEffect(() => { loadJobs() }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const q = query(collection(db, 'nj_jobs'), where('status', '==', 'active'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setJobs(data)
    } finally { setLoading(false) }
  }

  function isMatch(job) {
    if (!profile) return false
    const candIndustry = profile.industry || ''
    const candSkills   = profile.skills   || []
    const jobIndustry  = job.industry     || ''
    const jobSkills    = job.requiredSkills || []
    if (candIndustry && jobIndustry && candIndustry === jobIndustry) return true
    if (candSkills.length > 0 && jobSkills.length > 0) {
      const cs = new Set(candSkills.map(s => s.toLowerCase()))
      if (jobSkills.some(s => cs.has(s.toLowerCase()))) return true
    }
    return false
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q || [j.title, j.company, j.location, j.industry, ...(j.requiredSkills||[])].some(f => f?.toLowerCase().includes(q))
    const matchIndustry = !filterIndustry || j.industry === filterIndustry
    const matchType     = !filterType     || j.jobType  === filterType
    const matchEdu      = !filterEdu      || j.education === filterEdu
    const matchFood     = !filterFood     || j.foodAccommodation === filterFood
    const matchGender   = !filterGender   || j.genderPreference === filterGender || j.genderPreference === 'Any' || !j.genderPreference
    return matchSearch && matchIndustry && matchType && matchEdu && matchFood && matchGender
  })

  const activeFilters = [filterIndustry, filterType, filterEdu, filterFood, filterGender].filter(Boolean).length

  return (
    <div className="page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom:4 }}>Job Listings</h1>
          <p style={{ color:'var(--muted)', fontSize:'14px' }}>Opportunities within the Nagarathar community</p>
        </div>
        <Link to="/post-job" className="btn btn-primary">+ Post Job</Link>
      </div>

      {/* Search + filter bar */}
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}>🔍</span>
          <input className="form-control" style={{ paddingLeft:36 }}
            placeholder="Search title, company, skill, location…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)}
          style={{ position:'relative' }}>
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
            ['Type',     filterType,     setFT, ['All Types', ...JOB_TYPES]],
            ['Education',filterEdu,      setFE, ['Any Education', ...EDUCATION_LEVELS]],
            ['Gender',   filterGender,   setFG, ['Any Gender','Male','Female']],
          ].map(([label, val, setter, opts]) => (
            <div key={label} style={{ flex:1, minWidth:120 }}>
              <label style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', display:'block', marginBottom:5 }}>{label}</label>
              <select className="form-control" value={val} onChange={e => setter(e.target.value)}>
                {opts.map(o => <option key={o} value={o.startsWith('All')||o.startsWith('Any') ? '' : o}>{o}</option>)}
              </select>
            </div>
          ))}
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFI(''); setFT(''); setFE(''); setFF(''); setFG('') }}>
              ✕ Clear all
            </button>
          )}
        </div>
      )}

      <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:16 }}>
        {loading ? 'Loading…' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''} found`}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search or <Link to="/post-job" style={{ color:'var(--gold)' }}>post a job</Link>.</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(job => {
          const matched = isMatch(job)
          const applicantCount = job.applicantCount || 0
          return (
            <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div className="card" style={{ transition:'transform 0.15s, box-shadow 0.15s', border: matched ? '1.5px solid var(--green)' : '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
                <div className="card-body" style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:'var(--gold-pale)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.1rem', color:'var(--gold)', flexShrink:0 }}>
                          {job.company?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--charcoal)' }}>{job.title}</div>
                          <div style={{ fontSize:'13px', color:'var(--gold)', fontWeight:500 }}>{job.company}</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                        {job.location && <span className="tag">📍 {job.location}</span>}
                        {job.jobType  && <span className="tag">💼 {job.jobType}</span>}
                        {job.industry && <span className="badge badge-blue" style={{ fontSize:'12px' }}>{job.industry}</span>}
                        {job.education && <span className="badge badge-gold" style={{ fontSize:'11px' }}>🎓 {job.education}</span>}
                        {job.foodAccommodation && job.foodAccommodation !== 'Not Provided' && <span className="badge badge-green" style={{ fontSize:'11px' }}>🍽 {job.foodAccommodation}</span>}
                        {matched && <span className="badge badge-green" style={{ fontWeight:700, fontSize:'12px' }}>✨ Matches Your Profile</span>}
                      </div>

                      {/* Applicant count bar — WorkIndia style */}
                      {applicantCount > 0 && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div style={{ height:6, flex:1, background:'var(--border)', borderRadius:3, overflow:'hidden', maxWidth:120 }}>
                            <div style={{ height:'100%', width:`${Math.min(applicantCount * 10, 100)}%`, background:'var(--green)', borderRadius:3 }}/>
                          </div>
                          <span style={{ fontSize:'12px', color:'var(--green)', fontWeight:600 }}>
                            {applicantCount} {applicantCount === 1 ? 'person applied' : 'people applied'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {(job.salary || job.salaryType === 'negotiable') && (
                        <div style={{ fontWeight:700, color:'var(--green)', fontSize:'14px', marginBottom:4 }}>
                          💰 {job.salaryType === 'negotiable' ? 'Negotiable' : job.salary}
                        </div>
                      )}
                      <div style={{ fontSize:'12px', color:'var(--muted)' }}>{timeAgo(job.createdAt)}</div>
                      {matched && (
                        <div style={{ marginTop:8 }}>
                          <span style={{ fontSize:'11px', background:'#E8F5EE', color:'var(--green)', padding:'3px 8px', borderRadius:10, fontWeight:600 }}>
                            🔥 Hot Match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
