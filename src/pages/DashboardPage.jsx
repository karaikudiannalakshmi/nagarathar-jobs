// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import OnboardingTour from '../components/OnboardingTour'

function getProfileScore(profile, role) {
  if (!profile) return { score: 0, missing: [], done: 0, total: 0 }
  const checks = role === 'employer' ? [
    { key: 'displayName', label: 'Full name' },
    { key: 'phone',       label: 'Phone number' },
    { key: 'city',        label: 'City' },
    { key: 'kovil',       label: 'Kovil' },
    { key: 'companyName', label: 'Company name' },
    { key: 'industry',    label: 'Industry' },
    { key: 'designation', label: 'Designation' },
  ] : [
    { key: 'displayName',          label: 'Full name' },
    { key: 'phone',                label: 'Phone number' },
    { key: 'city',                 label: 'City' },
    { key: 'kovil',                label: 'Kovil' },
    { key: 'gender',               label: 'Gender' },
    { key: 'industry',             label: 'Industry / Field' },
    { key: 'currentQualification', label: 'Qualification' },
    { key: 'workExperience',       label: 'Work experience' },
    { key: 'expectedSalary',       label: 'Expected salary' },
    { key: 'skills', label: 'Skills (min 1)', check: p => p.skills?.length > 0 },
    { key: 'resumeText', label: 'Professional summary' },
  ]
  const missing = checks.filter(c => c.check ? !c.check(profile) : !profile[c.key]).map(c => c.label)
  const done = checks.length - missing.length
  return { score: Math.round((done / checks.length) * 100), missing, done, total: checks.length }
}

