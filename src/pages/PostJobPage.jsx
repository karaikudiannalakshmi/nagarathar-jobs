// src/pages/PostJobPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { INDUSTRIES, JOB_TYPES, EXPERIENCE_LEVELS, SKILL_TAGS } from '../utils/constants'

export default function PostJobPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm] = useState({
    title: '', company: '', location: '',
    type: 'Full-Time', industry: '', experience: '',
    salary: '', description: '', requirements: '',
    contactEmail: user.email || '', contactPhone: profile?.phone || '',
    skills: [],
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleSkill(s) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const ref = await addDoc(collection(db, 'nj_jobs'), {
        ...form,
        postedBy:      user.uid,
        postedByName:  profile?.displayName || user.displayName || '',
        postedByEmail: user.email,
        postedByKovil: profile?.kovil || '',
        status:        'active',
        views:         0,
        applicants:    0,
        createdAt:     serverTimestamp(),
      })
      navigate(`/jobs/${ref.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <h1 className="page-title">Post a Job</h1>
      <p className="page-subtitle">Fill in the details to list an opportunity for the community</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Job Basics</h2>
            <div className="form-group">
              <label>Job Title *</label>
              <input className="form-control" value={form.title} onChange={set('title')} required
                placeholder="e.g. Senior Accountant, Gold Trader, React Developer" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Company / Organisation *</label>
                <input className="form-control" value={form.company} onChange={set('company')} required
                  placeholder="Your company name" />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input className="form-control" value={form.location} onChange={set('location')} required
                  placeholder="e.g. Chennai / Remote / Karaikudi" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Job Type</label>
                <select className="form-control" value={form.type} onChange={set('type')}>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Industry</label>
                <select className="form-control" value={form.industry} onChange={set('industry')}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Experience Level</label>
                <select className="form-control" value={form.experience} onChange={set('experience')}>
                  <option value="">Any</option>
                  {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Salary / Compensation</label>
                <input className="form-control" value={form.salary} onChange={set('salary')}
                  placeholder="e.g. ₹6–8 LPA, Negotiable" />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Details</h2>
            <div className="form-group">
              <label>Job Description *</label>
              <textarea className="form-control" rows={6} value={form.description} onChange={set('description')} required
                placeholder="Describe the role, responsibilities, and team…" style={{ minHeight: 140 }} />
            </div>
            <div className="form-group">
              <label>Requirements</label>
              <textarea className="form-control" rows={4} value={form.requirements} onChange={set('requirements')}
                placeholder="Qualifications, experience, certifications needed…" style={{ minHeight: 100 }} />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Skills Required</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 16 }}>Select all that apply</p>
            <div className="tag-list">
              {SKILL_TAGS.map(s => (
                <button key={s} type="button"
                  onClick={() => toggleSkill(s)}
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

        {/* Contact */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', marginBottom: 20 }}>Contact Details</h2>
            <div className="grid-2">
              <div className="form-group">
                <label>Contact Email *</label>
                <input className="form-control" type="email" value={form.contactEmail} onChange={set('contactEmail')} required />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input className="form-control" type="tel" value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 …" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/jobs')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Publishing…' : '🚀 Publish Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
