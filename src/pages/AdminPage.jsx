// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, getDocs, doc, updateDoc,
  deleteDoc, getCountFromServer, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { sendStatusUpdate } from '../utils/emailjs'

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab]     = useState('overview')
  const [stats, setStats] = useState({ users: 0, jobs: 0, apps: 0, pending: 0 })
  const [jobs, setJobs]   = useState([])
  const [apps, setApps]   = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { loadStats() }, [])
  useEffect(() => {
    if (tab === 'jobs')  loadJobs()
    if (tab === 'apps')  loadApps()
    if (tab === 'users') loadUsers()
  }, [tab])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

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

  async function toggleJobStatus(job) {
    const newStatus = job.status === 'active' ? 'closed' : 'active'
    await updateDoc(doc(db, 'nj_jobs', job.id), { status: newStatus })
    setJobs(j => j.map(x => x.id === job.id ? { ...x, status: newStatus } : x))
    showToast(`Job ${newStatus === 'active' ? 'reopened' : 'closed'}`)
    loadStats()
  }

  async function deleteJob(id) {
    if (!confirm('Delete this job posting? This cannot be undone.')) return
    await deleteDoc(doc(db, 'nj_jobs', id))
    setJobs(j => j.filter(x => x.id !== id))
    showToast('Job deleted')
    loadStats()
  }

  async function updateAppStatus(app, newStatus) {
    await updateDoc(doc(db, 'nj_applications', app.id), { status: newStatus })
    setApps(a => a.map(x => x.id === app.id ? { ...x, status: newStatus } : x))
    // Automated email to applicant on status change
    sendStatusUpdate({
      to_email:       app.applicantEmail,
      applicant_name: app.applicantName,
      job_title:      app.jobTitle,
      status:         newStatus,
    }).catch(() => {})
    showToast(`Status updated → ${newStatus} (applicant notified)`)
  }

  async function toggleUserRole(u) {
    const newRole = u.role === 'admin' ? 'member' : 'admin'
    await updateDoc(doc(db, 'nj_users', u.id), { role: newRole })
    setUsers(us => us.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    showToast(`${u.displayName} is now ${newRole}`)
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Signed in as {user?.email}</p>
        </div>
        <span className="badge badge-gold" style={{ marginTop: 8, fontSize: '13px', padding: '5px 14px' }}>
          ⚡ Admin
        </span>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="alert alert-success" style={{ position: 'fixed', top: 80, right: 20, zIndex: 200, width: 'auto', boxShadow: 'var(--shadow-md)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          ['overview', '📊 Overview'],
          ['jobs',     '💼 Jobs'],
          ['apps',     `📨 Applications${stats.pending > 0 ? ` (${stats.pending})` : ''}`],
          ['users',    '👥 Members'],
        ].map(([v, l]) => (
          <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div className="grid-3" style={{ marginBottom: 32 }}>
            {[
              { label: 'Registered Members', value: stats.users,   icon: '👥', color: 'var(--blue)' },
              { label: 'Active Job Listings', value: stats.jobs,   icon: '💼', color: 'var(--green)' },
              { label: 'Total Applications',  value: stats.apps,   icon: '📨', color: 'var(--gold)' },
              { label: 'Pending Review',       value: stats.pending, icon: '⏳', color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', marginBottom: 12 }}>
                Automated Emails
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '👋', label: 'Welcome email',        when: 'On new user registration (email or Google)' },
                  { icon: '📩', label: 'Employer notification', when: 'When someone applies to their job posting' },
                  { icon: '✅', label: 'Application receipt',   when: 'Sent to applicant confirming their application' },
                  { icon: '🔔', label: 'Status update',         when: 'When admin changes application status here' },
                ].map(e => (
                  <div key={e.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'var(--ivory)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.4rem' }}>{e.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{e.label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{e.when}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 14, fontSize: '13px', color: 'var(--muted)' }}>
                Configure via EmailJS — add <code style={{ background: 'var(--border)', padding: '1px 6px', borderRadius: 3 }}>VITE_EMAILJS_*</code> env vars in Vercel to activate.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ transition: 'none' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '16px 20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{job.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      {job.company} · {job.location} · posted by <strong>{job.postedByName || job.postedByEmail}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span className={`badge badge-${job.status === 'active' ? 'green' : 'muted'}`}>{job.status}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleJobStatus(job)}>
                      {job.status === 'active' ? 'Close' : 'Reopen'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteJob(job.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && jobs.length === 0 && <EmptyState icon="💼" msg="No job postings yet" />}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apps.map(app => (
              <div key={app.id} className="card" style={{ transition: 'none' }}>
                <div className="card-body" style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {app.applicantName}
                        <span style={{ fontWeight: 400, color: 'var(--muted)' }}> → </span>
                        {app.jobTitle}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 2 }}>
                        {app.applicantEmail} · {app.jobCompany}
                        {app.applicantPhone && ` · ${app.applicantPhone}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span className={`badge ${statusBadge(app.status)}`}>{app.status}</span>
                      <select
                        className="form-control"
                        style={{ width: 150, padding: '5px 10px', fontSize: '13px' }}
                        value={app.status}
                        onChange={e => updateAppStatus(app, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  {app.coverLetter && (
                    <div style={{ marginTop: 10, fontSize: '13px', color: 'var(--slate)', background: 'var(--ivory)', padding: '8px 12px', borderRadius: 4, lineHeight: 1.6 }}>
                      "{app.coverLetter.slice(0, 200)}{app.coverLetter.length > 200 ? '…' : ''}"
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && apps.length === 0 && <EmptyState icon="📨" msg="No applications yet" />}
          </div>
        </div>
      )}

      {/* ── USERS / MEMBERS ── */}
      {tab === 'users' && (
        <div>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 12 }}>{users.length} registered members</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <div key={u.id} className="card" style={{ transition: 'none' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={S.avatar}>
                      {u.photoURL
                        ? <img src={u.photoURL} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        : (u.displayName?.[0]?.toUpperCase() || '?')
                      }
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.displayName || '(no name)'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {u.email}
                        {u.kovil && ` · ${u.kovil}`}
                        {u.city  && ` · ${u.city}`}
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
            {!loading && users.length === 0 && <EmptyState icon="👥" msg="No members yet" />}
          </div>
        </div>
      )}
    </div>
  )
}

function statusBadge(s) {
  return { pending: 'badge-blue', shortlisted: 'badge-gold', interview: 'badge-blue', hired: 'badge-green', rejected: 'badge-muted' }[s] || 'badge-muted'
}

function EmptyState({ icon, msg }) {
  return (
    <div className="empty-state" style={{ padding: '40px 0' }}>
      <div className="icon">{icon}</div>
      <p>{msg}</p>
    </div>
  )
}

const S = {
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'var(--gold)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem', flexShrink: 0, overflow: 'hidden',
  },
}
