// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { KOVILS, INDUSTRIES, DEFAULT_SKILLS, GENDER_OPTIONS, EDUCATION_LEVELS, SALARY_RANGES } from '../utils/constants'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [tab, setTab]       = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [myJobs, setMyJobs] = useState([])
  const [myApps, setMyApps] = useState([])
  const [skillSearch, setSkillSearch] = useState('')

  const role = profile?.lookingFor === 'hire' ? 'employer'
             : profile?.lookingFor === 'both' ? 'both'
             : 'candidate'

  const [form, setForm] = useState({
    displayName:          profile?.displayName          || '',
    kovil:                profile?.kovil                || '',
    pirivu:               profile?.pirivu               || '',
    phone:                profile?.phone                || '',
    city:                 profile?.city                 || '',
    gender:               profile?.gender               || '',
    lookingFor:           profile?.lookingFor           || 'job',
    // Candidate fields
    industry:             profile?.industry             || '',
    currentQualification: profile?.currentQualification || '',
    workExperience:       profile?.workExperience       || '',
    currentSalary:        profile?.currentSalary        || '',
    expectedSalary:       profile?.expectedSalary       || '',
    preferredLocation:    profile?.preferredLocation    || '',
    skills:               profile?.skills               || [],
    resumeText:           profile?.resumeText           || '',
    linkedinUrl:          profile?.linkedinUrl          || '',
    bio:                  profile?.bio                  || '',
    // Employer fields
    companyName:          profile?.companyName          || '',
    designation:          profile?.designation          || '',
    companyIndustry:      profile?.companyIndustry      || profile?.industry || '',
    companyWebsite:       profile?.companyWebsite       || '',
    companyDesc:          profile?.companyDesc          || '',
  })

  useEffect(() => {
    if (tab === 'jobs') loadMyJobs()
    if (tab === 'apps') loadMyApps()
  }, [tab])

  async function loadMyJobs() {
    const snap = await getDocs(query(collection(db, 'nj_jobs'), where('postedBy', '==', user.uid)))
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    jobs.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
    setMyJobs(jobs)
  }
  async function loadMyApps() {
    const snap = await getDocs(query(collection(db, 'nj_applications'), where('applicantUid', '==', user.uid)))
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    apps.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
    setMyApps(apps)
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
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

  const filteredSkills = skillSearch
    ? DEFAULT_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()))
    : DEFAULT_SKILLS

  const statusColor = { pending:'var(--gold)', shortlisted:'var(--blue)', interview:'#7B6CF6', hired:'var(--green)', rejected:'var(--muted)' }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom:2 }}>My Profile</h1>
          <p style={{ color:'var(--muted)', fontSize:'13px' }}>{user.email}</p>
        </div>
        <span style={{ padding:'5px 14px', borderRadius:20, fontSize:'13px', fontWeight:600,
          background: role==='employer' ? '#E8EEF5' : role==='both' ? 'var(--gold-pale)' : '#E8F5EE',
          color: role==='employer' ? 'var(--blue)' : role==='both' ? 'var(--gold)' : 'var(--green)' }}>
          {role==='employer' ? '💼 Employer' : role==='both' ? '🤝 Both' : '🔍 Job Seeker'}
        </span>
      </div>

      <div className="tabs">
        {[
          ['profile', '👤 Profile'],
          ['jobs',    '💼 My Jobs'],
          ['apps',    '📨 Applications'],
        ].map(([v,l]) => (
          <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ══ PROFILE TAB ══ */}
      {tab === 'profile' && (
        <form onSubmit={handleSave}>
          {saved && <div className="alert alert-success">✓ Profile saved successfully!</div>}

          {/* Role selector */}
          <div className="card" style={{ marginBottom:16, background:'var(--gold-pale)', border:'1px solid var(--gold)' }}>
            <div className="card-body" style={{ padding:'16px 20px' }}>
              <label style={{ fontWeight:600, fontSize:'14px', color:'var(--charcoal)', display:'block', marginBottom:10 }}>
                I am here to…
              </label>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[
                  ['job',  '🔍 Find a Job', 'I am looking for employment'],
                  ['hire', '💼 Hire / Post Jobs', 'I want to find candidates'],
                  ['both', '🤝 Both', 'I am seeking and hiring'],
                ].map(([v,l,sub]) => (
                  <label key={v} style={{
                    display:'flex', flexDirection:'column', padding:'10px 16px',
                    borderRadius:'var(--radius)', cursor:'pointer', flex:1, minWidth:140,
                    border:`2px solid ${form.lookingFor===v ? 'var(--gold)' : 'var(--border)'}`,
                    background: form.lookingFor===v ? 'var(--white)' : 'rgba(255,255,255,0.5)',
                  }}>
                    <input type="radio" name="lookingFor" value={v}
                      checked={form.lookingFor===v} onChange={set('lookingFor')}
                      style={{ display:'none' }}/>
                    <span style={{ fontWeight:700, fontSize:'14px', color: form.lookingFor===v ? 'var(--gold)' : 'var(--slate)' }}>{l}</span>
                    <span style={{ fontSize:'11px', color:'var(--muted)', marginTop:2 }}>{sub}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Common: Personal Details ── */}
          <Section title="Personal Details" icon="👤">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={form.displayName} onChange={set('displayName')} placeholder="Your full name" required/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Kovil (Clan)</label>
                <select className="form-control" value={form.kovil} onChange={set('kovil')}>
                  <option value="">Select Kovil</option>
                  {KOVILS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Pirivu</label>
                <input className="form-control" value={form.pirivu} onChange={set('pirivu')} placeholder="Optional"/>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98XXX XXXXX"/>
              </div>
              <div className="form-group">
                <label>City</label>
                <input className="form-control" value={form.city} onChange={set('city')} placeholder="Chennai, Karaikudi…"/>
              </div>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" value={form.gender} onChange={set('gender')}>
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </Section>

          {/* ── EMPLOYER SECTION ── */}
          {(form.lookingFor === 'hire' || form.lookingFor === 'both') && (
            <Section title="Company / Business Details" icon="🏢"
              subtitle="Candidates trust employers who share their company information">
              <div className="form-group">
                <label>Company / Business Name *</label>
                <input className="form-control" value={form.companyName} onChange={set('companyName')}
                  placeholder="e.g. Saishan Business Solutions, Annamalai Textiles"/>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Your Designation / Role</label>
                  <input className="form-control" value={form.designation} onChange={set('designation')}
                    placeholder="e.g. Owner, Manager, HR Head"/>
                </div>
                <div className="form-group">
                  <label>Company Industry</label>
                  <select className="form-control" value={form.companyIndustry} onChange={set('companyIndustry')}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Company Website <span style={{color:'var(--muted)',fontWeight:400}}>(optional)</span></label>
                <input className="form-control" value={form.companyWebsite} onChange={set('companyWebsite')}
                  placeholder="https://yourcompany.com"/>
              </div>
              <div className="form-group">
                <label>About the Company <span style={{color:'var(--muted)',fontWeight:400}}>(optional)</span></label>
                <textarea className="form-control" rows={3} value={form.companyDesc} onChange={set('companyDesc')}
                  placeholder="Brief description of your company and what you do…"/>
              </div>
            </Section>
          )}

          {/* ── CANDIDATE SECTION ── */}
          {(form.lookingFor === 'job' || form.lookingFor === 'both') && (
            <>
              <Section title="Professional Background" icon="💼"
                subtitle="Help employers understand your experience and what you are looking for">
                <div className="grid-2">
                  <div className="form-group">
                    <label>Industry / Field</label>
                    <select className="form-control" value={form.industry} onChange={set('industry')}>
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
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
                </div>
                <div className="form-group">
                  <label>Highest Qualification</label>
                  <select className="form-control" value={form.currentQualification} onChange={set('currentQualification')}>
                    <option value="">Select Qualification</option>
                    {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
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
                <div className="form-group">
                  <label>Preferred Job Location</label>
                  <input className="form-control" value={form.preferredLocation} onChange={set('preferredLocation')}
                    placeholder="Chennai, Any Location, Remote…"/>
                </div>
              </Section>

              <Section title="Skills" icon="🏷"
                subtitle="Select your skills — employers search by these to find you">
                <input className="form-control" value={skillSearch}
                  onChange={e => setSkillSearch(e.target.value)}
                  placeholder="🔍 Search skills…" style={{ marginBottom:12 }}/>
                <div className="tag-list" style={{ marginBottom:14 }}>
                  {filteredSkills.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} style={{
                      padding:'5px 14px', borderRadius:20, fontSize:'13px', cursor:'pointer',
                      border:`${form.skills.includes(s)?'1.5px':'1px'} solid ${form.skills.includes(s)?'var(--gold)':'var(--border)'}`,
                      background: form.skills.includes(s) ? 'var(--gold-pale)' : 'var(--white)',
                      color: form.skills.includes(s) ? 'var(--gold)' : 'var(--slate)',
                    }}>{s}</button>
                  ))}
                </div>
                {form.skills.length > 0 && (
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'var(--slate)', marginBottom:8 }}>
                      Selected ({form.skills.length}):
                    </div>
                    <div className="tag-list">
                      {form.skills.map(s => (
                        <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:6,
                          padding:'4px 12px', borderRadius:20, background:'var(--gold-pale)',
                          border:'1.5px solid var(--gold)', color:'var(--gold)', fontSize:'13px' }}>
                          {s}
                          <button type="button" onClick={() => toggleSkill(s)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gold)', fontWeight:700, padding:0, fontSize:'15px' }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Professional Summary" icon="📝"
                subtitle="A short summary helps employers know you better before reaching out">
                <div className="form-group">
                  <label>About You / Resume Summary</label>
                  <textarea className="form-control" rows={5} value={form.resumeText} onChange={set('resumeText')}
                    placeholder="Briefly describe your experience, skills, achievements, and what kind of role you are looking for…"
                    style={{ minHeight:120 }}/>
                </div>
                <div className="form-group">
                  <label>LinkedIn / Portfolio Website <span style={{color:'var(--muted)',fontWeight:400}}>(optional)</span></label>
                  <input className="form-control" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/yourname"/>
                </div>
              </Section>
            </>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ══ MY JOBS TAB ══ */}
      {tab === 'jobs' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:'14px', color:'var(--muted)' }}>{myJobs.length} job posting{myJobs.length!==1?'s':''}</div>
            <Link to="/post-job" className="btn btn-primary btn-sm">+ Post New Job</Link>
          </div>
          {myJobs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💼</div>
              <h3>No jobs posted yet</h3>
              <Link to="/post-job" className="btn btn-primary btn-sm" style={{ marginTop:12 }}>Post Your First Job</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {myJobs.map(job => (
                <div key={job.id} className="card">
                  <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'14px 20px' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{job.title}</div>
                      <div style={{ fontSize:'13px', color:'var(--muted)' }}>
                        {job.company} · {job.location||job.locationType} · {job.jobType}
                      </div>
                      <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:2 }}>{job.applicantCount||0} applicants</div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span className={`badge badge-${job.status==='active'?'green':'muted'}`}>{job.status}</span>
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

      {/* ══ APPLICATIONS TAB ══ */}
      {tab === 'apps' && (
        <div>
          <div style={{ fontSize:'14px', color:'var(--muted)', marginBottom:12 }}>{myApps.length} application{myApps.length!==1?'s':''}</div>
          {myApps.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📨</div>
              <h3>No applications yet</h3>
              <p>Browse jobs and click Apply Now to get started.</p>
              <Link to="/jobs" className="btn btn-primary btn-sm" style={{ marginTop:12 }}>Browse Jobs</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {myApps.map(app => (
                <div key={app.id} className="card">
                  <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', padding:'14px 20px' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{app.jobTitle}</div>
                      <div style={{ fontSize:'13px', color:'var(--muted)' }}>{app.company}</div>
                    </div>
                    <span style={{ padding:'5px 14px', borderRadius:20, fontSize:'13px', fontWeight:600,
                      background: `${statusColor[app.status]}20`, color: statusColor[app.status] }}>
                      {app.status?.charAt(0).toUpperCase()+app.status?.slice(1)}
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

function Section({ title, icon, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom:20 }}>
      <div className="card-body">
        <div style={{ marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontSize:'1.15rem', fontWeight:600, color:'var(--charcoal)' }}>{icon} {title}</h2>
          {subtitle && <p style={{ fontSize:'13px', color:'var(--muted)', marginTop:4 }}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
