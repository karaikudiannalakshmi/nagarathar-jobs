// src/pages/JobDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { sendEmployerNotification, sendApplicantConfirmation } from '../utils/emailjs'

export default function JobDetailPage() {
  const { id }            = useParams()
  const { user, profile } = useAuth()
  const navigate          = useNavigate()
  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadJob()
  }, [id])

  async function loadJob() {
    try {
      const snap = await getDoc(doc(db, 'nj_jobs', id))
      if (!snap.exists()) { navigate('/jobs'); return }
      setJob({ id: snap.id, ...snap.data() })
      // Check if already applied
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
        jobId:          id,
        jobTitle:       job.title,
        jobCompany:     job.company,
        posterUid:      job.postedBy,
        posterEmail:    job.postedByEmail,
        applicantUid:   user.uid,
        applicantName:  profile?.displayName || user.displayName,
        applicantEmail: user.email,
        applicantPhone: profile?.phone || '',
        coverLetter,
        status:         'pending',
        createdAt:      serverTimestamp(),
      })
      // Email 1: notify employer
      sendEmployerNotification({
        to_email:       job.postedByEmail,
        poster_name:    job.postedByName,
        job_title:      job.title,
        applicant_name: profile?.displayName || user.displayName,
        applicant_email: user.email,
        cover_letter:   coverLetter || '(no cover letter)',
      }).catch(() => {})
      // Email 2: confirm to applicant
      sendApplicantConfirmation({
        to_email:       user.email,
        applicant_name: profile?.displayName || user.displayName,
        job_title:      job.title,
        company:        job.company,
      }).catch(() => {})
      setApplied(true)
      setSuccess('Application submitted! The employer has been notified.')
      setShowModal(false)
    } catch (err) {
      setError(err.message)
    } finally { setApplying(false) }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!job) return null

  const isOwner = job.postedBy === user.uid

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <Link to="/jobs" style={{ color: 'var(--muted)', fontSize: '14px', display: 'inline-block', marginBottom: 20 }}>
        ← Back to Jobs
      </Link>

      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={styles.logo}>{job.company?.[0]?.toUpperCase() || '?'}</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{job.title}</h1>
              <div style={{ fontSize: '1.1rem', color: 'var(--slate)', fontWeight: 500, marginBottom: 12 }}>{job.company}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {job.location  && <MetaChip icon="📍" label={job.location} />}
                {job.type      && <MetaChip icon="💼" label={job.type} />}
                {job.industry  && <MetaChip icon="🏢" label={job.industry} />}
                {job.experience && <MetaChip icon="📈" label={job.experience} />}
              </div>
              {job.salary && (
                <div style={{ marginTop: 14, fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--green)' }}>
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div className="section-divider" />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {isOwner ? (
              <span className="badge badge-blue">Your Posting</span>
            ) : applied ? (
              <button className="btn btn-ghost" disabled>✓ Applied</button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Job Description</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--slate)' }}>{job.description}</div>
        </div>
      </div>

      {/* Requirements */}
      {job.requirements && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Requirements</h2>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--slate)' }}>{job.requirements}</div>
          </div>
        </div>
      )}

      {/* Skills */}
      {job.skills?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 14 }}>Skills Required</h2>
            <div className="tag-list">
              {job.skills.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Contact */}
      {job.contactEmail && (
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 14 }}>Contact</h2>
            <p style={{ color: 'var(--slate)' }}>📧 {job.contactEmail}</p>
            {job.contactPhone && <p style={{ color: 'var(--slate)', marginTop: 6 }}>📞 {job.contactPhone}</p>}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem' }}>
                Apply for {job.title}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                <div style={{ background: 'var(--gold-pale)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: '14px' }}>
                  Applying as <strong>{profile?.displayName || user.email}</strong>
                </div>
                <div className="form-group">
                  <label>Cover Letter / Message (optional)</label>
                  <textarea className="form-control" rows={5}
                    value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Briefly introduce yourself and why you're a good fit…" />
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

function MetaChip({ icon, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '14px', color: 'var(--slate)', background: 'var(--ivory)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
      {icon} {label}
    </span>
  )
}

const styles = {
  logo: {
    width: 60, height: 60, borderRadius: 10,
    background: 'linear-gradient(135deg, var(--gold-pale), var(--gold))',
    color: 'white', fontWeight: 700, fontSize: '1.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}
