// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { DEFAULT_SKILLS } from '../utils/constants'

// ── Mini chart components ─────────────────────────────────────────────────
function BarChart({ data, height = 160 }) {
  if (!data || data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingBottom: 8 }}>
        {data.map((d, i) => (
          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5C3A00' }}>{d.value}</div>
            <div style={{ width: '100%', background: `hsl(${40 + i * 15}, 70%, 45%)`, height: `${Math.max((d.value / max) * 100, 3)}%`, borderRadius: '4px 4px 0 0', minHeight: 4 }} title={`${d.label}: ${d.value}`} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {data.map(d => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>
            {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ data, size = 160 }) {
  if (!data || data.length === 0) return <EmptyChart />
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <EmptyChart />
  const COLORS = ['#B8860B','#D4A017','#1A6B3C','#1A4A7A','#7B6CF6','#C0392B','#E67E22','#2C3E50']
  let cumulative = 0
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.22
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle)
    const ix2 = cx + inner * Math.cos(endAngle),   iy2 = cy + inner * Math.sin(endAngle)
    const large = pct > 0.5 ? 1 : 0
    return { d: `M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${large} 0 ${ix1},${iy1}Z`, color: COLORS[i % COLORS.length], label: d.label, value: d.value, pct: Math.round(pct * 100) }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity={0.9} />)}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#5C3A00" fontFamily="Georgia,serif">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#8A8070">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {slices.slice(0, 6).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--slate)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: s.color }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizBar({ data }) {
  if (!data || data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.slice(0, 8).map((d, i) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
          <span style={{ width: 130, fontSize: 12, color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: 16, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: i === 0 ? '#B8860B' : i < 3 ? '#D4A017' : '#E2C97A', borderRadius: 8 }} />
          </div>
          <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: '#5C3A00', textAlign: 'right', flexShrink: 0 }}>{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon, value, label, color, sub }) {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 6 }}>{icon}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  )
}

function EmptyChart() {
  return <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>No data yet</div>
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}

