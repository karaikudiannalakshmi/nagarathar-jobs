// src/pages/JobDetailPage.jsx
import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, addDoc, serverTimestamp,
  query, where, getDocs, updateDoc, increment,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { sendEmployerNotification, sendApplicantConfirmation } from '../utils/emailjs'
import { logApplication } from '../utils/activityLogger'

export default function JobDetailPage() {
  const { id }            = useParams()
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const navigate          = useNavigate()
  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadJob() }, [id])

  async function loadJob() {
    try {
      const snap = await getDoc(doc(db, 'nj_jobs', id))
      if (!snap.exists()) { navigate('/jobs'); return }
      setJob({ id: snap.id, ...snap.data() })
      // increment view count
      updateDoc(doc(db, 'nj_jobs', id), { views: increment(1) }).catch(() => {})
      // check if already applied
      const q = query(collection(db, 'nj_applications'),
        where('jobId', '==', id), where('applicantUid', '==', user.uid))
      const existing = await getDocs(q)
      setApplied(!existing.empty)
    } finally { setLoading(false) }
  }

  async function handleApply(e) {
    e.preventDefault()
    setApplying(true); setError('')
    try {
      await addDoc(collection(db, 'nj_applications'), {
        jobId:           id,
        jobTitle:        job.title,
        jobCompany:      job.company,
        posterUid:       job.postedBy,
        posterEmail:     job.postedByEmail,
        applicantUid:    user.uid,
        applicantName:   profile?.displayName || user.displayName || '',
        applicantEmail:  user.email,
        applicantPhone:  profile?.phone || '',
        applicantKovil:  profile?.kovil || '',
        applicantCity:   profile?.city  || '',
        coverLetter,
        status:          'pending',
        createdAt:       serverTimestamp(),
      })
      updateDoc(doc(db, 'nj_jobs', id), { applicantCount: increment(1) }).catch(() => {})
      logApplication({
        applicantUid: user.uid, applicantName: profile?.displayName || user.displayName || '',
        applicantEmail: user.email, jobId: id, jobTitle: job.title,
        company: job.company, posterUid: job.postedBy,
      }).catch(() => {})
      // Email employer
      sendEmployerNotification({
        to_email:         job.postedByEmail,
        poster_name:      job.postedByName,
        job_title:        job.title,
        applicant_name:   profile?.displayName || user.displayName,
        applicant_email:  user.email,
        applicant_phone:  profile?.phone || '',
        applicant_kovil:  profile?.kovil || '',
        cover_letter:     coverLetter || '(no cover letter)',
      }).catch(() => {})
      // Confirm to applicant
      sendApplicantConfirmation({
        to_email:       user.email,
        applicant_name: profile?.displayName || user.displayName,
        job_title:      job.title,
        company:        job.company,
      }).catch(() => {})
      setApplied(true)
      setSuccess('Application submitted! You will receive a confirmation email.')
      setShowModal(false)
    } catch (err) {
      setError(err.message)
    } finally { setApplying(false) }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!job) return null

  const isOwner = job.postedBy === user.uid
  const locationDisplay = job.locationType === 'Any Location / Remote'
    ? '🌐 Any Location / Remote'
    : `📍 ${job.location || job.locationType}`

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <Link to="/jobs" style={{ color: 'var(--muted)', fontSize: '14px', display: 'inline-block', marginBottom: 20 }}>
        ← Back to Jobs
      </Link>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* ── Header card ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={S.logo}>{job.company?.[0]?.toUpperCase() || '?'}</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.9rem', marginBottom: 4 }}>{job.title}</h1>
              <div style={{ fontSize: '1.05rem', color: 'var(--slate)', fontWeight: 500, marginBottom: 14 }}>
                {job.company}
              </div>
              {/* Meta chips row 1 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <Chip>{locationDisplay}</Chip>
                {job.jobType    && <Chip>💼 {job.jobType}</Chip>}
                {job.industry   && <Chip>🏢 {job.industry}</Chip>}
                {job.experience && <Chip>📈 {job.experience}</Chip>}
              </div>
              {/* Meta chips row 2 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.education && <span className="badge badge-blue">🎓 {job.education}</span>}
                {job.foodAccommodation && job.foodAccommodation !== 'Not Provided' &&
                  <span className="badge badge-green">🍽 {job.foodAccommodation}</span>}
                {job.genderPreference && job.genderPreference !== 'Any' &&
                  <span className="badge badge-blue">
                    {job.genderPreference === 'Male' ? '👨 Male preferred' : '👩 Female preferred'}
                  </span>}
                {job.applicantCount > 0 &&
                  <span className="badge badge-muted">👥 {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>

          {/* Salary highlight */}
          {(job.salary || job.salaryType === 'negotiable') && (
            <div style={S.salaryBox}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {job.salaryType === 'offered' ? 'Salary Offered' : job.salaryType === 'expected' ? 'Salary Expected' : 'Compensation'}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)' }}>
                {job.salaryType === 'negotiable' ? 'Negotiable' : job.salary}
              </div>
            </div>
          )}

          <div className="section-divider" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {isOwner ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="badge badge-blue" style={{ padding: '8px 16px' }}>Your Posting</span>
                <Link to={`/jobs/${id}/edit`} className="btn btn-outline btn-sm">✏️ Edit</Link>
              </div>
            ) : applied ? (
              <button className="btn btn-ghost" disabled>✓ Already Applied</button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Description */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-body">
            <SectionHead>Job Description</SectionHead>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, color: 'var(--slate)' }}>{job.description}</div>
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-body">
              <SectionHead>Additional Requirements</SectionHead>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, color: 'var(--slate)' }}>{job.requirements}</div>
            </div>
          </div>
        )}

        {/* Skills */}
        {job.requiredSkills?.length > 0 && (
          <div className="card">
            <div className="card-body">
              <SectionHead>Skills Required</SectionHead>
              <div className="tag-list">
                {job.requiredSkills.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>
          </div>
        )}

        {/* Quick facts */}
        <div className="card">
          <div className="card-body">
            <SectionHead>Quick Facts</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {job.education && <Fact label="Education" value={job.education} />}
              {job.experience && <Fact label="Experience" value={job.experience} />}
              {job.jobType && <Fact label="Job Type" value={job.jobType} />}
              <Fact label="Location" value={locationDisplay} />
              {job.foodAccommodation && <Fact label="Food & Stay" value={job.foodAccommodation} />}
              {(job.salary || job.salaryType === 'negotiable') &&
                <Fact label="Salary" value={job.salaryType === 'negotiable' ? 'Negotiable' : job.salary} />}
              {job.genderPreference && <Fact label="Gender Preference" value={job.genderPreference} />}
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <SectionHead>Posted by</SectionHead>
            <p style={{ color: 'var(--slate)', fontSize: '14px' }}>
              {job.postedByName && <><strong>{job.postedByName}</strong> · </>}
              {job.contactEmail}
              {job.contactPhone && <> · {job.contactPhone}</>}
            </p>
          </div>
          {!isOwner && !applied && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Apply Now</button>
          )}
        </div>
      </div>

      {/* ── Apply Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem' }}>
                Apply for {job.title}
              </h3>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                {/* Applicant summary */}
                <div style={{ background: 'var(--gold-pale)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Applying as:</div>
                  <div style={{ fontSize: '14px', color: 'var(--slate)' }}>
                    {profile?.displayName || user.displayName || user.email}
                    {profile?.kovil && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>· {profile.kovil} Kovil</span>}
                  </div>
                  {profile?.city && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>📍 {profile.city}</div>}
                  {!profile?.phone && (
                    <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: 6 }}>
                      ⚠ No phone on profile — <Link to="/profile" style={{ color: 'var(--red)' }}>add it</Link> so employer can reach you
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Cover Letter / Message <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-control" rows={5}
                    value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Briefly introduce yourself and why you're a good fit for this role…" />
                </div>
                {error && <div className="alert alert-error">{error}</div>}
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

function Chip({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '13px',
      color: 'var(--slate)', background: 'var(--ivory)', padding: '4px 12px',
      borderRadius: 20, border: '1px solid var(--border)',
    }}>{children}</span>
  )
}

function SectionHead({ children }) {
  return <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 14, color: 'var(--charcoal)' }}>{children}</h2>
}

function Fact({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '14px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--charcoal)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const S = {
  logo: {
    width: 60, height: 60, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, var(--gold-pale), var(--gold))',
    color: 'white', fontWeight: 700, fontSize: '1.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  salaryBox: {
    marginTop: 16, padding: '14px 16px',
    background: '#F0FAF4', borderRadius: 'var(--radius)',
    border: '1px solid #B2DFCB',
  },
}
