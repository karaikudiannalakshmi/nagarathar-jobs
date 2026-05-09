// src/pages/PostJobPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import {
  INDUSTRIES, JOB_TYPES, EXPERIENCE_LEVELS, EDUCATION_LEVELS,
  SALARY_RANGES, LOCATION_TYPES, FOOD_ACCOMMODATION, DEFAULT_SKILLS,
} from '../utils/constants'

export default function PostJobPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [skills, setSkills]     = useState(DEFAULT_SKILLS)
  const [suggestSkill, setSuggestSkill] = useState('')

  const [form, setForm] = useState({
    title: '', company: '', industry: '',
    jobType: 'Full-Time', experience: '', education: '',
    // Location
    locationType: 'Specific Location', location: '',
    // Salary
    salaryType: 'offered',   // 'offered' | 'negotiable'
    salary: '',
    // Benefits
    foodAccommodation: 'Not Provided',
    // Description
    description: '', requirements: '',
    // Contact
    contactEmail: user?.email || '', contactPhone: profile?.phone || '',
    // Skills required
    requiredSkills: [],
  })

  useEffect(() => { loadSkills() }, [])

  async function loadSkills() {
    try {
      const snap = await getDocs(query(collection(db, 'nj_skills'), orderBy('name')))
      if (!snap.empty) {
        setSkills(snap.docs.map(d => d.data().name))
      }
    } catch (_) {}
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleSkill(s) {
    setForm(f => ({
      ...f,
      requiredSkills: f.requiredSkills.includes(s)
        ? f.requiredSkills.filter(x => x !== s)
        : [...f.requiredSkills, s],
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
        applicantCount: 0,
        createdAt:     serverTimestamp(),
      })
      navigate(`/jobs/${ref.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Post a Job</h1>
      <p className="page-subtitle">Fill in the details to list an opportunity for the Nagarathar community</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>

        {/* ── 1. Job Basics ── */}
        <Section title="1. Job Basics">
          <div className="form-group">
            <label>Job Title *</label>
            <input className="form-control" value={form.title} onChange={set('title')} required
              placeholder="e.g. Senior Accountant, Gold Trader, React Developer" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Company / Organisation *</label>
              <input className="form-control" value={form.company} onChange={set('company')} required
                placeholder="Your company or business name" />
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
              <label>Job Type</label>
              <select className="form-control" value={form.jobType} onChange={set('jobType')}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Experience Required</label>
              <select className="form-control" value={form.experience} onChange={set('experience')}>
                <option value="">Any Experience</option>
                {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── 2. Educational Qualification ── */}
        <Section title="2. Educational Qualification">
          <div className="form-group">
            <label>Minimum Education Required</label>
            <select className="form-control" value={form.education} onChange={set('education')}>
              <option value="">No minimum requirement</option>
              {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: -8 }}>
            Candidates below this qualification will still be able to apply but will be flagged.
          </p>
        </Section>

        {/* ── 3. Location ── */}
        <Section title="3. Job Location">
          <div className="form-group">
            <label>Location Type</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {LOCATION_TYPES.map(lt => (
                <label key={lt} style={radioStyle(form.locationType === lt)}>
                  <input type="radio" name="locationType" value={lt}
                    checked={form.locationType === lt}
                    onChange={set('locationType')}
                    style={{ marginRight: 6 }} />
                  {lt}
                </label>
              ))}
            </div>
          </div>
          {form.locationType === 'Specific Location' && (
            <div className="form-group">
              <label>City / Area *</label>
              <input className="form-control" value={form.location} onChange={set('location')}
                required={form.locationType === 'Specific Location'}
                placeholder="e.g. Chennai, Karaikudi, Coimbatore, Varanasi" />
            </div>
          )}
        </Section>

        {/* ── 4. Salary ── */}
        <Section title="4. Salary / Compensation">
          <div className="form-group">
            <label>Salary Type</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['offered','Salary Offered'],['expected','Salary Expected'],['negotiable','Negotiable']].map(([v,l]) => (
                <label key={v} style={radioStyle(form.salaryType === v)}>
                  <input type="radio" name="salaryType" value={v}
                    checked={form.salaryType === v} onChange={set('salaryType')}
                    style={{ marginRight: 6 }} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          {form.salaryType !== 'negotiable' && (
            <div className="form-group">
              <label>{form.salaryType === 'offered' ? 'Salary Offered' : 'Salary Expected'}</label>
              <select className="form-control" value={form.salary} onChange={set('salary')}>
                <option value="">Select Range</option>
                {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </Section>

        {/* ── 5. Food & Accommodation ── */}
        <Section title="5. Food & Accommodation">
          <div className="form-group">
            <label>Benefits Provided</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {FOOD_ACCOMMODATION.map(fa => (
                <label key={fa} style={radioStyle(form.foodAccommodation === fa)}>
                  <input type="radio" name="foodAccommodation" value={fa}
                    checked={form.foodAccommodation === fa}
                    onChange={set('foodAccommodation')}
                    style={{ marginRight: 6 }} />
                  {fa}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 6. Skills Required ── */}
        <Section title="6. Skills Required">
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 14 }}>
            Click to select skills required for this role
          </p>
          <div className="tag-list" style={{ marginBottom: 16 }}>
            {skills.map(s => (
              <button key={s} type="button" onClick={() => toggleSkill(s)}
                style={skillBtnStyle(form.requiredSkills.includes(s))}>
                {s}
              </button>
            ))}
          </div>
          {/* Suggest a skill */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-control" style={{ maxWidth: 280 }}
              value={suggestSkill} onChange={e => setSuggestSkill(e.target.value)}
              placeholder="Don't see a skill? Type to add…" />
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => {
                const s = suggestSkill.trim()
                if (s && !form.requiredSkills.includes(s)) {
                  setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, s] }))
                  setSuggestSkill('')
                }
              }}>
              + Add
            </button>
          </div>
          {form.requiredSkills.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate)', marginBottom: 8 }}>
                Selected ({form.requiredSkills.length}):
              </div>
              <div className="tag-list">
                {form.requiredSkills.map(s => (
                  <span key={s} style={{ ...skillBtnStyle(true), cursor: 'default' }}>
                    {s}
                    <button type="button" onClick={() => toggleSkill(s)}
                      style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontWeight: 700, padding: 0 }}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── 7. Description ── */}
        <Section title="7. Job Description">
          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-control" rows={6} value={form.description}
              onChange={set('description')} required
              placeholder="Describe the role, day-to-day responsibilities, team, and work environment…"
              style={{ minHeight: 140 }} />
          </div>
          <div className="form-group">
            <label>Additional Requirements</label>
            <textarea className="form-control" rows={3} value={form.requirements}
              onChange={set('requirements')}
              placeholder="Any other requirements — certifications, languages, travel, shifts…"
              style={{ minHeight: 90 }} />
          </div>
        </Section>

        {/* ── 8. Contact ── */}
        <Section title="8. Contact Details">
          <div className="grid-2">
            <div className="form-group">
              <label>Contact Email *</label>
              <input className="form-control" type="email" value={form.contactEmail}
                onChange={set('contactEmail')} required />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input className="form-control" type="tel" value={form.contactPhone}
                onChange={set('contactPhone')} placeholder="+91 …" />
            </div>
          </div>
        </Section>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-ghost"
            onClick={() => navigate('/jobs')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Publishing…' : '🚀 Publish Job'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-body">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)', color: 'var(--charcoal)' }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

const radioStyle = (active) => ({
  display: 'flex', alignItems: 'center',
  padding: '7px 16px', borderRadius: 'var(--radius)',
  border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'var(--gold-pale)' : 'var(--white)',
  color: active ? 'var(--gold)' : 'var(--slate)',
  cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400,
  transition: 'all 0.15s',
})

const skillBtnStyle = (active) => ({
  padding: '5px 14px', borderRadius: 20, fontSize: '13px', cursor: 'pointer',
  border: `${active ? '1.5px' : '1px'} solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'var(--gold-pale)' : 'var(--white)',
  color: active ? 'var(--gold)' : 'var(--slate)',
  transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center',
})
