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

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab]     = useState('overview')
  const [stats, setStats] = useState({ users: 0, jobs: 0, apps: 0, pending: 0 })
  const [jobs, setJobs]   = useState([])
  const [apps, setApps]   = useState([])
  const [users, setUsers] = useState([])
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadStats()
    runFollowUpChecks().then(r => {
      if (r.pendingApps + r.noResponseApps + r.dormantMembers > 0) {
        showToast(`Follow-up emails triggered: ${r.pendingApps + r.noResponseApps + r.dormantMembers}`)
      }
    }).catch(() => {})
  }, [])
  useEffect(() => {
    if (tab === 'jobs')   loadJobs()
    if (tab === 'apps')   loadApps()
    if (tab === 'users')  loadUsers()
    if (tab === 'skills') loadSkills()
  }, [tab])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function loadStats() {
    const [u, j, a, p] = await Promise.all([
      getCountFromServer(collection(db, 'nj_users')),
      getCountFromServer(query(collection(db, 'nj_jobs'), where('status', '==', 'active'))),
      getCountFromServer(collection(db, 'nj_applications')),
      getCountFromServer(query(collection(db, 'nj_applications'), where('status', '==', 'pending'))),
    ])
    setStats({ users: u.data().count, jobs: j.data().count, apps: a.data().count, pending: p.data().count })
  }

  async function loadJobs() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'nj_jobs'), orderBy('createdAt', 'desc')))
    setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function loadApps() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'nj_applications'), orderBy('createdAt', 'desc')))
    setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function loadUsers() {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'nj_users'), orderBy('createdAt', 'desc')))
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function loadSkills() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'nj_skills'), orderBy('name')))
      if (snap.empty) {
        // Seed default skills on first load
        for (const name of DEFAULT_SKILLS) {
          await addDoc(collection(db, 'nj_skills'), { name, createdAt: serverTimestamp(), approved: true })
        }
        setSkills(DEFAULT_SKILLS.map(name => ({ name, approved: true })))
      } else {
        setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
      // Load suggestions
      const suggSnap = await getDocs(query(collection(db, 'nj_skill_suggestions'), orderBy('createdAt', 'desc')))
      setSkillSuggestions(suggSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } finally { setLoading(false) }
  }

  async function addSkill() {
    const name = newSkill.trim()
    if (!name) return
    if (skills.find(s => s.name?.toLowerCase() === name.toLowerCase())) {
      showToast('Skill already exists'); return
    }
    await addDoc(collection(db, 'nj_skills'), { name, approved: true, createdAt: serverTimestamp() })
    setSkills(s => [...s, { name, approved: true }].sort((a,b) => a.name.localeCompare(b.name)))
    setNewSkill('')
    showToast(`Skill "${name}" added`)
  }

  async function deleteSkill(skill) {
    if (!confirm(`Delete skill "${skill.name}"?`)) return
    if (skill.id) await deleteDoc(doc(db, 'nj_skills', skill.id))
    setSkills(s => s.filter(x => x.name !== skill.name))
    showToast('Skill deleted')
  }

  async function approveSuggestion(sug) {
    await addDoc(collection(db, 'nj_skills'), { name: sug.name, approved: true, createdAt: serverTimestamp() })
    await deleteDoc(doc(db, 'nj_skill_suggestions', sug.id))
    setSkills(s => [...s, { name: sug.name, approved: true }].sort((a,b) => a.name.localeCompare(b.name)))
    setSkillSuggestions(s => s.filter(x => x.id !== sug.id))
    showToast(`"${sug.name}" approved and added to skill list`)
  }

  async function rejectSuggestion(sug) {
    await deleteDoc(doc(db, 'nj_skill_suggestions', sug.id))
    setSkillSuggestions(s => s.filter(x => x.id !== sug.id))
    showToast('Suggestion rejected')
  }

  async function toggleJobStatus(job) {
    const newStatus = job.status === 'active' ? 'closed' : 'active'
    await updateDoc(doc(db, 'nj_jobs', job.id), { status: newStatus })
    setJobs(j => j.map(x => x.id === job.id ? { ...x, status: newStatus } : x))
    showToast(`Job ${newStatus}`)
    loadStats()
  }

  async function deleteJob(id) {
    if (!confirm('Delete this job? Cannot be undone.')) return
    await deleteDoc(doc(db, 'nj_jobs', id))
    setJobs(j => j.filter(x => x.id !== id))
    showToast('Job deleted'); loadStats()
  }

  async function updateAppStatus(app, newStatus) {
    await updateDoc(doc(db, 'nj_applications', app.id), { status: newStatus })
    setApps(a => a.map(x => x.id === app.id ? { ...x, status: newStatus } : x))
    logStatusChange({
      adminUid: user?.uid, applicationId: app.id,
      applicantUid: app.applicantUid, applicantName: app.applicantName,
      applicantEmail: app.applicantEmail, jobTitle: app.jobTitle,
      oldStatus: app.status, newStatus,
    }).catch(() => {})
    sendStatusUpdate({
      to_email: app.applicantEmail, applicant_name: app.applicantName,
      job_title: app.jobTitle, status: newStatus,
    }).catch(() => {})
    showToast(`Status → ${newStatus} (applicant notified by email)`)
  }

  async function toggleUserRole(u) {
    const newRole = u.role === 'admin' ? 'member' : 'admin'
    await updateDoc(doc(db, 'nj_users', u.id), { role: newRole })
    setUsers(us => us.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    showToast(`${u.displayName} → ${newRole}`)
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{user?.email}</p>
        </div>
        <span className="badge badge-gold" style={{ fontSize: '13px', padding: '6px 14px' }}>⚡ Admin</span>
      </div>

      {toast && (
        <div className="alert alert-success" style={{ position: 'fixed', top: 80, right: 20, zIndex: 200, width: 'auto', minWidth: 260, boxShadow: 'var(--shadow-lg)' }}>
          ✓ {toast}
        </div>
      )}

      <div className="tabs">
        {[
          ['overview', '📊 Overview'],
          ['jobs',    '💼 Jobs'],
          ['apps',    `📨 Applications${stats.pending > 0 ? ` (${stats.pending})` : ''}`],
          ['users',   '👥 Members'],
          ['skills',  '🏷 Skills Master'],
        ].map(([v, l]) => (
          <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Members',       value: stats.users,   icon: '👥', color: 'var(--blue)' },
              { label: 'Active Jobs',   value: stats.jobs,    icon: '💼', color: 'var(--green)' },
              { label: 'Applications',  value: stats.apps,    icon: '📨', color: 'var(--gold)' },
              { label: 'Pending Review',value: stats.pending, icon: '⏳', color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.6rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', marginBottom: 14 }}>Automated Emails</h3>
              {[
                { icon: '👋', label: 'Welcome email',         when: 'On new member registration (email or Google)' },
                { icon: '📩', label: 'Employer notification', when: 'When someone applies to their job' },
                { icon: '✅', label: 'Application receipt',   when: 'Sent to applicant confirming their application' },
                { icon: '🔔', label: 'Status update',         when: 'When you change application status below' },
              ].map(e => (
                <div key={e.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 12px', background: 'var(--ivory)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <span style={{ fontSize: '1.3rem' }}>{e.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{e.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{e.when}</div>
                  </div>
                </div>
              ))}
              <p style={{ marginTop: 10, fontSize: '13px', color: 'var(--muted)' }}>
                Add <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 3 }}>VITE_EMAILJS_*</code> env vars in Vercel to activate email notifications.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── JOBS ── */}
      {tab === 'jobs' && (
        <div>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 12 }}>{jobs.length} total postings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ transition: 'none' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{job.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      {job.company} · {job.location || job.locationType} · {job.jobType}
                      {job.salary && ` · ${job.salary}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                      by {job.postedByName || job.postedByEmail} · {job.applicantCount || 0} applicants
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge badge-${job.status === 'active' ? 'green' : 'muted'}`}>{job.status}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleJobStatus(job)}>
                      {job.status === 'active' ? 'Close' : 'Reopen'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteJob(job.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && jobs.length === 0 && <Empty icon="💼" msg="No job postings yet" />}
          </div>
        </div>
      )}

      {/* ── APPLICATIONS ── */}
      {tab === 'apps' && (
        <div>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 12 }}>
            {apps.length} total · {apps.filter(a => a.status === 'pending').length} pending
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {apps.map(app => (
              <div key={app.id} className="card" style={{ transition: 'none' }}>
                <div className="card-body" style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {app.applicantName}
                        <span style={{ color: 'var(--muted)', fontWeight: 400 }}> → </span>
                        {app.jobTitle}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {app.applicantEmail}
                        {app.applicantPhone && ` · ${app.applicantPhone}`}
                        {app.applicantKovil && ` · ${app.applicantKovil} Kovil`}
                        {app.applicantCity && ` · ${app.applicantCity}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge ${statusBadge(app.status)}`}>{app.status}</span>
                      <select className="form-control" style={{ width: 150, padding: '5px 10px', fontSize: '13px' }}
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
                    <div style={{ marginTop: 10, fontSize: '13px', color: 'var(--slate)', background: 'var(--ivory)', padding: '8px 12px', borderRadius: 4, lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{app.coverLetter.slice(0, 240)}{app.coverLetter.length > 240 ? '…' : ''}"
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && apps.length === 0 && <Empty icon="📨" msg="No applications yet" />}
          </div>
        </div>
      )}

      {/* ── MEMBERS ── */}
      {tab === 'users' && (
        <div>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 12 }}>{users.length} registered members</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <div key={u.id} className="card" style={{ transition: 'none' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 20px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={S.avatar}>
                      {u.photoURL
                        ? <img src={u.photoURL} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : (u.displayName?.[0]?.toUpperCase() || '?')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.displayName || '(no name)'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {u.email}{u.kovil && ` · ${u.kovil}`}{u.city && ` · ${u.city}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge badge-${u.role === 'admin' ? 'gold' : 'muted'}`}>{u.role || 'member'}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleUserRole(u)}>
                      {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && users.length === 0 && <Empty icon="👥" msg="No members yet" />}
          </div>
        </div>
      )}

      {/* ── SKILLS MASTER ── */}
      {tab === 'skills' && (
        <div>
          {/* Add new skill */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', marginBottom: 14 }}>
                Add New Skill
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="form-control" value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="e.g. SEBI Certification, Meenakari Work, Swift Banking…"
                  style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={addSkill}>+ Add Skill</button>
              </div>
            </div>
          </div>

          {/* Pending suggestions */}
          {skillSuggestions.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', marginBottom: 4 }}>
                  User Suggestions ({skillSuggestions.length})
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 14 }}>
                  Skills suggested by users while posting jobs — approve to add to master list
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {skillSuggestions.map(sug => (
                    <div key={sug.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--gold-pale)', borderRadius: 'var(--radius)', border: '1px solid #E0C97A' }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{sug.name}</span>
                        {sug.suggestedBy && <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: 8 }}>suggested by {sug.suggestedBy}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => approveSuggestion(sug)}>✓ Approve</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => rejectSuggestion(sug)}>✕ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full skill list */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', marginBottom: 4 }}>
                Approved Skills ({skills.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 16 }}>
                These appear in the job posting and profile forms for selection
              </p>
              {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
              <div className="tag-list">
                {skills.map((skill, i) => (
                  <span key={skill.id || i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'var(--ivory)', border: '1px solid var(--border)', fontSize: '13px' }}>
                    {skill.name || skill}
                    <button type="button" onClick={() => deleteSkill(skill)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', lineHeight: 1, padding: 0 }}
                      title="Delete skill">
                      ×
                    </button>
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

function statusBadge(s) {
  return { pending: 'badge-blue', shortlisted: 'badge-gold', interview: 'badge-blue', hired: 'badge-green', rejected: 'badge-muted' }[s] || 'badge-muted'
}
function Empty({ icon, msg }) {
  return <div className="empty-state" style={{ padding: '32px 0' }}><div className="icon">{icon}</div><p>{msg}</p></div>
}
const S = {
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem', flexShrink: 0, overflow: 'hidden',
  },
}