const TABS = [
  ['dashboard', '📊 Dashboard'],
  ['jobs',      '💼 Jobs'],
  ['apps',      '📨 Applications'],
  ['users',     '👥 Members'],
  ['skills',    '🏷 Skills'],
]

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab]         = useState('dashboard')
  const [dashData, setDash]   = useState(null)
  const [jobs, setJobs]       = useState([])
  const [apps, setApps]       = useState([])
  const [users, setUsers]     = useState([])
  const [skills, setSkills]   = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [skillSuggestions, setSkillSugg] = useState([])
  const [loading, setLoading] = useState(false)
  const [dashError, setDashError] = useState('')
  const [toast, setToast]     = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedApp,  setSelectedApp]  = useState(null)

  useEffect(() => { loadDashboard() }, [])
  useEffect(() => {
    if (tab === 'jobs')   loadJobs()
    if (tab === 'apps')   loadApps()
    if (tab === 'users')  loadUsers()
    if (tab === 'skills') loadSkills()
  }, [tab])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  async function loadDashboard() {
    setLoading(true); setDashError('')
    try {
      const [uSnap, jSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'nj_users')),
        getDocs(collection(db, 'nj_jobs')),
        getDocs(collection(db, 'nj_applications')),
      ])
      const users = uSnap.docs.map(d => d.data())
      const jobs  = jSnap.docs.map(d => d.data())
      const apps  = aSnap.docs.map(d => d.data())
      const pendingCount = apps.filter(a => a.status === 'pending').length
      const weekAgo = Date.now() - 7 * 86400000
      const newThisWeek = users.filter(u => u.createdAt?.toDate && u.createdAt.toDate().getTime() > weekAgo).length
      const activeJobs = jobs.filter(j => j.status === 'active')
      const activeJobIndustries = new Set(activeJobs.map(j => j.industry).filter(Boolean))
      const matchedCandidates = users.filter(u => (u.lookingFor === 'job' || u.lookingFor === 'both') && u.industry && activeJobIndustries.has(u.industry)).length
      const funnel = { pending: 0, shortlisted: 0, interview: 0, hired: 0, rejected: 0 }
      apps.forEach(a => { if (funnel[a.status] !== undefined) funnel[a.status]++ })
      const toSorted = obj => Object.entries(obj).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({ label, value }))
      const jobsByIndustry = {}; jobs.forEach(j => { const k = j.industry || 'Other'; jobsByIndustry[k] = (jobsByIndustry[k]||0)+1 })
      const candByKovil = {}; users.filter(u => u.lookingFor === 'job' || u.lookingFor === 'both').forEach(u => { const k = u.kovil || 'Not specified'; candByKovil[k] = (candByKovil[k]||0)+1 })
      setDash({
        totalUsers: users.length, totalJobs: activeJobs.length, totalApps: apps.length,
        pendingApps: pendingCount, hired: funnel.hired,
        seekers: users.filter(u => u.lookingFor === 'job' || u.lookingFor === 'both').length,
        employers: users.filter(u => u.lookingFor === 'hire' || u.lookingFor === 'both').length,
        matchedCandidates, newThisWeek, funnel,
        jobsByIndustry: toSorted(jobsByIndustry),
        candByKovil: toSorted(candByKovil),
      })
    } catch(err) { setDashError(err.message) }
    finally { setLoading(false) }
  }

  async function loadJobs() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'nj_jobs'))
      const j = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      j.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setJobs(j)
    } finally { setLoading(false) }
  }

  async function loadApps() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'nj_applications'))
      const a = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      a.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      // Load candidate profiles for each app
      const withProfiles = await Promise.all(a.map(async app => {
        try {
          const { getDoc } = await import('firebase/firestore')
          const uSnap = await getDoc(doc(db, 'nj_users', app.applicantUid))
          return { ...app, candidateProfile: uSnap.exists() ? uSnap.data() : null }
        } catch { return app }
      }))
      setApps(withProfiles)
    } catch(err) { showToast('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function loadUsers() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'nj_users'))
      const u = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      u.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      setUsers(u)
    } catch(err) { showToast('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  async function loadSkills() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'nj_skills'))
      if (snap.empty) {
        for (const name of DEFAULT_SKILLS) await addDoc(collection(db, 'nj_skills'), { name, approved: true, createdAt: serverTimestamp() })
        setSkills(DEFAULT_SKILLS.map(name => ({ name, approved: true })))
      } else {
        setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
      const suggSnap = await getDocs(collection(db, 'nj_skill_suggestions'))
      setSkillSugg(suggSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } finally { setLoading(false) }
  }

  async function toggleJobStatus(job) {
    const s = job.status === 'active' ? 'closed' : 'active'
    await updateDoc(doc(db, 'nj_jobs', job.id), { status: s })
    setJobs(j => j.map(x => x.id === job.id ? { ...x, status: s } : x))
    showToast('Job ' + s)
  }

  async function deleteJob(id) {
    if (!confirm('Delete this job?')) return
    await deleteDoc(doc(db, 'nj_jobs', id))
    setJobs(j => j.filter(x => x.id !== id))
    showToast('Deleted')
  }

  async function updateAppStatus(app, status) {
    await updateDoc(doc(db, 'nj_applications', app.id), { status })
    setApps(a => a.map(x => x.id === app.id ? { ...x, status } : x))
    if (selectedApp?.id === app.id) setSelectedApp(p => ({ ...p, status }))
    fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'status_update', data: {
        to_email: app.applicantEmail, applicant_name: app.applicantName,
        job_title: app.jobTitle, status,
      }})
    }).catch(() => {})
    showToast('Status → ' + status)
  }

  async function toggleUserRole(u) {
    const r = u.role === 'admin' ? 'member' : 'admin'
    await updateDoc(doc(db, 'nj_users', u.id), { role: r })
    setUsers(us => us.map(x => x.id === u.id ? { ...x, role: r } : x))
    showToast(u.displayName + ' → ' + r)
  }

  async function addSkill() {
    const name = newSkill.trim()
    if (!name || skills.find(s => s.name?.toLowerCase() === name.toLowerCase())) { showToast('Already exists'); return }
    await addDoc(collection(db, 'nj_skills'), { name, approved: true, createdAt: serverTimestamp() })
    setSkills(s => [...s, { name, approved: true }].sort((a,b) => a.name.localeCompare(b.name)))
    setNewSkill(''); showToast('"' + name + '" added')
  }

  const statusColor = { pending:'var(--gold)', shortlisted:'var(--blue)', interview:'#7B6CF6', hired:'var(--green)', rejected:'var(--muted)' }
  const d = dashData

  return (
    <div className="page">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom:2 }}>Admin Dashboard</h1>
          <p style={{ color:'var(--muted)', fontSize:'13px' }}>{user?.email}</p>
        </div>
        <span className="badge badge-gold" style={{ fontSize:'13px', padding:'6px 14px' }}>⚡ Admin</span>
      </div>

      {toast && <div className="alert alert-success" style={{ position:'fixed', top:80, right:20, zIndex:200, width:'auto', minWidth:260, boxShadow:'var(--shadow-lg)' }}>✓ {toast}</div>}

      <div style={{ overflowX:'auto' }}>
        <div className="tabs" style={{ minWidth:600 }}>
          {TABS.map(([v,l]) => <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>)}
        </div>
      </div>

      {/* ════ DASHBOARD ════ */}
      {tab === 'dashboard' && (
        <div>
          {loading && <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ margin:'0 auto' }}/><p style={{ color:'var(--muted)', marginTop:16 }}>Loading…</p></div>}
          {dashError && !loading && <div className="alert alert-error">⚠ {dashError} <button onClick={loadDashboard} className="btn btn-ghost btn-sm" style={{ marginLeft:12 }}>Retry</button></div>}
          {d && !loading && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
                <StatCard icon="👥" value={d.totalUsers}  label="Registered Members" color="var(--blue)"  sub={d.seekers + ' seekers · ' + d.employers + ' employers'}/>
                <StatCard icon="💼" value={d.totalJobs}   label="Active Jobs"         color="var(--green)" sub={d.newThisWeek + ' new members this week'}/>
                <StatCard icon="📨" value={d.totalApps}   label="Total Applications"  color="var(--gold)"  sub={d.pendingApps + ' pending review'}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                <StatCard icon="🎉" value={d.hired}              label="Successful Placements" color="var(--green)" sub="Hired"/>
                <StatCard icon="🔍" value={d.seekers}            label="Job Seekers"           color="var(--blue)"  sub="Looking for work"/>
                <StatCard icon="✨" value={d.matchedCandidates}  label="Matching Candidates"   color="var(--gold)"  sub="Industry match"/>
              </div>

              {/* Funnel */}
              <div className="card" style={{ marginBottom:20 }}>
                <div className="card-body">
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16 }}>Application Funnel</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                    {[['Applied',d.totalApps,'var(--blue)','#E8EEF5'],['Shortlisted',d.funnel.shortlisted,'var(--gold)','var(--gold-pale)'],['Interview',d.funnel.interview,'#7B6CF6','#F0EEFF'],['Hired',d.funnel.hired,'var(--green)','#E8F5EE'],['Rejected',d.funnel.rejected,'var(--muted)','#F5F5F5']].map(([label,value,color,bg]) => (
                      <div key={label} style={{ textAlign:'center', background:bg, borderRadius:'var(--radius)', padding:'16px 8px' }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.2rem', fontWeight:700, color }}>{value}</div>
                        <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:4 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <ChartCard title="Jobs by Industry" subtitle="Which industries are posting">
                  <BarChart data={d.jobsByIndustry.slice(0,8)} height={160}/>
                </ChartCard>
                <ChartCard title="Candidates by Kovil" subtitle="Community distribution">
                  <DonutChart data={d.candByKovil} size={150}/>
                </ChartCard>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════ JOBS ════ */}
      {tab === 'jobs' && (
        <div>
          {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>{jobs.length} total postings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {jobs.map(job => (
              <div key={job.id} className="card">
                <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'14px 20px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{job.title}</div>
                    <div style={{ fontSize:'13px', color:'var(--muted)' }}>{job.company} · {job.location||job.locationType} · {job.jobType}</div>
                    <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:2 }}>by {job.postedByName||job.postedByEmail} · {job.applicantCount||0} applicants</div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span className={`badge badge-${job.status==='active'?'green':'muted'}`}>{job.status}</span>
                    <Link to={`/jobs/${job.id}`} className="btn btn-ghost btn-sm">View</Link>
                    <Link to={`/jobs/${job.id}/edit`} className="btn btn-ghost btn-sm">✏️ Edit</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleJobStatus(job)}>{job.status==='active'?'Close':'Reopen'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteJob(job.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && jobs.length === 0 && <Empty icon="💼" msg="No jobs yet"/>}
          </div>
        </div>
      )}

      {/* ════ APPLICATIONS ════ */}
      {tab === 'apps' && (
        <div>
          {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>{apps.length} total · {apps.filter(a=>a.status==='pending').length} pending</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {apps.map(app => (
              <div key={app.id} className="card" style={{ border: selectedApp?.id === app.id ? '2px solid var(--gold)' : '1px solid var(--border)' }}>
                <div className="card-body" style={{ padding:'14px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', cursor:'pointer' }}
                    onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}>
                    <div>
                      <div style={{ fontWeight:600 }}>{app.applicantName} <span style={{ color:'var(--muted)', fontWeight:400 }}>→</span> {app.jobTitle}</div>
                      <div style={{ fontSize:'13px', color:'var(--muted)' }}>
                        📧 {app.applicantEmail}
                        {app.applicantPhone && <span> · 📞 {app.applicantPhone}</span>}
                        {app.applicantKovil && <span> · {app.applicantKovil} Kovil</span>}
                      </div>
                      <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:2 }}>{app.company}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <select className="form-control" style={{ width:150, padding:'5px 10px', fontSize:'13px' }}
                        value={app.status} onClick={e => e.stopPropagation()} onChange={e => updateAppStatus(app, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Cover letter */}
                  {app.coverLetter && (
                    <div style={{ marginTop:10, fontSize:'13px', color:'var(--slate)', background:'var(--ivory)', padding:'8px 12px', borderRadius:4, fontStyle:'italic' }}>
                      "{app.coverLetter.slice(0,240)}{app.coverLetter.length>240?'…':''}"
                    </div>
                  )}

                  {/* Full candidate profile — expanded */}
                  {selectedApp?.id === app.id && (
                    <div style={{ marginTop:16, paddingTop:16, borderTop:'2px solid var(--gold-pale)' }}>
                      <div style={{ fontWeight:700, fontSize:'14px', color:'var(--charcoal)', marginBottom:12 }}>
                        📋 Full Candidate Profile
                      </div>
                      {app.candidateProfile ? (
                        <>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
                            {[
                              ['Kovil',           app.candidateProfile.kovil],
                              ['City',            app.candidateProfile.city],
                              ['Gender',          app.candidateProfile.gender],
                              ['Industry',        app.candidateProfile.industry],
                              ['Experience',      app.candidateProfile.workExperience],
                              ['Qualification',   app.candidateProfile.currentQualification],
                              ['Current Salary',  app.candidateProfile.currentSalary],
                              ['Expected Salary', app.candidateProfile.expectedSalary],
                              ['Preferred Loc',   app.candidateProfile.preferredLocation],
                            ].filter(([,v]) => v).map(([label, value]) => (
                              <div key={label} style={{ background:'var(--ivory)', padding:'8px 12px', borderRadius:6, border:'1px solid var(--border)' }}>
                                <div style={{ fontSize:'10px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</div>
                                <div style={{ fontSize:'13px', fontWeight:600, color:'var(--slate)', marginTop:2 }}>{value}</div>
                              </div>
                            ))}
                          </div>
                          {app.candidateProfile.skills?.length > 0 && (
                            <div style={{ marginBottom:10 }}>
                              <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>Skills</div>
                              <div className="tag-list">{app.candidateProfile.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
                            </div>
                          )}
                          {app.candidateProfile.resumeText && (
                            <div style={{ marginBottom:12, fontSize:'13px', color:'var(--slate)', background:'var(--ivory)', padding:'10px 14px', borderRadius:6, border:'1px solid var(--border)', lineHeight:1.7 }}>
                              {app.candidateProfile.resumeText}
                            </div>
                          )}
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <a href={'mailto:' + app.applicantEmail} className="btn btn-primary btn-sm">📧 Email</a>
                            {app.applicantPhone && <a href={'tel:' + app.applicantPhone} className="btn btn-outline btn-sm">📞 {app.applicantPhone}</a>}
                            <button onClick={() => { navigator.clipboard?.writeText(app.applicantName + '\n' + app.applicantEmail + '\n' + (app.applicantPhone||'')); showToast('Contact details copied!') }} className="btn btn-ghost btn-sm">📋 Copy Details</button>
                          </div>
                        </>
                      ) : (
                        <div style={{ color:'var(--muted)', fontSize:'13px' }}>Profile not available — candidate may not have completed their profile.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && apps.length === 0 && <Empty icon="📨" msg="No applications yet"/>}
          </div>
        </div>
      )}

      {/* ════ MEMBERS ════ */}
      {tab === 'users' && (
        <div>
          {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>{users.length} registered members</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {users.map(u => (
              <div key={u.id} className="card" style={{ border: selectedUser?.id === u.id ? '2px solid var(--gold)' : '1px solid var(--border)' }}>
                <div className="card-body" style={{ padding:'14px 20px' }}>
                  {/* Header row — always visible */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', cursor:'pointer' }}
                    onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <div style={S.av}>{u.photoURL ? <img src={u.photoURL} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} alt=""/> : (u.displayName?.[0]?.toUpperCase()||'?')}</div>
                      <div>
                        <div style={{ fontWeight:600 }}>{u.displayName||'(no name)'}</div>
                        <div style={{ fontSize:'13px', color:'var(--muted)' }}>
                          📧 {u.email}
                          {u.phone && <span> · 📞 {u.phone}</span>}
                        </div>
                        <div style={{ fontSize:'12px', color:'var(--gold)', marginTop:2 }}>
                          {u.kovil && u.kovil + ' Kovil'}
                          {u.city && ' · ' + u.city}
                          {u.lookingFor === 'job' ? ' · 🔍 Job Seeker' : u.lookingFor === 'hire' ? ' · 💼 Employer' : u.lookingFor === 'both' ? ' · 🤝 Both' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span className={`badge badge-${u.role==='admin'?'gold':'muted'}`}>{u.role||'member'}</span>
                      <span style={{ fontSize:'12px', color:'var(--muted)' }}>{selectedUser?.id === u.id ? '▲ Hide' : '▼ Details'}</span>
                    </div>
                  </div>

                  {/* Expanded full profile */}
                  {selectedUser?.id === u.id && (
                    <div style={{ marginTop:16, paddingTop:16, borderTop:'2px solid var(--gold-pale)' }}>

                      {/* Contact box — prominent */}
                      <div style={{ background:'var(--gold-pale)', border:'1px solid var(--gold)', borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
                        <div style={{ fontWeight:700, fontSize:'13px', color:'var(--gold)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Contact Details</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span>📧</span>
                            <a href={'mailto:' + u.email} style={{ color:'var(--dark)', fontWeight:600, fontSize:'14px' }}>{u.email}</a>
                            <button onClick={() => { navigator.clipboard?.writeText(u.email); showToast('Email copied!') }} className="btn btn-ghost btn-sm" style={{ padding:'2px 8px', fontSize:'11px' }}>Copy</button>
                          </div>
                          {u.phone && (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span>📞</span>
                              <a href={'tel:' + u.phone} style={{ color:'var(--dark)', fontWeight:600, fontSize:'14px' }}>{u.phone}</a>
                              <button onClick={() => { navigator.clipboard?.writeText(u.phone); showToast('Phone copied!') }} className="btn btn-ghost btn-sm" style={{ padding:'2px 8px', fontSize:'11px' }}>Copy</button>
                            </div>
                          )}
                          {!u.phone && <span style={{ color:'var(--muted)', fontSize:'13px' }}>No phone number added</span>}
                        </div>
                      </div>

                      {/* Profile details grid */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
                        {[
                          ['Kovil',           u.kovil],
                          ['Pirivu',          u.pirivu],
                          ['City',            u.city],
                          ['Gender',          u.gender],
                          ['Industry',        u.industry || u.companyIndustry],
                          ['Experience',      u.workExperience],
                          ['Qualification',   u.currentQualification],
                          ['Current Salary',  u.currentSalary],
                          ['Expected Salary', u.expectedSalary],
                          ['Company',         u.companyName],
                          ['Designation',     u.designation],
                          ['Preferred Loc',   u.preferredLocation],
                        ].filter(([,v]) => v).map(([label, value]) => (
                          <div key={label} style={{ background:'var(--ivory)', padding:'8px 12px', borderRadius:6, border:'1px solid var(--border)' }}>
                            <div style={{ fontSize:'10px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'var(--slate)', marginTop:2 }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Skills */}
                      {u.skills?.length > 0 && (
                        <div style={{ marginBottom:10 }}>
                          <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>Skills</div>
                          <div className="tag-list">{u.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
                        </div>
                      )}

                      {/* Resume / Bio */}
                      {(u.resumeText || u.bio) && (
                        <div style={{ marginBottom:12, fontSize:'13px', color:'var(--slate)', background:'var(--ivory)', padding:'10px 14px', borderRadius:6, border:'1px solid var(--border)', lineHeight:1.7 }}>
                          {u.resumeText || u.bio}
                        </div>
                      )}

                      {/* LinkedIn */}
                      {u.linkedinUrl && (
                        <a href={u.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginBottom:12 }}>🔗 LinkedIn / Website</a>
                      )}

                      {/* Admin actions */}
                      <div style={{ display:'flex', gap:8, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleUserRole(u)}>
                          {u.role==='admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button onClick={() => { navigator.clipboard?.writeText(u.displayName + '\n' + u.email + '\n' + (u.phone||'')); showToast('Details copied!') }} className="btn btn-ghost btn-sm">
                          📋 Copy Contact
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && users.length === 0 && <Empty icon="👥" msg="No members yet"/>}
          </div>
        </div>
      )}

      {/* ════ SKILLS ════ */}
      {tab === 'skills' && (
        <div>
          <div className="card" style={{ marginBottom:20 }}>
            <div className="card-body">
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', marginBottom:14 }}>Add New Skill</h3>
              <div style={{ display:'flex', gap:10 }}>
                <input className="form-control" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addSkill())} placeholder="e.g. GST Filing, Gold Trading…" style={{ flex:1 }}/>
                <button className="btn btn-primary" onClick={addSkill}>+ Add</button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', marginBottom:14 }}>Skills ({skills.length})</h3>
              {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
              <div className="tag-list">
                {skills.map((skill, i) => (
                  <span key={skill.id||i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'var(--ivory)', border:'1px solid var(--border)', fontSize:'13px' }}>
                    {skill.name||skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ icon, msg }) {
  return <div className="empty-state" style={{ padding:'32px 0' }}><div className="icon">{icon}</div><p>{msg}</p></div>
}

const S = {
  av: { width:36, height:36, borderRadius:'50%', background:'var(--gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0, overflow:'hidden' }
}