function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 80 ? '#1A6B3C' : score >= 50 ? '#B8860B' : '#C97B4B'
  return (
    <svg width={90} height={90} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={45} cy={45} r={r} fill="none" stroke="#E8D5B8" strokeWidth={8}/>
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      <text x={45} y={49} textAnchor="middle" style={{ transform:'rotate(90deg)', transformOrigin:'45px 45px' }}
        fontSize={18} fontWeight={700} fill={color}>{score}%</text>
    </svg>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [matchingJobs,       setMatchingJobs]       = useState([])
  const [matchingCandidates, setMatchingCandidates] = useState([])
  const [myJobs,             setMyJobs]             = useState([])
  const [myApps,             setMyApps]             = useState([])
  const [loading,            setLoading]            = useState(true)
  const [showTour,           setShowTour]           = useState(false)
  const [guidance,           setGuidance]           = useState([])
  const [selectedCandidate,  setSelectedCandidate]  = useState(null)

  const role = profile?.lookingFor === 'hire' ? 'employer'
             : profile?.lookingFor === 'both' ? 'both'
             : 'candidate'

  const { score, missing } = getProfileScore(profile, role === 'both' ? 'candidate' : role)

  useEffect(() => {
    if (profile) {
      loadDashboardData()
      generateGuidance()
      const tourKey = `nj_tour_done_${user?.uid || 'x'}`
      if (!localStorage.getItem(tourKey)) setTimeout(() => setShowTour(true), 800)
    }
  }, [profile])

  function completeTour() {
    localStorage.setItem(`nj_tour_done_${user?.uid || 'x'}`, '1')
    setShowTour(false)
  }

  function isMatch(candidate, job) {
    const ci = candidate.industry || '', cs = candidate.skills || []
    const ji = job.industry || '',       js = job.requiredSkills || []
    if (ci && ji && ci === ji) return true
    if (cs.length > 0 && js.length > 0) {
      const s = new Set(cs.map(x => x.toLowerCase()))
      if (js.some(x => s.has(x.toLowerCase()))) return true
    }
    return false
  }

  function generateGuidance() {
    if (!profile) return
    const tips = []
    // Skills warning — highest priority
    if (!profile.skills?.length) {
      tips.push({ type:'warning', icon:'⚠️', title:'Add skills — required for matching!', desc:"You have no skills added. Employers cannot find you without skills.", action:{ label:'Add Skills Now', to:'/profile' } })
    }
    if (score < 50) {
      tips.push({ type:'warning', icon:'⚠️', title:'Your profile is incomplete', desc:`Add ${missing.slice(0,3).join(', ')} to start getting matches.`, action:{ label:'Complete Profile', to:'/profile' } })
    }
    if ((role === 'candidate' || role === 'both') && !profile.expectedSalary) {
      tips.push({ type:'tip', icon:'💰', title:'Add your expected salary', desc:'Employers want to know if their budget matches before reaching out.', action:{ label:'Update Profile', to:'/profile' } })
    }
    if ((role === 'employer' || role === 'both') && !profile.companyName) {
      tips.push({ type:'tip', icon:'🏢', title:'Add your company name', desc:'Candidates trust employers who share their company details.', action:{ label:'Update Profile', to:'/profile' } })
    }
    setGuidance(tips.slice(0, 3))
  }

  async function loadDashboardData() {
    setLoading(true)
    try {
      if (role === 'candidate' || role === 'both') {
        const jobsSnap = await getDocs(query(collection(db, 'nj_jobs'), where('status','==','active')))
        const allJobs = jobsSnap.docs.map(d => ({ id:d.id, ...d.data() }))
        setMatchingJobs(allJobs.filter(j => isMatch(profile, j)).slice(0, 6))
        const appsSnap = await getDocs(query(collection(db, 'nj_applications'), where('applicantUid','==',user.uid)))
        setMyApps(appsSnap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
      }
      if (role === 'employer' || role === 'both') {
        const myJobsSnap = await getDocs(query(collection(db, 'nj_jobs'), where('postedBy','==',user.uid)))
        const jobs = myJobsSnap.docs.map(d => ({ id:d.id, ...d.data() }))
        setMyJobs(jobs.sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
        const usersSnap = await getDocs(collection(db, 'nj_users'))
        const allCandidates = usersSnap.docs.map(d => ({ id:d.id, ...d.data() })).filter(u => (u.lookingFor==='job'||u.lookingFor==='both') && u.id !== user.uid)
        setMatchingCandidates(allCandidates.filter(c => jobs.some(j => isMatch(c, j))).slice(0, 6))
      }
    } finally { setLoading(false) }
  }

  const statusColor = { pending:'var(--gold)', shortlisted:'var(--blue)', interview:'#7B6CF6', hired:'var(--green)', rejected:'var(--muted)' }
  const statusIcon  = { pending:'⏳', shortlisted:'⭐', interview:'📅', hired:'🎉', rejected:'✗' }

  return (
    <div className="page">
      {/* Welcome */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', marginBottom:4 }}>
          Welcome back, {profile?.displayName?.split(' ')[0] || 'Member'} 🙏
        </h1>
        <p style={{ color:'var(--muted)', fontSize:'15px' }}>
          {role === 'candidate' ? 'Your personalised job matches and application status'
         : role === 'employer'  ? 'Your job postings and matching candidates'
         : 'Your community employment overview'}
        </p>
      </div>

      {/* Guidance tips */}
      {guidance.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {guidance.map((tip, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', borderRadius:'var(--radius)', background: tip.type==='warning' ? '#FEF3E2' : 'var(--gold-pale)', border:`1px solid ${tip.type==='warning' ? '#F0A500' : 'var(--gold)'}`, flexWrap:'wrap' }}>
              <span style={{ fontSize:'1.5rem' }}>{tip.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'14px', color:'var(--charcoal)' }}>{tip.title}</div>
                <div style={{ fontSize:'13px', color:'var(--slate)', marginTop:2 }}>{tip.desc}</div>
              </div>
              <Link to={tip.action.to} className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>{tip.action.label}</Link>
            </div>
          ))}
        </div>
      )}

      {/* Profile completion */}
      <div className="card" style={{ marginBottom:24, background: score >= 80 ? 'var(--white)' : 'linear-gradient(135deg,#FAF7F0,#F5E9C8)', border:`1px solid ${score >= 80 ? 'var(--border)' : 'var(--gold)'}` }}>
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <ScoreRing score={score} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:700, marginBottom:4 }}>Profile Completion</div>
              {score >= 80 ? (
                <p style={{ color:'var(--green)', fontWeight:600, fontSize:'14px' }}>✅ Great profile! You will get better matches.</p>
              ) : (
                <>
                  <p style={{ color:'var(--slate)', fontSize:'14px', marginBottom:10 }}>
                    Complete your profile to get better matches. <strong style={{ color:'var(--gold)' }}>Add {missing.length} more field{missing.length > 1 ? 's' : ''}.</strong>
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                    {missing.map(m => <span key={m} style={{ padding:'3px 10px', borderRadius:20, background:'var(--white)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:'12px' }}>+ {m}</span>)}
                  </div>
                </>
              )}
              <Link to="/profile" className="btn btn-primary btn-sm">{score >= 80 ? 'View Profile' : '✏️ Complete Profile'}</Link>
            </div>
            <div style={{ width:'100%', height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${score}%`, background: score>=80?'var(--green)':score>=50?'var(--gold)':'var(--terracotta)', borderRadius:3, transition:'width 0.8s ease' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── CANDIDATE VIEW ── */}
      {(role === 'candidate' || role === 'both') && (
        <>
          {/* Matching jobs */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem' }}>
                ✨ Jobs Matching Your Profile
                <span style={{ fontSize:'1rem', color:'var(--gold)', fontWeight:400, marginLeft:10 }}>({loading ? '…' : matchingJobs.length})</span>
              </h2>
              <Link to="/jobs" className="btn btn-ghost btn-sm">Browse All →</Link>
            </div>
            {loading ? <LoadingCards n={3} /> : matchingJobs.length === 0 ? (
              <div className="card">
                <div className="card-body" style={{ textAlign:'center', padding:'32px' }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🔍</div>
                  <p style={{ color:'var(--muted)', marginBottom:16 }}>No matches yet — add your industry and skills to get matched.</p>
                  <Link to="/profile" className="btn btn-primary btn-sm">Update Profile</Link>
                </div>
              </div>
            ) : (
              <div className="grid-3" style={{ gap:14 }}>
                {matchingJobs.map(job => (
                  <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                    <div className="card" style={{ height:'100%', cursor:'pointer' }}>
                      <div className="card-body" style={{ padding:'18px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span className="badge badge-green" style={{ fontSize:'11px' }}>✨ Match</span>
                          <span style={{ fontSize:'11px', color:'var(--muted)' }}>{job.jobType}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:4 }}>{job.title}</div>
                        <div style={{ fontSize:'13px', color:'var(--gold)', marginBottom:6 }}>{job.company}</div>
                        <div style={{ fontSize:'12px', color:'var(--muted)' }}>📍 {job.location || job.locationType || 'Any Location'}</div>
                        {(job.salary || job.salaryType === 'negotiable') && (
                          <div style={{ fontSize:'12px', color:'var(--green)', marginTop:4, fontWeight:600 }}>💰 {job.salaryType === 'negotiable' ? 'Negotiable' : job.salary}</div>
                        )}
                        {(job.applicantCount || 0) > 0 && (
                          <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:6 }}>👥 {job.applicantCount} applied</div>
                        )}
                        <div style={{ marginTop:12 }}>
                          <span className="btn btn-primary btn-sm" style={{ fontSize:'12px', padding:'5px 14px' }}>Apply Now →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Skill gap */}
          {!loading && <SkillGapPanel profile={profile} allJobs={matchingJobs} />}

          {/* My Applications */}
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', marginBottom:16 }}>
              📨 My Applications
              <span style={{ fontSize:'1rem', color:'var(--muted)', fontWeight:400, marginLeft:10 }}>({myApps.length})</span>
            </h2>
            {myApps.length === 0 ? (
              <div className="card">
                <div className="card-body" style={{ textAlign:'center', padding:'28px' }}>
                  <p style={{ color:'var(--muted)' }}>No applications yet. Browse matching jobs above and apply!</p>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myApps.map(app => (
                  <div key={app.id} className="card">
                    <div className="card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', flexWrap:'wrap', gap:10 }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{app.jobTitle}</div>
                        <div style={{ fontSize:'13px', color:'var(--muted)' }}>{app.company}</div>
                      </div>
                      <span style={{ padding:'5px 14px', borderRadius:20, fontSize:'13px', fontWeight:600, background:`${statusColor[app.status]}20`, color:statusColor[app.status] }}>
                        {statusIcon[app.status]} {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── EMPLOYER VIEW ── */}
      {(role === 'employer' || role === 'both') && (
        <>
          {/* My Jobs */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem' }}>
                💼 My Job Postings
                <span style={{ fontSize:'1rem', color:'var(--muted)', fontWeight:400, marginLeft:10 }}>({myJobs.length})</span>
              </h2>
              <Link to="/post-job" className="btn btn-primary btn-sm">+ Post New Job</Link>
            </div>
            {myJobs.length === 0 ? (
              <div className="card">
                <div className="card-body" style={{ textAlign:'center', padding:'28px' }}>
                  <p style={{ color:'var(--muted)', marginBottom:16 }}>No jobs posted yet.</p>
                  <Link to="/post-job" className="btn btn-primary btn-sm">Post Your First Job</Link>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myJobs.map(job => (
                  <div key={job.id} className="card">
                    <div className="card-body" style={{ padding:'14px 20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:'1rem' }}>{job.title}</div>
                          <div style={{ fontSize:'13px', color:'var(--muted)' }}>{job.company} · {job.location || job.locationType}</div>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span className={`badge badge-${job.status==='active'?'green':'muted'}`}>{job.status}</span>
                          <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">
                            📨 {job.applicantCount || 0} Applied
                          </Link>
                          <Link to={`/jobs/${job.id}/edit`} className="btn btn-ghost btn-sm">✏️ Edit</Link>
                        </div>
                      </div>
                      {/* Application bar */}
                      {(job.applicantCount || 0) > 0 && (
                        <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.min((job.applicantCount||0) * 10, 100)}%`, background:'var(--green)', borderRadius:3 }}/>
                          </div>
                          <span style={{ fontSize:'12px', color:'var(--green)', fontWeight:600 }}>{job.applicantCount} response{job.applicantCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matching Candidates */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem' }}>
                👥 Candidates Matching Your Jobs
                <span style={{ fontSize:'1rem', color:'var(--gold)', fontWeight:400, marginLeft:10 }}>({loading ? '…' : matchingCandidates.length})</span>
              </h2>
              <Link to="/candidates" className="btn btn-ghost btn-sm">Browse All →</Link>
            </div>
            {loading ? <LoadingCards n={3} /> : matchingCandidates.length === 0 ? (
              <div className="card">
                <div className="card-body" style={{ textAlign:'center', padding:'32px' }}>
                  <p style={{ color:'var(--muted)', marginBottom:16 }}>No matching candidates yet. Add industry and skills to your job for better matches.</p>
                </div>
              </div>
            ) : (
              <div className="grid-3" style={{ gap:14 }}>
                {matchingCandidates.map(c => (
                  <div key={c.id} className="card" style={{ height:'100%' }}>
                    <div className="card-body" style={{ padding:'18px' }}>
                      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-pale),var(--gold))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>
                          {c.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'14px' }}>{c.displayName}</div>
                          {c.kovil && <div style={{ fontSize:'12px', color:'var(--gold)' }}>{c.kovil} Kovil</div>}
                        </div>
                      </div>
                      <div style={{ fontSize:'12px', color:'var(--muted)', marginBottom:4 }}>
                        {c.city && `📍 ${c.city}`}{c.industry && ` · ${c.industry}`}
                      </div>
                      {c.workExperience  && <div style={{ fontSize:'12px', color:'var(--slate)', marginBottom:4 }}>⏱ {c.workExperience}</div>}
                      {c.expectedSalary  && <div style={{ fontSize:'12px', color:'var(--green)', fontWeight:600, marginBottom:8 }}>💰 {c.expectedSalary}</div>}
                      {c.skills?.length > 0 && (
                        <div className="tag-list" style={{ marginBottom:10 }}>
                          {c.skills.slice(0,3).map(s => <span key={s} className="tag" style={{ fontSize:'11px' }}>{s}</span>)}
                        </div>
                      )}
                      <button className="btn btn-primary btn-sm" style={{ fontSize:'12px', padding:'5px 14px' }}
                        onClick={() => setSelectedCandidate(c)}>
                        👤 View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(44,24,16,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setSelectedCandidate(null)}>
          <div style={{ background:'var(--white)', borderRadius:16, maxWidth:520, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-pale),var(--gold))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.3rem' }}>
                  {selectedCandidate.displayName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:700 }}>{selectedCandidate.displayName}</div>
                  {selectedCandidate.kovil && <div style={{ fontSize:'13px', color:'var(--gold)' }}>{selectedCandidate.kovil} Kovil</div>}
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--muted)' }}>✕</button>
            </div>
            <div style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                {selectedCandidate.city        && <span className="tag">📍 {selectedCandidate.city}</span>}
                {selectedCandidate.gender      && <span className="badge badge-blue">{selectedCandidate.gender}</span>}
                {selectedCandidate.industry    && <span className="badge badge-gold">{selectedCandidate.industry}</span>}
                {selectedCandidate.workExperience && <span className="badge badge-muted">⏱ {selectedCandidate.workExperience}</span>}
              </div>
              {(selectedCandidate.currentQualification || selectedCandidate.expectedSalary) && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  {selectedCandidate.currentQualification && (
                    <div style={{ background:'var(--ivory)', padding:'10px 14px', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Qualification</div>
                      <div style={{ fontSize:'13px', fontWeight:600 }}>{selectedCandidate.currentQualification}</div>
                    </div>
                  )}
                  {selectedCandidate.expectedSalary && (
                    <div style={{ background:'#E8F5EE', padding:'10px 14px', borderRadius:'var(--radius)', border:'1px solid #A8D5BC' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Expected Salary</div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'var(--green)' }}>💰 {selectedCandidate.expectedSalary}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedCandidate.skills?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'12px', fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Skills</div>
                  <div className="tag-list">{selectedCandidate.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
                </div>
              )}
              {selectedCandidate.resumeText && (
                <div style={{ marginBottom:16, background:'var(--ivory)', padding:'12px 14px', borderRadius:'var(--radius)', fontSize:'13px', lineHeight:1.7, color:'var(--slate)' }}>
                  {selectedCandidate.resumeText}
                </div>
              )}
              <div style={{ background:'var(--gold-pale)', padding:'14px 16px', borderRadius:'var(--radius)', border:'1px solid var(--gold)' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Contact Details</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span>📧</span>
                  <span style={{ fontSize:'13px', color:'var(--dark)', fontWeight:500 }}>{selectedCandidate.email}</span>
                  <button onClick={() => navigator.clipboard?.writeText(selectedCandidate.email)} className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', fontSize:'11px', padding:'3px 10px' }}>Copy</button>
                </div>
                {selectedCandidate.phone && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span>📞</span>
                    <span style={{ fontSize:'13px', color:'var(--dark)', fontWeight:500 }}>{selectedCandidate.phone}</span>
                    <button onClick={() => navigator.clipboard?.writeText(selectedCandidate.phone)} className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', fontSize:'11px', padding:'3px 10px' }}>Copy</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour */}
      {showTour && <OnboardingTour role={role === 'employer' ? 'employer' : 'candidate'} onComplete={completeTour} />}
    </div>
  )
}

function SkillGapPanel({ profile, allJobs }) {
  const demandMap = {}
  allJobs.forEach(j => (j.requiredSkills||[]).forEach(s => { demandMap[s] = (demandMap[s]||0)+1 }))
  const candSkills = new Set((profile?.skills||[]).map(s => s.toLowerCase()))
  const gaps = Object.entries(demandMap).filter(([s]) => !candSkills.has(s.toLowerCase())).sort((a,b) => b[1]-a[1]).slice(0,5)
  const strengths = Object.entries(demandMap).filter(([s]) => candSkills.has(s.toLowerCase())).sort((a,b) => b[1]-a[1]).slice(0,4)
  if (gaps.length === 0 && strengths.length === 0) return null
  return (
    <div className="card" style={{ marginBottom:32 }}>
      <div className="card-body">
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', marginBottom:6 }}>🧠 Skills Intelligence</h2>
        <p style={{ color:'var(--muted)', fontSize:'13px', marginBottom:20 }}>Based on active job postings in our community</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          {strengths.length > 0 && (
            <div>
              <div style={{ fontWeight:700, fontSize:'14px', color:'var(--green)', marginBottom:10 }}>✅ Your In-Demand Skills</div>
              {strengths.map(([skill, count]) => (
                <div key={skill} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:'13px', flex:1, color:'var(--slate)' }}>{skill}</span>
                  <div style={{ width:80, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min((count/allJobs.length)*100*3,100)}%`, background:'var(--green)', borderRadius:3 }}/>
                  </div>
                  <span style={{ fontSize:'12px', color:'var(--muted)', width:40, textAlign:'right' }}>{count} job{count>1?'s':''}</span>
                </div>
              ))}
            </div>
          )}
          {gaps.length > 0 && (
            <div>
              <div style={{ fontWeight:700, fontSize:'14px', color:'var(--gold)', marginBottom:10 }}>💡 Skills Employers Need</div>
              {gaps.map(([skill, count]) => (
                <div key={skill} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:'13px', flex:1, color:'var(--slate)' }}>{skill}</span>
                  <div style={{ width:80, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min((count/allJobs.length)*100*3,100)}%`, background:'var(--gold)', borderRadius:3 }}/>
                  </div>
                  <span style={{ fontSize:'12px', color:'var(--muted)', width:40, textAlign:'right' }}>{count} job{count>1?'s':''}</span>
                </div>
              ))}
              <Link to="/profile" className="btn btn-ghost btn-sm" style={{ marginTop:8 }}>Add Skills →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingCards({ n }) {
  return (
    <div className="grid-3" style={{ gap:14 }}>
      {[...Array(n)].map((_,i) => (
        <div key={i} className="card">
          <div className="card-body" style={{ padding:18 }}>
            <div style={{ height:12, background:'var(--border)', borderRadius:6, marginBottom:10, width:'60%' }}/>
            <div style={{ height:10, background:'var(--border)', borderRadius:6, marginBottom:8, width:'80%' }}/>
            <div style={{ height:10, background:'var(--border)', borderRadius:6, width:'40%' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}
