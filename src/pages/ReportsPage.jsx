// src/pages/ReportsPage.jsx
import { useState, useEffect } from 'react'
import {
  collection, query, where, orderBy, getDocs, limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const TABS = [
  ['activity',  '📋 Activity Log'],
  ['funnel',    '📊 Application Funnel'],
  ['jobs',      '💼 Job Performance'],
  ['profiles',  '👁 Profile Views'],
  ['logins',    '🕐 Login Activity'],
  ['skills',    '🏷 Skills Demand'],
  ['followups', '📨 Follow-ups Sent'],
]

export default function ReportsPage() {
  const [tab, setTab]     = useState('activity')
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('30') // days

  // Data states
  const [activityLog,   setActivityLog]   = useState([])
  const [funnelData,    setFunnelData]    = useState(null)
  const [jobPerf,       setJobPerf]       = useState([])
  const [profileViews,  setProfileViews]  = useState([])
  const [loginActivity, setLoginActivity] = useState([])
  const [skillsDemand,  setSkillsDemand]  = useState([])
  const [followUps,     setFollowUps]     = useState([])

  useEffect(() => {
    loadTab(tab)
  }, [tab, dateRange])

  async function loadTab(t) {
    setLoading(true)
    const since = Timestamp.fromDate(new Date(Date.now() - parseInt(dateRange) * 86400000))
    try {
      if (t === 'activity')  await loadActivityLog(since)
      if (t === 'funnel')    await loadFunnel(since)
      if (t === 'jobs')      await loadJobPerf(since)
      if (t === 'profiles')  await loadProfileViews(since)
      if (t === 'logins')    await loadLoginActivity(since)
      if (t === 'skills')    await loadSkillsDemand()
      if (t === 'followups') await loadFollowUps(since)
    } finally { setLoading(false) }
  }

  async function loadActivityLog(since) {
    const q = query(collection(db, 'nj_activity'), orderBy('createdAt', 'desc'), limit(200))
    const snap = await getDocs(q)
    setActivityLog(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function loadFunnel(since) {
    const snap = await getDocs(collection(db, 'nj_applications'))
    const apps = snap.docs.map(d => d.data())
    const total     = apps.length
    const pending   = apps.filter(a => a.status === 'pending').length
    const shortlist = apps.filter(a => ['shortlisted','interview','hired'].includes(a.status)).length
    const interview = apps.filter(a => ['interview','hired'].includes(a.status)).length
    const hired     = apps.filter(a => a.status === 'hired').length
    const rejected  = apps.filter(a => a.status === 'rejected').length

    // Per-job breakdown
    const byJob = {}
    apps.forEach(a => {
      if (!byJob[a.jobTitle]) byJob[a.jobTitle] = { title: a.jobTitle, company: a.jobCompany, total: 0, shortlisted: 0, hired: 0 }
      byJob[a.jobTitle].total++
      if (['shortlisted','interview','hired'].includes(a.status)) byJob[a.jobTitle].shortlisted++
      if (a.status === 'hired') byJob[a.jobTitle].hired++
    })

    setFunnelData({ total, pending, shortlist, interview, hired, rejected, byJob: Object.values(byJob).sort((a,b) => b.total - a.total) })
  }

  async function loadJobPerf(since) {
    const snap = await getDocs(query(collection(db, 'nj_jobs'), orderBy('createdAt', 'desc'), limit(100)))
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Get application counts per job
    const appSnap = await getDocs(collection(db, 'nj_applications'))
    const appCounts = {}
    appSnap.docs.forEach(d => {
      const jid = d.data().jobId
      appCounts[jid] = (appCounts[jid] || 0) + 1
    })
    const enriched = jobs.map(j => ({ ...j, appCount: appCounts[j.id] || 0 }))
      .sort((a,b) => b.appCount - a.appCount)
    setJobPerf(enriched)
  }

  async function loadProfileViews(since) {
    const q = query(
      collection(db, 'nj_activity'),
      where('eventType', '==', 'profile_view'),
      orderBy('createdAt', 'desc'),
      limit(200)
    )
    const snap = await getDocs(q)
    const views = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Aggregate by target profile
    const byTarget = {}
    views.forEach(v => {
      const key = v.targetUid
      if (!byTarget[key]) byTarget[key] = { name: v.targetName, email: v.targetEmail, uid: v.targetUid, views: 0, viewers: [] }
      byTarget[key].views++
      if (!byTarget[key].viewers.find(x => x.uid === v.viewerUid)) {
        byTarget[key].viewers.push({ uid: v.viewerUid, name: v.viewerName, email: v.viewerEmail })
      }
    })
    setProfileViews({ raw: views, aggregated: Object.values(byTarget).sort((a,b) => b.views - a.views) })
  }

  async function loadLoginActivity(since) {
    const snap = await getDocs(query(collection(db, 'nj_users'), orderBy('lastSeen', 'desc'), limit(100)))
    setLoginActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function loadSkillsDemand() {
    const snap = await getDocs(collection(db, 'nj_jobs'))
    const skillCount = {}
    snap.docs.forEach(d => {
      const skills = d.data().requiredSkills || []
      skills.forEach(s => { skillCount[s] = (skillCount[s] || 0) + 1 })
    })
    const sorted = Object.entries(skillCount).sort((a,b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
    setSkillsDemand(sorted)
  }

  async function loadFollowUps(since) {
    const snap = await getDocs(query(collection(db, 'nj_followup_sent'), orderBy('sentAt', 'desc'), limit(100)))
    setFollowUps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Platform activity and insights</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>Period:</label>
          <select className="form-control" style={{ width: 130 }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 1 year</option>
          </select>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div style={{ overflowX: 'auto', marginBottom: 0 }}>
        <div className="tabs" style={{ minWidth: 700 }}>
          {TABS.map(([v,l]) => (
            <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      {/* ── ACTIVITY LOG ── */}
      {!loading && tab === 'activity' && (
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', margin: '16px 0 12px' }}>{activityLog.length} events recorded</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activityLog.map(ev => (
              <div key={ev.id} style={S.logRow}>
                <span style={eventBadge(ev.eventType)}>{eventLabel(ev.eventType)}</span>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--slate)' }}>
                  {eventDesc(ev)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {fmtDate(ev.createdAt?.toDate())}
                </span>
              </div>
            ))}
            {activityLog.length === 0 && <Empty icon="📋" msg="No activity recorded yet. Activity is logged as members use the platform." />}
          </div>
        </div>
      )}

      {/* ── APPLICATION FUNNEL ── */}
      {!loading && tab === 'funnel' && funnelData && (
        <div>
          {/* Funnel overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, margin: '20px 0' }}>
            {[
              { label: 'Applied',     value: funnelData.total,     color: 'var(--blue)',  pct: 100 },
              { label: 'Shortlisted', value: funnelData.shortlist,  color: 'var(--gold)',  pct: pct(funnelData.shortlist, funnelData.total) },
              { label: 'Interview',   value: funnelData.interview,  color: '#7B6CF6',      pct: pct(funnelData.interview, funnelData.total) },
              { label: 'Hired',       value: funnelData.hired,      color: 'var(--green)', pct: pct(funnelData.hired, funnelData.total) },
              { label: 'Rejected',    value: funnelData.rejected,   color: 'var(--red)',   pct: pct(funnelData.rejected, funnelData.total) },
            ].map(f => (
              <div key={f.label} className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '20px 12px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.4rem', fontWeight: 700, color: f.color }}>{f.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${f.pct}%`, background: f.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: 4 }}>{f.pct}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-job breakdown */}
          <div className="card">
            <div className="card-body">
              <h3 style={S.sectionHead}>Per-Job Breakdown</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Job Title', 'Company', 'Applied', 'Shortlisted', 'Hired', 'Conversion'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funnelData.byJob.map((j, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={S.td}>{j.title}</td>
                      <td style={{ ...S.td, color: 'var(--muted)' }}>{j.company}</td>
                      <td style={S.td}><strong>{j.total}</strong></td>
                      <td style={S.td}>{j.shortlisted}</td>
                      <td style={S.td}><span style={{ color: 'var(--green)', fontWeight: 600 }}>{j.hired}</span></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${pct(j.hired, j.total)}%`, background: 'var(--green)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{pct(j.hired, j.total)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {funnelData.byJob.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No applications yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── JOB PERFORMANCE ── */}
      {!loading && tab === 'jobs' && (
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', margin: '16px 0 12px' }}>Sorted by most applicants</div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--ivory)' }}>
                    {['Job Title', 'Company', 'Location', 'Type', 'Salary', 'Views', 'Applicants', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobPerf.map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...S.td, fontWeight: 600 }}>{j.title}</td>
                      <td style={S.td}>{j.company}</td>
                      <td style={{ ...S.td, color: 'var(--muted)' }}>{j.location || j.locationType || '—'}</td>
                      <td style={S.td}><span className="badge badge-blue">{j.jobType}</span></td>
                      <td style={{ ...S.td, color: 'var(--green)' }}>{j.salaryType === 'negotiable' ? 'Negot.' : (j.salary || '—')}</td>
                      <td style={S.td}>{j.views || 0}</td>
                      <td style={S.td}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 700, color: j.appCount > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                          {j.appCount}
                        </span>
                      </td>
                      <td style={S.td}><span className={`badge badge-${j.status === 'active' ? 'green' : 'muted'}`}>{j.status}</span></td>
                    </tr>
                  ))}
                  {jobPerf.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No jobs yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          {/* Dormant jobs alert */}
          {jobPerf.filter(j => j.status === 'active' && j.appCount === 0).length > 0 && (
            <div className="alert alert-info" style={{ marginTop: 16 }}>
              ⚠ <strong>{jobPerf.filter(j => j.status === 'active' && j.appCount === 0).length} active jobs</strong> have received no applicants yet.
              Consider reviewing their details or reaching out to the employer.
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE VIEWS ── */}
      {!loading && tab === 'profiles' && (
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', margin: '16px 0 12px' }}>
            {profileViews?.raw?.length || 0} total profile views recorded
          </div>
          {/* Aggregated by candidate */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h3 style={S.sectionHead}>Most Viewed Candidates</h3>
              {profileViews?.aggregated?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profileViews.aggregated.map((p, i) => (
                    <div key={p.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', background: 'var(--ivory)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          <span style={{ color: 'var(--muted)', marginRight: 8 }}>#{i+1}</span>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{p.email}</div>
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {p.viewers.slice(0,5).map(v => (
                            <span key={v.uid} style={{ fontSize: '12px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '2px 8px', color: 'var(--slate)' }}>
                              {v.name || v.email}
                            </span>
                          ))}
                          {p.viewers.length > 5 && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>+{p.viewers.length - 5} more</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>{p.views}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>views</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Empty icon="👁" msg="No profile views recorded yet" />}
            </div>
          </div>
          {/* Raw log */}
          <div className="card">
            <div className="card-body">
              <h3 style={S.sectionHead}>Raw View Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {profileViews?.raw?.slice(0, 50).map(v => (
                  <div key={v.id} style={S.logRow}>
                    <span style={{ ...eventBadge('profile_view'), minWidth: 80 }}>Profile View</span>
                    <span style={{ flex: 1, fontSize: '14px' }}>
                      <strong>{v.viewerName || v.viewerEmail}</strong>
                      <span style={{ color: 'var(--muted)' }}> viewed </span>
                      <strong>{v.targetName || v.targetEmail}</strong>'s profile
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{fmtDate(v.createdAt?.toDate())}</span>
                  </div>
                ))}
                {(!profileViews?.raw || profileViews.raw.length === 0) && <Empty icon="👁" msg="No views yet" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGIN ACTIVITY ── */}
      {!loading && tab === 'logins' && (
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', margin: '16px 0 12px' }}>Members sorted by most recent activity</div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--ivory)' }}>
                    {['Member', 'Kovil', 'City', 'Last Seen', 'Joined', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loginActivity.map(u => {
                    const daysSince = u.lastSeen ? Math.floor((Date.now() - u.lastSeen.toDate().getTime()) / 86400000) : null
                    const isDormant = daysSince === null || daysSince > 30
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: isDormant ? '#FFF9F9' : 'transparent' }}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600 }}>{u.displayName || '—'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ ...S.td, color: 'var(--muted)' }}>{u.kovil || '—'}</td>
                        <td style={{ ...S.td, color: 'var(--muted)' }}>{u.city || '—'}</td>
                        <td style={S.td}>
                          {u.lastSeen ? (
                            <span style={{ color: isDormant ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>
                              {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                            </span>
                          ) : <span style={{ color: 'var(--muted)' }}>Never</span>}
                        </td>
                        <td style={{ ...S.td, color: 'var(--muted)' }}>{u.createdAt ? fmtDate(u.createdAt.toDate()) : '—'}</td>
                        <td style={S.td}>
                          {isDormant
                            ? <span className="badge badge-red">Dormant</span>
                            : <span className="badge badge-green">Active</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {loginActivity.length === 0 && <Empty icon="🕐" msg="No login data yet" />}
            </div>
          </div>
        </div>
      )}

      {/* ── SKILLS DEMAND ── */}
      {!loading && tab === 'skills' && (
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', margin: '16px 0 12px' }}>
            Skills ranked by how often they appear in job postings
          </div>
          <div className="card">
            <div className="card-body">
              <h3 style={S.sectionHead}>Top Skills in Demand</h3>
              {skillsDemand.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {skillsDemand.map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 28, fontSize: '13px', color: 'var(--muted)', textAlign: 'right' }}>#{i+1}</span>
                      <span style={{ width: 200, fontSize: '14px', fontWeight: i < 3 ? 700 : 400 }}>{s.name}</span>
                      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4 }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${pct(s.count, skillsDemand[0]?.count)}%`,
                          background: i === 0 ? 'var(--gold)' : i < 3 ? 'var(--gold-light)' : 'var(--border)',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <span style={{ width: 40, fontSize: '14px', fontWeight: 600, color: 'var(--slate)', textAlign: 'right' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <Empty icon="🏷" msg="No skills data yet — skills are counted from job postings" />}
            </div>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UPS SENT ── */}
      {!loading && tab === 'followups' && (
        <div>
          <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 16 }}>
            Follow-up emails are automatically sent when: an application is pending 7+ days (to both employer and job seeker) or a member hasn't logged in for 30+ days. Each email is sent only once per trigger.
          </div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: 12 }}>{followUps.length} follow-up emails sent to date</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {followUps.map(f => (
              <div key={f.id} style={S.logRow}>
                <span style={followUpBadge(f.key)}>{followUpLabel(f.key)}</span>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--slate)', fontFamily: 'monospace', fontSize: '12px' }}>{f.key}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{fmtDate(f.sentAt?.toDate())}</span>
              </div>
            ))}
            {followUps.length === 0 && <Empty icon="📨" msg="No follow-up emails sent yet. They trigger automatically as activity occurs." />}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(a, b) { return b === 0 ? 0 : Math.round((a / b) * 100) }

function fmtDate(d) {
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function eventLabel(t) {
  return { profile_view: '👁 Profile View', job_view: '💼 Job View', application: '📨 Application', login: '🔑 Login', status_change: '🔄 Status Change' }[t] || t
}

function eventDesc(ev) {
  switch (ev.eventType) {
    case 'profile_view':  return <><strong>{ev.viewerName || ev.viewerEmail}</strong> viewed <strong>{ev.targetName || ev.targetEmail}</strong>'s profile</>
    case 'job_view':      return <><strong>{ev.viewerName || ev.viewerEmail}</strong> viewed job <strong>{ev.jobTitle}</strong> at {ev.jobCompany}</>
    case 'application':   return <><strong>{ev.applicantName}</strong> applied for <strong>{ev.jobTitle}</strong> at {ev.company}</>
    case 'login':         return <><strong>{ev.displayName || ev.email}</strong> signed in</>
    case 'status_change': return <><strong>{ev.applicantName}</strong>'s application for <strong>{ev.jobTitle}</strong> changed to <em>{ev.newStatus}</em></>
    default:              return JSON.stringify(ev)
  }
}

function eventBadge(t) {
  const colors = { profile_view: '#E8EEF5', job_view: '#E8F5EE', application: '#F5E9C8', login: '#F2EDE4', status_change: '#FDECEC' }
  const text   = { profile_view: 'var(--blue)', job_view: 'var(--green)', application: 'var(--gold)', login: 'var(--muted)', status_change: 'var(--red)' }
  return { padding: '3px 10px', borderRadius: 12, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', background: colors[t] || '#eee', color: text[t] || '#333' }
}

function followUpLabel(key) {
  if (key.startsWith('employer_7d'))  return '📩 Employer nudge'
  if (key.startsWith('seeker_7d'))    return '📨 Seeker nudge'
  if (key.startsWith('dormant_30d'))  return '💤 Dormant reminder'
  return '📧 Email'
}

function followUpBadge(key) {
  const bg = key.startsWith('employer') ? '#E8EEF5' : key.startsWith('seeker') ? '#F5E9C8' : '#F2EDE4'
  const color = key.startsWith('employer') ? 'var(--blue)' : key.startsWith('seeker') ? 'var(--gold)' : 'var(--muted)'
  return { padding: '3px 10px', borderRadius: 12, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', background: bg, color }
}

function Empty({ icon, msg }) {
  return <div className="empty-state" style={{ padding: '32px 0' }}><div className="icon">{icon}</div><p>{msg}</p></div>
}

const S = {
  logRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', background: 'var(--white)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  td: { padding: '10px 14px', verticalAlign: 'middle' },
  sectionHead: { fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', marginBottom: 16 },
}
