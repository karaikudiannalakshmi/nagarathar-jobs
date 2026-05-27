// src/pages/JobDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { logProfileView, logApplication } from '../utils/activityLogger'

export default function JobDetailPage() {
  const { id } = useParams()
  const { user, profile, isAdmin } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [job,          setJob]          = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [applying,     setApplying]     = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [coverLetter,  setCoverLetter]  = useState('')
  const [applied,      setApplied]      = useState(false)
  const [appSuccess,   setAppSuccess]   = useState(false)
  const [applicants,   setApplicants]   = useState([])
  const [loadingApps,  setLoadingApps]  = useState(false)
  const [selectedApp,  setSelectedApp]  = useState(null)

  const isOwner = job && user && job.postedBy === user.uid

  useEffect(() => {
    loadJob()
  }, [id])

  useEffect(() => {
    if (isOwner) loadApplicants()
  }, [isOwner])

  async function loadJob() {
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'nj_jobs', id))
      if (!snap.exists()) { navigate('/jobs'); return }
      const jobData = { id: snap.id, ...snap.data() }
      setJob(jobData)
      if (user && jobData.postedBy !== user.uid) {
        logProfileView({ viewerUid: user.uid, targetUid: jobData.postedBy, jobId: id }).catch(() => {})
        // Check if already applied
        const q = query(collection(db, 'nj_applications'), where('applicantUid', '==', user.uid), where('jobId', '==', id))
        const existing = await getDocs(q)
        if (!existing.empty) setApplied(true)
      }
    } finally { setLoading(false) }
  }

  async function loadApplicants() {
    setLoadingApps(true)
    try {
      const q = query(collection(db, 'nj_applications'), where('jobId', '==', id))
      const snap = await getDocs(q)
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      apps.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setApplicants(apps)

      // For each applicant load their profile
      const withProfiles = await Promise.all(apps.map(async app => {
        try {
          const uSnap = await getDoc(doc(db, 'nj_users', app.applicantUid))
          return { ...app, candidateProfile: uSnap.exists() ? uSnap.data() : null }
        } catch { return app }
      }))
      setApplicants(withProfiles)
    } finally { setLoadingApps(false) }
  }

  async function handleApply(e) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setApplying(true)
    try {
      const appData = {
        jobId:            id,
        jobTitle:         job.title,
        company:          job.company,
        applicantUid:     user.uid,
        applicantName:    profile?.displayName || user.displayName || 'Member',
        applicantEmail:   user.email,
        applicantPhone:   profile?.phone || '',
        applicantKovil:   profile?.kovil || '',
        posterUid:        job.postedBy,
        posterEmail:      job.postedByEmail || '',
        coverLetter,
        status:           'pending',
        createdAt:        serverTimestamp(),
      }
      await addDoc(collection(db, 'nj_applications'), appData)
      await updateDoc(doc(db, 'nj_jobs', id), { applicantCount: increment(1) })
      setApplied(true); setAppSuccess(true); setShowModal(false)

      // Notify employer via email
      fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'employer_notification', data: {
          to_email:       job.contactEmail || job.postedByEmail || '',
          employer_name:  job.postedByName || 'Employer',
          job_title:      job.title,
          applicant_name: appData.applicantName,
          applicant_email: appData.applicantEmail,
          applicant_phone: appData.applicantPhone,
          cover_letter:   coverLetter,
        }})
      }).catch(() => {})

      // Confirm to applicant
      fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'applicant_confirmation', data: {
          to_email:       user.email,
          applicant_name: appData.applicantName,
          job_title:      job.title,
          company:        job.company,
        }})
      }).catch(() => {})

    } catch(err) {
      alert('Failed to submit. Please try again.')
    } finally { setApplying(false) }
  }

  async function updateStatus(app, status) {
    await updateDoc(doc(db, 'nj_applications', app.id), { status })
    setApplicants(prev => prev.map(a => a.id === app.id ? { ...a, status } : a))
    if (selectedApp?.id === app.id) setSelectedApp(prev => ({ ...prev, status }))
    // Notify applicant
    fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'status_update', data: {
        to_email:       app.applicantEmail,
        applicant_name: app.applicantName,
        job_title:      job.title,
        status,
      }})
    }).catch(() => {})
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>
  if (!job) return null

  const statusColor = { pending:'var(--gold)', shortlisted:'var(--blue)', interview:'#7B6CF6', hired:'var(--green)', rejected:'var(--muted)' }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to="/jobs" style={{ color: 'var(--muted)', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Back to Jobs
      </Link>

      {appSuccess && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✅ Application submitted! You will receive a confirmation email.
        </div>
      )}

      {/* Job header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.4rem', color: 'var(--gold)', flexShrink: 0 }}>
                  {job.company?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>{job.title}</h1>
                  <div style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 600 }}>{job.company}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {job.location && <span className="tag">📍 {job.location}</span>}
                {job.jobType && <span className="tag">💼 {job.jobType}</span>}
                {job.industry && <span className="badge badge-blue">{job.industry}</span>}
                {job.education && <span className="badge badge-gold">🎓 {job.education}</span>}
                {job.experience && <span className="badge badge-muted">⏱ {job.experience}</span>}
                {job.foodAccommodation && job.foodAccommodation !== 'Not Provided' && <span className="badge badge-green">🍽 {job.foodAccommodation}</span>}
                {job.genderPreference && job.genderPreference !== 'Any' && <span className="badge badge-blue">{job.genderPreference === 'Male' ? '👨 Male preferred' : '👩 Female preferred'}</span>}
              </div>

              {/* Salary */}
              {(job.salary || job.salaryType === 'negotiable') && (
                <div style={{ background: '#E8F5EE', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'inline-block' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Compensation</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>
                    {job.salaryType === 'negotiable' ? 'Negotiable' : job.salary}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              {isOwner ? (
                <>
                  <span className="badge badge-blue" style={{ padding: '8px 16px' }}>Your Posting</span>
                  <Link to={`/jobs/${id}/edit`} className="btn btn-outline btn-sm">✏️ Edit Job</Link>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>
                    {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
                  </div>
                </>
              ) : applied ? (
                <span className="badge badge-green" style={{ padding: '10px 20px', fontSize: '15px' }}>✓ Applied</span>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          {/* Description */}
          {job.description && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Job Description</h2>
                <p style={{ lineHeight: 1.8, color: 'var(--slate)', whiteSpace: 'pre-line' }}>{job.description}</p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Additional Requirements</h2>
                <p style={{ lineHeight: 1.8, color: 'var(--slate)', whiteSpace: 'pre-line' }}>{job.requirements}</p>
              </div>
            </div>
          )}

          {/* Skills */}
          {job.requiredSkills?.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Skills Required</h2>
                <div className="tag-list">
                  {job.requiredSkills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* ══ APPLICANTS — visible to job owner ══ */}
          {isOwner && (
            <div className="card" style={{ marginBottom: 16, border: '2px solid var(--gold)' }}>
              <div className="card-body">
                <h2 style={{ fontSize: '1.2rem', marginBottom: 4, color: 'var(--gold)' }}>
                  📨 Applications ({applicants.length})
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 16 }}>
                  People who applied to this job. Click to view their full profile.
                </p>
                {loadingApps ? (
                  <div style={{ color: 'var(--muted)' }}>Loading applications…</div>
                ) : applicants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    No applications yet. Share this job to attract candidates.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {applicants.map(app => (
                      <div key={app.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', cursor: 'pointer', background: selectedApp?.id === app.id ? 'var(--gold-pale)' : 'var(--white)' }}
                        onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                              {app.applicantName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{app.applicantName}</div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                {app.applicantEmail}
                                {app.applicantPhone && ` · ${app.applicantPhone}`}
                                {app.applicantKovil && ` · ${app.applicantKovil} Kovil`}
                              </div>
                            </div>
                          </div>
                          <select value={app.status} onClick={e => e.stopPropagation()}
                            onChange={e => updateStatus(app, e.target.value)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: `1.5px solid ${statusColor[app.status] || 'var(--border)'}`, color: statusColor[app.status] || 'var(--slate)', fontSize: '13px', fontWeight: 600, background: 'var(--white)', cursor: 'pointer' }}>
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interview">Interview</option>
                            <option value="hired">Hired ✓</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Cover letter */}
                        {app.coverLetter && (
                          <div style={{ marginTop: 10, fontSize: '13px', color: 'var(--slate)', background: 'var(--ivory)', padding: '8px 12px', borderRadius: 6, fontStyle: 'italic' }}>
                            "{app.coverLetter.slice(0, 200)}{app.coverLetter.length > 200 ? '…' : ''}"
                          </div>
                        )}

                        {/* Expanded: full candidate profile */}
                        {selectedApp?.id === app.id && app.candidateProfile && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--charcoal)', marginBottom: 10 }}>
                              Candidate Profile
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              {[
                                ['Kovil', app.candidateProfile.kovil],
                                ['City', app.candidateProfile.city],
                                ['Gender', app.candidateProfile.gender],
                                ['Industry', app.candidateProfile.industry],
                                ['Experience', app.candidateProfile.workExperience],
                                ['Qualification', app.candidateProfile.currentQualification],
                                ['Current Salary', app.candidateProfile.currentSalary],
                                ['Expected Salary', app.candidateProfile.expectedSalary],
                              ].filter(([,v]) => v).map(([label, value]) => (
                                <div key={label} style={{ background: 'var(--white)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate)', marginTop: 2 }}>{value}</div>
                                </div>
                              ))}
                            </div>
                            {app.candidateProfile.skills?.length > 0 && (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Skills</div>
                                <div className="tag-list">
                                  {app.candidateProfile.skills.map(s => <span key={s} className="tag">{s}</span>)}
                                </div>
                              </div>
                            )}
                            {app.candidateProfile.resumeText && (
                              <div style={{ marginTop: 10, fontSize: '13px', color: 'var(--slate)', background: 'var(--white)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', lineHeight: 1.7 }}>
                                {app.candidateProfile.resumeText}
                              </div>
                            )}
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                              <a href={`mailto:${app.applicantEmail}`} className="btn btn-primary btn-sm">📧 Email</a>
                              {app.applicantPhone && (
                                <a href={`tel:${app.applicantPhone}`} className="btn btn-outline btn-sm">📞 Call</a>
                              )}
                              <button onClick={() => navigator.clipboard?.writeText(`${app.applicantName}\n${app.applicantEmail}\n${app.applicantPhone || ''}`)}
                                className="btn btn-ghost btn-sm">📋 Copy Details</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Facts sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Quick Facts</h3>
              {[
                ['Education',   job.education  || 'Any Graduate'],
                ['Experience',  job.experience || 'Any Experience'],
                ['Job Type',    job.jobType],
                ['Location',    job.location || job.locationType],
                ['Food & Stay', job.foodAccommodation],
                ['Salary',      job.salaryType === 'negotiable' ? 'Negotiable' : job.salary],
                ['Gender Pref', job.genderPreference],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Posted by</h3>
              <div style={{ fontWeight: 600 }}>{job.postedByName || 'Employer'}</div>
              {job.contactEmail && <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4 }}>📧 {job.contactEmail}</div>}
              {job.contactPhone && <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 4 }}>📞 {job.contactPhone}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem' }}>Apply for {job.title}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                <div style={{ padding: '12px 16px', background: 'var(--ivory)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Applying as:</div>
                  <div>{profile?.displayName || user.email}</div>
                  {profile?.phone && <div style={{ color: 'var(--muted)' }}>📞 {profile.phone}</div>}
                  {!profile?.phone && (
                    <div style={{ color: 'var(--terracotta)', marginTop: 4 }}>
                      ⚠ Add your phone number in <Link to="/profile">Profile</Link> so the employer can reach you
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Cover Letter / Message <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-control" rows={4} value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Briefly introduce yourself and why you are a good fit…"
                    style={{ minHeight: 100 }}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={applying}>
                  {applying ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
