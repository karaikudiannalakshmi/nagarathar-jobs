// src/pages/EditJobPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import {
  INDUSTRIES, JOB_TYPES, EXPERIENCE_LEVELS, EDUCATION_LEVELS,
  SALARY_RANGES, LOCATION_TYPES, FOOD_ACCOMMODATION, DEFAULT_SKILLS, GENDER_PREFERENCE,
} from '../utils/constants'

export default function EditJobPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [skills, setSkills]     = useState(DEFAULT_SKILLS)
  const [suggestSkill, setSuggestSkill] = useState('')
  const [form, setForm] = useState(null)

  useEffect(() => {
    loadJob()
    loadSkills()
  }, [id])

  async function loadJob() {
    try {
      const snap = await getDoc(doc(db, 'nj_jobs', id))
      if (!snap.exists()) { navigate('/jobs'); return }
      const data = snap.data()
      // Only the poster can edit
      if (data.postedBy !== user?.uid) { navigate('/jobs'); return }
      setForm(data)
    } finally { setLoading(false) }
  }

  async function loadSkills() {
    try {
      const snap = await getDocs(query(collection(db, 'nj_skills'), orderBy('name')))
      if (!snap.empty) setSkills(snap.docs.map(d => d.data().name))
    } catch (_) {}
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleSkill(s) {
    setForm(f => ({
      ...f,
      requiredSkills: (f.requiredSkills || []).includes(s)
        ? f.requiredSkills.filter(x => x !== s)
        : [...(f.requiredSkills || []), s],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await updateDoc(doc(db, 'nj_jobs', id), {
        ...form,
        updatedAt: serverTimestamp(),
      })
      navigate(`/jobs/${id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>
  if (!form)   return null

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Edit Job Posting</h1>
      <p className="page-subtitle">Update the details of your job listing</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>

        <Section title="1. Job Basics">
          <div className="form-group">
            <label>Job Title *</label>
            <input className="form-control" value={form.title || ''} onChange={set('title')} required/>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Company / Organisation *</label>
              <input className="form-control" value={form.company || ''} onChange={set('company')} required/>
            </div>
            <div className="form-group">
              <label>Industry</label>
              <select className="form-control" value={form.industry || ''} onChange={set('industry')}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Job Type</label>
              <select className="form-control" value={form.jobType || 'Full-Time'} onChange={set('jobType')}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Experience Required</label>
              <select className="form-control" value={form.experience || ''} onChange={set('experience')}>
                <option value="">Any Experience</option>
                {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="2. Educational Qualification">
          <div className="form-group">
            <label>Minimum Education Required</label>
            <select className="form-control" value={form.education || ''} onChange={set('education')}>
              <option value="">No minimum requirement</option>
              {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </Section>

        <Section title="3. Job Location">
          <div className="form-group">
            <label>Location Type</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {LOCATION_TYPES.map(lt => (
                <label key={lt} style={radioStyle(form.locationType === lt)}>
                  <input type="radio" name="locationType" value={lt}
                    checked={form.locationType === lt} onChange={set('locationType')} style={{ marginRight: 6 }}/>
                  {lt}
                </label>
              ))}
            </div>
          </div>
          {form.locationType === 'Specific Location' && (
            <div className="form-group">
              <label>City / Area</label>
              <input className="form-control" value={form.location || ''} onChange={set('location')} placeholder="e.g. Chennai, Karaikudi"/>
            </div>
          )}
        </Section>

        <Section title="4. Salary / Compensation">
          <div className="form-group">
            <label>Salary Type</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['offered','Salary Offered'],['expected','Salary Expected'],['negotiable','Negotiable']].map(([v,l]) => (
                <label key={v} style={radioStyle(form.salaryType === v)}>
                  <input type="radio" name="salaryType" value={v}
                    checked={form.salaryType === v} onChange={set('salaryType')} style={{ marginRight: 6 }}/>
                  {l}
                </label>
              ))}
            </div>
          </div>
          {form.salaryType !== 'negotiable' && (
            <div className="form-group">
              <label>Salary Range</label>
              <select className="form-control" value={form.salary || ''} onChange={set('salary')}>
                <option value="">Select Range</option>
                {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </Section>

        <Section title="5. Food & Accommodation">
          <div className="form-group">
            <label>Benefits Provided</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {FOOD_ACCOMMODATION.map(fa => (
                <label key={fa} style={radioStyle(form.foodAccommodation === fa)}>
                  <input type="radio" name="foodAccommodation" value={fa}
                    checked={form.foodAccommodation === fa} onChange={set('foodAccommodation')} style={{ marginRight: 6 }}/>
                  {fa}
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="5b. Gender Preference">
          <div className="form-group">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {GENDER_PREFERENCE.map(g => (
                <label key={g} style={radioStyle(form.genderPreference === g)}>
                  <input type="radio" name="genderPreference" value={g}
                    checked={form.genderPreference === g} onChange={set('genderPreference')} style={{ marginRight: 6 }}/>
                  {g === 'Any' ? '👥 Any' : g === 'Male' ? '👨 Male' : '👩 Female'}
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="6. Skills Required">
          <div className="tag-list" style={{ marginBottom: 16 }}>
            {skills.map(s => (
              <button key={s} type="button" onClick={() => toggleSkill(s)}
                style={skillBtnStyle((form.requiredSkills || []).includes(s))}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-control" style={{ maxWidth: 280 }}
              value={suggestSkill} onChange={e => setSuggestSkill(e.target.value)}
              placeholder="Add custom skill…"/>
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => {
                const s = suggestSkill.trim()
                if (s && !(form.requiredSkills || []).includes(s)) {
                  setForm(f => ({ ...f, requiredSkills: [...(f.requiredSkills||[]), s] }))
                  setSuggestSkill('')
                }
              }}>+ Add</button>
          </div>
          {(form.requiredSkills || []).length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate)', marginBottom: 8 }}>
                Selected ({form.requiredSkills.length}):
              </div>
              <div className="tag-list">
                {form.requiredSkills.map(s => (
                  <span key={s} style={{ ...skillBtnStyle(true), cursor: 'default' }}>
                    {s}
                    <button type="button" onClick={() => toggleSkill(s)}
                      style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontWeight: 700, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="7. Job Description">
          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-control" rows={6} value={form.description || ''} onChange={set('description')} required style={{ minHeight: 140 }}/>
          </div>
          <div className="form-group">
            <label>Additional Requirements</label>
            <textarea className="form-control" rows={3} value={form.requirements || ''} onChange={set('requirements')} style={{ minHeight: 90 }}/>
          </div>
        </Section>

        <Section title="8. Contact Details">
          <div className="grid-2">
            <div className="form-group">
              <label>Contact Email *</label>
              <input className="form-control" type="email" value={form.contactEmail || ''} onChange={set('contactEmail')} required/>
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input className="form-control" type="tel" value={form.contactPhone || ''} onChange={set('contactPhone')}/>
            </div>
          </div>
        </Section>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/jobs/${id}`)}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
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
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

const radioStyle = active => ({
  display: 'flex', alignItems: 'center', padding: '7px 16px',
  borderRadius: 'var(--radius)', border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'var(--gold-pale)' : 'var(--white)',
  color: active ? 'var(--gold)' : 'var(--slate)', cursor: 'pointer',
  fontSize: '14px', fontWeight: active ? 600 : 400, transition: 'all 0.15s',
})

const skillBtnStyle = active => ({
  padding: '5px 14px', borderRadius: 20, fontSize: '13px', cursor: 'pointer',
  border: `${active ? '1.5px' : '1px'} solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'var(--gold-pale)' : 'var(--white)',
  color: active ? 'var(--gold)' : 'var(--slate)',
  transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center',
})
