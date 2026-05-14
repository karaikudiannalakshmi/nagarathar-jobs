// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { KOVILS, INDUSTRIES, DEFAULT_SKILLS, GENDER_OPTIONS, EDUCATION_LEVELS, SALARY_RANGES } from '../utils/constants'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [tab, setTab]     = useState('profile')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [myJobs, setMyJobs]   = useState([])
  const [myApps, setMyApps]   = useState([])
  const [form, setForm] = useState({
    displayName:  profile?.displayName  || '',
    kovil:        profile?.kovil        || '',
    pirivu:       profile?.pirivu       || '',
    phone:        profile?.phone        || '',
    city:         profile?.city         || '',
    bio:          profile?.bio          || '',
    lookingFor:   profile?.lookingFor   || 'job',
    skills:       profile?.skills       || [],
    resumeText:   profile?.resumeText   || '',
    linkedinUrl:  profile?.linkedinUrl  || '',
    industry:             profile?.industry             || '',
    gender:               profile?.gender               || '',
    currentQualification: profile?.currentQualification  || '',
    workExperience:       profile?.workExperience         || '',
    currentSalary:        profile?.currentSalary          || '',
    expectedSalary:       profile?.expectedSalary         || '',
    preferredLocation:    profile?.preferredLocation       || '',
  })

  useEffect(() => {
    if (tab === 'jobs') loadMyJobs()
    if (tab === 'apps') loadMyApps()
  }, [tab])

  async function loadMyJobs() {
    const q = query(collection(db, 'nj_jobs'), where('postedBy', '==', user.uid), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setMyJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function loadMyApps() {
    const q = query(collection(db, 'nj_applications'), where('applicantUid', '==', user.uid), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setMyApps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  function toggleSkill(s) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoc(doc(db, 'nj_users', user.uid), form)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">{user.email}</p>

      <div className="tabs">
        {[['profile','👤 Profile'], ['jobs','📋 My Jobs'], ['apps','📨 Applications']].map(([v,l]) => (
          <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <form onSubmit={handleSave}>
          {saved && <div className="alert alert-success">Profile saved ✓</div>}

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Personal Details</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={form.displayName} onChange={set('displayName')} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Kovil</label>
                  <select className="form-control" value={form.kovil} onChange={set('kovil')}>
                    <option value="">Select Kovil</option>
                    {KOVILS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pirivu</label>
                  <input className="form-control" value={form.pirivu} onChange={set('pirivu')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" type="tel" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input className="form-control" value={form.city} onChange={set('city')} />
                </div>
              </div>
              <div className="form-group">
                <label>Industry / Profession</label>
                <select className="form-control" value={form.industry} onChange={set('industry')}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select className="form-control" value={form.gender} onChange={set('gender')}>
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>LinkedIn / Website</label>
                <input className="form-control" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://…" />
              </div>
              <div className="form-group">
                <label>About Me</label>
                <textarea className="form-control" rows={3} value={form.bio} onChange={set('bio')}
                  placeholder="Brief professional summary…" />
              </div>
              <div className="form-group">
                <label>I am here to…</label>
                <select className="form-control" value={form.lookingFor} onChange={set('lookingFor')}>
                  <option value="job">Find a Job</option>
                  <option value="hire">Hire / Post Jobs</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidate professional details */}
          {(profile?.lookingFor === 'job' || profile?.lookingFor === 'both') && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Professional Details</h2>
                <div className="form-group">
                  <label>Current Qualification</label>
                  <select className="form-control" value={form.currentQualification} onChange={set('currentQualification')}>
                    <option value="">Select Qualification</option>
                    {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Work Experience</label>
                    <select className="form-control" value={form.workExperience} onChange={set('workExperience')}>
                      <option value="">Select Experience</option>
                      <option value="Fresher">Fresher / No experience</option>
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-2 years">1–2 years</option>
                      <option value="2-5 years">2–5 years</option>
                      <option value="5-10 years">5–10 years</option>
                      <option value="10-15 years">10–15 years</option>
                      <option value="15+ years">15+ years</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Preferred Job Location</label>
                    <input className="form-control" value={form.preferredLocation} onChange={set('preferredLocation')} placeholder="Chennai, Remote, Any…" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Current Salary</label>
                    <select className="form-control" value={form.currentSalary} onChange={set('currentSalary')}>
                      <option value="">Select Range</option>
                      {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expected Salary</label>
                    <select className="form-control" value={form.expectedSalary} onChange={set('expectedSalary')}>
                      <option value="">Select Range</option>
                      {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Skills</h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 16 }}>Select your skills</p>
              <div className="tag-list">
                {DEFAULT_SKILLS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSkill(s)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: '13px', cursor: 'pointer',
                      border: form.skills.includes(s) ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                      background: form.skills.includes(s) ? 'var(--gold-pale)' : 'var(--white)',
                      color: form.skills.includes(s) ? 'var(--gold)' : 'var(--slate)',
                      transition: 'all 0.15s',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Resume / CV</h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 16 }}>Paste your resume text so employers can find you</p>
              <textarea className="form-control" rows={8} value={form.resumeText} onChange={set('resumeText')}
                placeholder="Paste your resume or professional summary here…" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ── My Jobs Tab ── */}
      {tab === 'jobs' && (
        <div>
          {myJobs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No jobs posted yet</h3>
              <p>Ready to find great talent?</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myJobs.map(job => (
                <div key={job.id} className="card">
                  <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{job.title}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{job.company} · {job.location}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge badge-${job.status === 'active' ? 'green' : 'muted'}`}>{job.status}</span>
                      <Link to={`/jobs/${job.id}/edit`} className="btn btn-ghost btn-sm">✏️ Edit</Link>
                      <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">View</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Applications Tab ── */}
      {tab === 'apps' && (
        <div>
          {myApps.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📨</div>
              <h3>No applications yet</h3>
              <p>Browse jobs and apply today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myApps.map(app => (
                <div key={app.id} className="card">
                  <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{app.jobTitle}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{app.jobCompany}</div>
                    </div>
                    <span className={`badge badge-${app.status === 'pending' ? 'blue' : app.status === 'shortlisted' ? 'green' : 'muted'}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
