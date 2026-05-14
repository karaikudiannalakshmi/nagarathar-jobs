// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, getDocs, doc, updateDoc,
  deleteDoc, getCountFromServer, where, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { sendStatusUpdate } from '../utils/emailjs'
import { logStatusChange } from '../utils/activityLogger'
import { runFollowUpChecks } from '../utils/followUpScheduler'
import { DEFAULT_SKILLS } from '../utils/constants'

// ── Mini chart components (no external lib needed) ────────────────────────────
function BarChart({ data, colorFrom = '#B8860B', colorTo = '#F0C040', height = 180 }) {
  if (!data || data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingBottom: 8 }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          const ratio = i / Math.max(data.length - 1, 1)
          const r = Math.round(184 + (240 - 184) * ratio)
          const g = Math.round(134 + (192 - 134) * ratio)
          const b = Math.round(11 + (64 - 11) * ratio)
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5C3A00' }}>{d.value}</div>
              <div style={{
                width: '100%', background: `rgb(${r},${g},${b})`,
                height: `${Math.max(pct, 3)}%`, borderRadius: '4px 4px 0 0',
                minHeight: 4, transition: 'height 0.6s ease',
                boxShadow: '0 2px 6px rgba(184,134,11,0.3)',
              }} title={`${d.label}: ${d.value}`} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {data.map(d => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>
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

function HorizBar({ data, color = '#B8860B' }) {
  if (!data || data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.slice(0, 8).map((d, i) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
          <span style={{ width: 130, fontSize: 12, color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: 16, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: i === 0 ? '#B8860B' : i < 3 ? '#D4A017' : '#E2C97A', borderRadius: 8, transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: '#5C3A00', textAlign: 'right', flexShrink: 0 }}>{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon, value, label, color, sub }) {
  return (
    <div className="card" style={{ transition: 'none' }}>
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
    <div className="card" style={{ transition: 'none' }}>
      <div className="card-body">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--charcoal)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Main AdminPage ────────────────────────────────────────────────────────────
const TABS = [
  ['dashboard', '📊 Dashboard'],
  ['jobs',      '💼 Jobs'],
  ['apps',      '📨 Applications'],
  ['users',     '👥 Members'],
  ['skills',    '🏷 Skills Master'],
]

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab]       = useState('dashboard')
  const [dashData, setDash] = useState(null)
  const [jobs, setJobs]     = useState([])
  const [apps, setApps]     = useState([])
  const [users, setUsers]   = useState([])
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [dashError, setDashError] = useState('')
  const [toast, setToast]   = useState('')

  useEffect(() => {
    loadDashboard()
    runFollowUpChecks().then(r => {
      const n = r.pendingApps + r.noResponseApps + r.dormantMembers
      if (n > 0) showToast(`${n} follow-up email${n > 1 ? 's' : ''} triggered`)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'jobs')   loadJobs()
    if (tab === 'apps')   loadApps()
    if (tab === 'users')  loadUsers()
    if (tab === 'skills') loadSkills()
  }, [tab])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  // ── Dashboard data aggregation ──────────────────────────────────────────
  async function loadDashboard() {
    setLoading(true)
    setDashError('')
    try {
      // Use simple collection reads — no compound queries to avoid index issues
      const [uSnap, jSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'nj_users')),
        getDocs(collection(db, 'nj_jobs')),
        getDocs(collection(db, 'nj_applications')),
      ])

      const users  = uSnap.docs.map(d => d.data())
      const jobs   = jSnap.docs.map(d => d.data())
      const apps   = aSnap.docs.map(d => d.data())
      const pendingAppsCount = apps.filter(a => a.status === 'pending').length

      // ── Jobs by industry ──
      const jobsByIndustry = {}
      jobs.forEach(j => {
        const k = j.industry || 'Other'
        jobsByIndustry[k] = (jobsByIndustry[k] || 0) + 1
      })

      // ── Jobs by type ──
      const jobsByType = {}
      jobs.forEach(j => {
        const k = j.jobType || 'Full-Time'
        jobsByType[k] = (jobsByType[k] || 0) + 1
      })

      // ── Jobs by location ──
      const jobsByLocation = {}
      jobs.forEach(j => {
        const k = j.locationType === 'Any Location / Remote' ? 'Remote/Any' : (j.location || 'Unknown')
        jobsByLocation[k] = (jobsByLocation[k] || 0) + 1
      })

      // ── Candidates by kovil ──
      const candByKovil = {}
      users.filter(u => u.lookingFor === 'job' || u.lookingFor === 'both').forEach(u => {
        const k = u.kovil || 'Not specified'
        candByKovil[k] = (candByKovil[k] || 0) + 1
      })

      // ── Candidates by industry ──
      const candByIndustry = {}
      users.filter(u => u.lookingFor === 'job' || u.lookingFor === 'both').forEach(u => {
        const k = u.industry || 'Not specified'
        candByIndustry[k] = (candByIndustry[k] || 0) + 1
      })

      // ── Candidates by city ──
      const candByCity = {}
      users.forEach(u => {
        if (u.city) candByCity[u.city] = (candByCity[u.city] || 0) + 1
      })

      // ── Top skills in demand (from jobs) ──
      const skillDemand = {}
      jobs.forEach(j => (j.requiredSkills || []).forEach(s => { skillDemand[s] = (skillDemand[s] || 0) + 1 }))

      // ── Top skills candidates have ──
      const skillSupply = {}
      users.forEach(u => (u.skills || []).forEach(s => { skillSupply[s] = (skillSupply[s] || 0) + 1 }))

      // ── Candidates by gender ──
      const candByGender = {}
      users.forEach(u => {
        const k = u.gender || 'Not specified'
        candByGender[k] = (candByGender[k] || 0) + 1
      })

      // ── Job gender preference ──
      const jobsByGender = {}
      jobs.forEach(j => {
        const k = j.genderPreference || 'Any'
        jobsByGender[k] = (jobsByGender[k] || 0) + 1
      })

      // ── Job-Candidate matching ──
      // Count candidates whose industry matches at least one active job
      const activeJobIndustries = new Set(jobs.filter(j => j.status === 'active').map(j => j.industry).filter(Boolean))
      const matchedCandidates = users.filter(u =>
        (u.lookingFor === 'job' || u.lookingFor === 'both') &&
        u.industry && activeJobIndustries.has(u.industry)
      ).length

      // New members this week
      const weekAgo = Date.now() - 7 * 86400000
      const newThisWeek = users.filter(u => u.createdAt?.toDate && u.createdAt.toDate().getTime() > weekAgo).length

      // ── Application funnel ──
      const funnel = { pending: 0, shortlisted: 0, interview: 0, hired: 0, rejected: 0 }
      apps.forEach(a => { if (funnel[a.status] !== undefined) funnel[a.status]++ })

      // ── Jobs posted this week / month ──
      const now = Date.now()
      const thisWeek  = jobs.filter(j => j.createdAt?.toDate && (now - j.createdAt.toDate().getTime()) < 7 * 86400000).length
      const thisMonth = jobs.filter(j => j.createdAt?.toDate && (now - j.createdAt.toDate().getTime()) < 30 * 86400000).length

      const toSorted = obj => Object.entries(obj).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({ label, value }))

      setDash({
        totalUsers:   users.length,
        totalJobs:    jobs.filter(j => j.status === 'active').length,
        totalApps:    apps.length,
        pendingApps:  pendingAppsCount,
        hired:        funnel.hired,
        thisWeek, thisMonth,
        jobsByIndustry: toSorted(jobsByIndustry),
        jobsByType:     toSorted(jobsByType),
        jobsByLocation: toSorted(jobsByLocation),
        candByKovil:    toSorted(candByKovil),
        candByIndustry: toSorted(candByIndustry),
        candByCity:     toSorted(candByCity),
        skillDemand:    toSorted(skillDemand),
        skillSupply:    toSorted(skillSupply),
        candByGender:   toSorted(candByGender),
        jobsByGender:   toSorted(jobsByGender),
        funnel,
        seekers: users.filter(u => u.lookingFor === 'job' || u.lookingFor === 'both').length,
        employers: users.filter(u => u.lookingFor === 'hire' || u.lookingFor === 'both').length,
        matchedCandidates,
        newThisWeek,
      })
    } catch(err) {
      console.error('Dashboard load error:', err)
      setDashError(err.message || 'Failed to load dashboard data')
    } finally { setLoading(false) }
  }

  async function loadJobs() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'nj_jobs'))
    const jobsData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    jobsData.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
    setJobs(jobsData)
    setLoading(false)
  }
  async function loadApps() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'nj_applications'))
    const appsData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Sort client-side to avoid index requirement
    appsData.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
    setApps(appsData)
    setLoading(false)
  }
  async function loadUsers() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'nj_users'))
    const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    usersData.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
    setUsers(usersData)
    setLoading(false)
  }
  async function loadSkills() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'nj_skills'), orderBy('name')))
      if (snap.empty) {
        for (const name of DEFAULT_SKILLS) await addDoc(collection(db, 'nj_skills'), { name, approved: true, createdAt: serverTimestamp() })
        setSkills(DEFAULT_SKILLS.map(name => ({ name, approved: true })))
      } else {
        setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
      const suggSnap = await getDocs(query(collection(db, 'nj_skill_suggestions'), orderBy('createdAt', 'desc')))
      setSkillSuggestions(suggSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } finally { setLoading(false) }
  }

  async function toggleJobStatus(job) {
    const s = job.status === 'active' ? 'closed' : 'active'
    await updateDoc(doc(db, 'nj_jobs', job.id), { status: s })
    setJobs(j => j.map(x => x.id === job.id ? { ...x, status: s } : x))
    showToast(`Job ${s}`)
  }
  async function deleteJob(id) {
    if (!confirm('Delete this job?')) return
    await deleteDoc(doc(db, 'nj_jobs', id))
    setJobs(j => j.filter(x => x.id !== id))
    showToast('Job deleted')
  }
  async function updateAppStatus(app, newStatus) {
    await updateDoc(doc(db, 'nj_applications', app.id), { status: newStatus })
    setApps(a => a.map(x => x.id === app.id ? { ...x, status: newStatus } : x))
    logStatusChange({ adminUid: user?.uid, applicationId: app.id, applicantUid: app.applicantUid, applicantName: app.applicantName, applicantEmail: app.applicantEmail, jobTitle: app.jobTitle, oldStatus: app.status, newStatus }).catch(() => {})
    sendStatusUpdate({ to_email: app.applicantEmail, applicant_name: app.applicantName, job_title: app.jobTitle, status: newStatus }).catch(() => {})
    showToast(`Status → ${newStatus}`)
  }
  async function toggleUserRole(u) {
    const r = u.role === 'admin' ? 'member' : 'admin'
    await updateDoc(doc(db, 'nj_users', u.id), { role: r })
    setUsers(us => us.map(x => x.id === u.id ? { ...x, role: r } : x))
    showToast(`${u.displayName} → ${r}`)
  }
  async function addSkill() {
    const name = newSkill.trim()
    if (!name || skills.find(s => s.name?.toLowerCase() === name.toLowerCase())) { showToast('Already exists'); return }
    await addDoc(collection(db, 'nj_skills'), { name, approved: true, createdAt: serverTimestamp() })
    setSkills(s => [...s, { name, approved: true }].sort((a,b) => a.name.localeCompare(b.name)))
    setNewSkill(''); showToast(`Skill "${name}" added`)
  }
  async function deleteSkill(skill) {
    if (!confirm(`Delete skill "${skill.name}"?`)) return
    if (skill.id) await deleteDoc(doc(db, 'nj_skills', skill.id))
    setSkills(s => s.filter(x => x.name !== skill.name)); showToast('Deleted')
  }
  async function approveSuggestion(sug) {
    await addDoc(collection(db, 'nj_skills'), { name: sug.name, approved: true, createdAt: serverTimestamp() })
    await deleteDoc(doc(db, 'nj_skill_suggestions', sug.id))
    setSkills(s => [...s, { name: sug.name, approved: true }].sort((a,b) => a.name.localeCompare(b.name)))
    setSkillSuggestions(s => s.filter(x => x.id !== sug.id))
    showToast(`"${sug.name}" approved`)
  }
  async function rejectSuggestion(sug) {
    await deleteDoc(doc(db, 'nj_skill_suggestions', sug.id))
    setSkillSuggestions(s => s.filter(x => x.id !== sug.id))
    showToast('Suggestion rejected')
  }

  const d = dashData

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom:2 }}>Admin Dashboard</h1>
          <p style={{ color:'var(--muted)', fontSize:'13px' }}>{user?.email}</p>
        </div>
        <span className="badge badge-gold" style={{ fontSize:'13px', padding:'6px 14px' }}>⚡ Admin</span>
      </div>

      {toast && (
        <div className="alert alert-success" style={{ position:'fixed', top:80, right:20, zIndex:200, width:'auto', minWidth:260, boxShadow:'var(--shadow-lg)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Tabs */}
      <div style={{ overflowX:'auto' }}>
        <div className="tabs" style={{ minWidth:600 }}>
          {TABS.map(([v,l]) => (
            <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* ════ DASHBOARD TAB ════ */}
      {tab === 'dashboard' && (
        <div>
          {loading && <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ margin:'0 auto' }}/><p style={{ color:'var(--muted)', marginTop:16, fontSize:14 }}>Loading dashboard data…</p></div>}
          {dashError && !loading && (
            <div className="alert alert-error" style={{ marginTop:16 }}>
              ⚠ {dashError}
              <button onClick={loadDashboard} className="btn btn-ghost btn-sm" style={{ marginLeft:12 }}>Retry</button>
            </div>
          )}

          {d && (
            <>
              {/* KPI row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
                <StatCard icon="👥" value={d.totalUsers}  label="Registered Members" color="var(--blue)"  sub={`${d.seekers} seekers · ${d.employers} employers`}/>
                <StatCard icon="💼" value={d.totalJobs}   label="Active Jobs"         color="var(--green)" sub={`${d.thisWeek} this week · ${d.thisMonth} this month`}/>
                <StatCard icon="📨" value={d.totalApps}   label="Total Applications"  color="var(--gold)"  sub={`${d.pendingApps} pending review`}/>
                <StatCard icon="🎉" value={d.hired} label="Successful Placements" color="var(--green)" sub="Community successes"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
                <StatCard icon="🔍" value={d.seekers}            label="Job Seekers"            color="var(--blue)"  sub={`${d.newThisWeek} joined this week`}/>
                <StatCard icon="🏢" value={d.employers}           label="Employers"              color="var(--gold)"  sub="Posted jobs"/>
                <StatCard icon="✨" value={d.matchedCandidates}   label="Matching Candidates"    color="var(--green)" sub="Industry match with active jobs"/>
              </div>

              {/* Application funnel */}
              <div className="card" style={{ marginBottom:20 }}>
                <div className="card-body">
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16 }}>Application Funnel</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                    {[
                      { label:'Applied',     value: d.totalApps,       color:'var(--blue)',   bg:'#E8EEF5' },
                      { label:'Shortlisted', value: d.funnel.shortlisted, color:'var(--gold)',   bg:'var(--gold-pale)' },
                      { label:'Interview',   value: d.funnel.interview, color:'#7B6CF6',       bg:'#F0EEFF' },
                      { label:'Hired',       value: d.funnel.hired,    color:'var(--green)',  bg:'#E8F5EE' },
                      { label:'Rejected',    value: d.funnel.rejected, color:'var(--red)',    bg:'#FDECEC' },
                    ].map(f => (
                      <div key={f.label} style={{ textAlign:'center', background:f.bg, borderRadius:'var(--radius)', padding:'16px 8px', border:`1px solid ${f.color}20` }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.2rem', fontWeight:700, color:f.color }}>{f.value}</div>
                        <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:4 }}>{f.label}</div>
                        <div style={{ marginTop:8, height:4, background:'rgba(0,0,0,0.08)', borderRadius:2 }}>
                          <div style={{ height:'100%', width:`${d.totalApps > 0 ? Math.round((f.value/d.totalApps)*100) : 0}%`, background:f.color, borderRadius:2 }}/>
                        </div>
                        <div style={{ fontSize:'10px', color:f.color, fontWeight:600, marginTop:3 }}>{d.totalApps > 0 ? Math.round((f.value/d.totalApps)*100) : 0}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Jobs charts row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <ChartCard title="Jobs by Industry" subtitle="Which industries are posting most">
                  <BarChart data={d.jobsByIndustry.slice(0,8)} height={160}/>
                </ChartCard>
                <ChartCard title="Jobs by Type" subtitle="Full-time vs Part-time etc.">
                  <DonutChart data={d.jobsByType} size={150}/>
                </ChartCard>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <ChartCard title="Jobs by Location" subtitle="Where are the opportunities?">
                  <HorizBar data={d.jobsByLocation}/>
                </ChartCard>
                <ChartCard title="Top Skills in Demand" subtitle="Most requested by employers">
                  <HorizBar data={d.skillDemand} color="#1A4A7A"/>
                </ChartCard>
              </div>

              {/* Candidates charts row */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', fontWeight:600, color:'var(--charcoal)', marginBottom:14, paddingBottom:8, borderBottom:'2px solid var(--gold-pale)' }}>
                  👥 Candidate Analytics
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <ChartCard title="Candidates by Kovil" subtitle="Community distribution across clans">
                  <DonutChart data={d.candByKovil} size={150}/>
                </ChartCard>
                <ChartCard title="Candidates by Industry" subtitle="Professional background of job seekers">
                  <BarChart data={d.candByIndustry.slice(0,8)} height={160}/>
                </ChartCard>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <ChartCard title="Candidates by City" subtitle="Where are our members located?">
                  <HorizBar data={d.candByCity}/>
                </ChartCard>
                <ChartCard title="Skills Candidates Have" subtitle="What talent is available in community">
                  <HorizBar data={d.skillSupply} color="#1A6B3C"/>
                </ChartCard>
              </div>

              {/* Gender charts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <ChartCard title="Candidates by Gender" subtitle="Gender distribution of job seekers">
                  <DonutChart data={d.candByGender} size={150}/>
                </ChartCard>
                <ChartCard title="Jobs by Gender Preference" subtitle="What employers are looking for">
                  <DonutChart data={d.jobsByGender} size={150}/>
                </ChartCard>
              </div>

              {/* Skill gap insight */}
              {d.skillDemand.length > 0 && d.skillSupply.length > 0 && (
                <div className="card" style={{ marginBottom:16 }}>
                  <div className="card-body">
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:12 }}>
                      🔍 Skill Gap Analysis
                    </div>
                    <p style={{ fontSize:'13px', color:'var(--muted)', marginBottom:14 }}>
                      Skills in demand by employers vs skills available in candidates
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {d.skillDemand.slice(0,6).map(skill => {
                        const supply = d.skillSupply.find(s => s.label === skill.label)?.value || 0
                        const demand = skill.value
                        const gap = demand - supply
                        return (
                          <div key={skill.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:'var(--ivory)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                            <span style={{ width:140, fontSize:13, fontWeight:500 }}>{skill.label}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', gap:4, marginBottom:3 }}>
                                <span style={{ fontSize:11, color:'var(--blue)' }}>Demand: {demand}</span>
                                <span style={{ fontSize:11, color:'var(--muted)' }}>·</span>
                                <span style={{ fontSize:11, color:'var(--green)' }}>Supply: {supply}</span>
                              </div>
                              <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', position:'relative' }}>
                                <div style={{ position:'absolute', height:'100%', width:`${Math.min((supply/Math.max(demand,1))*100,100)}%`, background:'var(--green)', borderRadius:4 }}/>
                                <div style={{ position:'absolute', height:'100%', width:`${Math.min((demand/Math.max(demand,1))*100,100)}%`, background:'rgba(26,74,122,0.25)', borderRadius:4 }}/>
                              </div>
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color: gap > 0 ? 'var(--red)' : 'var(--green)', width:70, textAlign:'right' }}>
                              {gap > 0 ? `−${gap} gap` : `+${Math.abs(gap)} surplus`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════ JOBS TAB ════ */}
      {tab === 'jobs' && (
        <div>
          {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>{jobs.length} total postings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ transition:'none' }}>
                <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'14px 20px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{job.title}</div>
                    <div style={{ fontSize:'13px', color:'var(--muted)' }}>
                      {job.company} · {job.location || job.locationType} · {job.jobType}
                      {job.salary && ` · ${job.salary}`}
                    </div>
                    <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:2 }}>
                      by {job.postedByName || job.postedByEmail} · {job.applicantCount || 0} applicants
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span className={`badge badge-${job.status==='active'?'green':'muted'}`}>{job.status}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleJobStatus(job)}>{job.status==='active'?'Close':'Reopen'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteJob(job.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && jobs.length === 0 && <Empty icon="💼" msg="No job postings yet"/>}
          </div>
        </div>
      )}

      {/* ════ APPLICATIONS TAB ════ */}
      {tab === 'apps' && (
        <div>
          {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>
            {apps.length} total · {apps.filter(a => a.status==='pending').length} pending
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {apps.map(app => (
              <div key={app.id} className="card" style={{ transition:'none' }}>
                <div className="card-body" style={{ padding:'14px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{app.applicantName}<span style={{ color:'var(--muted)', fontWeight:400 }}> → </span>{app.jobTitle}</div>
                      <div style={{ fontSize:'13px', color:'var(--muted)' }}>
                        {app.applicantEmail}{app.applicantPhone && ` · ${app.applicantPhone}`}{app.applicantKovil && ` · ${app.applicantKovil} Kovil`}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span className={`badge ${sBadge(app.status)}`}>{app.status}</span>
                      <select className="form-control" style={{ width:150, padding:'5px 10px', fontSize:'13px' }}
                        value={app.status} onChange={e => updateAppStatus(app, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  {app.coverLetter && (
                    <div style={{ marginTop:10, fontSize:'13px', color:'var(--slate)', background:'var(--ivory)', padding:'8px 12px', borderRadius:4, fontStyle:'italic' }}>
                      "{app.coverLetter.slice(0,240)}{app.coverLetter.length>240?'…':''}"
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && apps.length === 0 && <Empty icon="📨" msg="No applications yet"/>}
          </div>
        </div>
      )}

      {/* ════ MEMBERS TAB ════ */}
      {tab === 'users' && (
        <div>
          {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>{users.length} registered members</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {users.map(u => (
              <div key={u.id} className="card" style={{ transition:'none' }}>
                <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'12px 20px' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={S.av}>
                      {u.photoURL ? <img src={u.photoURL} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} alt=""/> : (u.displayName?.[0]?.toUpperCase()||'?')}
                    </div>
                    <div>
                      <div style={{ fontWeight:600 }}>{u.displayName||'(no name)'}</div>
                      <div style={{ fontSize:'13px', color:'var(--muted)' }}>{u.email}{u.kovil&&` · ${u.kovil}`}{u.city&&` · ${u.city}`}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span className={`badge badge-${u.role==='admin'?'gold':'muted'}`}>{u.role||'member'}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleUserRole(u)}>{u.role==='admin'?'Remove Admin':'Make Admin'}</button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && users.length === 0 && <Empty icon="👥" msg="No members yet"/>}
          </div>
        </div>
      )}

      {/* ════ SKILLS MASTER TAB ════ */}
      {tab === 'skills' && (
        <div>
          <div className="card" style={{ marginBottom:20 }}>
            <div className="card-body">
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', marginBottom:14 }}>Add New Skill</h3>
              <div style={{ display:'flex', gap:10 }}>
                <input className="form-control" value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addSkill())}
                  placeholder="e.g. SEBI Certification, Meenakari Work…" style={{ flex:1 }}/>
                <button className="btn btn-primary" onClick={addSkill}>+ Add Skill</button>
              </div>
            </div>
          </div>
          {skillSuggestions.length > 0 && (
            <div className="card" style={{ marginBottom:20 }}>
              <div className="card-body">
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', marginBottom:14 }}>
                  User Suggestions ({skillSuggestions.length})
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {skillSuggestions.map(sug => (
                    <div key={sug.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--gold-pale)', borderRadius:'var(--radius)', border:'1px solid #E0C97A' }}>
                      <span style={{ fontWeight:600 }}>{sug.name}</span>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => approveSuggestion(sug)}>✓ Approve</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => rejectSuggestion(sug)}>✕ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', marginBottom:14 }}>
                Approved Skills ({skills.length})
              </h3>
              {loading && <p style={{ color:'var(--muted)' }}>Loading…</p>}
              <div className="tag-list">
                {skills.map((skill, i) => (
                  <span key={skill.id||i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'var(--ivory)', border:'1px solid var(--border)', fontSize:'13px' }}>
                    {skill.name||skill}
                    <button onClick={() => deleteSkill(skill)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'14px', padding:0 }}>×</button>
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

function sBadge(s) { return { pending:'badge-blue', shortlisted:'badge-gold', interview:'badge-blue', hired:'badge-green', rejected:'badge-muted' }[s]||'badge-muted' }
function Empty({ icon, msg }) { return <div className="empty-state" style={{ padding:'32px 0' }}><div className="icon">{icon}</div><p>{msg}</p></div> }
const S = { av: { width:36, height:36, borderRadius:'50%', background:'var(--gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem', flexShrink:0, overflow:'hidden' } }
