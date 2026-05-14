// src/utils/constants.js

export const KOVILS = [
  'Ilayathakudi', 'Mathur', 'Iraniyur', 'Pillaiyarpatti', 'Soorakudi',
  'Velankudi', 'Nemathanpatti', 'Niraikulam', 'Kandanur', 'Mosakudi',
  'Ariyakudi', 'Kuruvikondanpatti', 'Uraiyur', 'Managudi', 'Sembanarkovil',
  'Nemam', 'Thiruvarangam', 'Ilangarai', 'Kottaiyur', 'Kabilarmalai',
  'Other',
]

export const INDUSTRIES = [
  'Banking & Finance', 'Jewellery & Goldsmithing', 'Trade & Commerce',
  'Textiles & Apparel', 'Technology & IT', 'Real Estate & Construction',
  'Food & Hospitality', 'Education & Training', 'Healthcare',
  'Manufacturing', 'Transport & Logistics', 'Agriculture',
  'Religious & Charitable', 'Legal & Compliance', 'Other',
]

export const JOB_TYPES = [
  'Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Internship',
]

export const EXPERIENCE_LEVELS = [
  'Fresher / No experience required',
  'Entry Level (0–2 years)',
  'Mid Level (2–5 years)',
  'Senior Level (5–10 years)',
  'Expert (10+ years)',
]

export const EDUCATION_LEVELS = [
  'No minimum requirement',
  '10th Pass (SSLC)',
  '12th Pass (HSC)',
  'Diploma / ITI',
  'Any Graduate',
  'B.Com / BBA',
  'B.Sc / B.Tech / B.E',
  'MBA / PGDM',
  'M.Com / M.Sc / M.Tech',
  'CA / CMA / CS',
  'Any Post Graduate',
  'PhD / Doctorate',
]

export const SALARY_RANGES = [
  'Negotiable',
  'Below ₹10,000/month',
  '₹10,000 – ₹20,000/month',
  '₹20,000 – ₹35,000/month',
  '₹35,000 – ₹50,000/month',
  '₹50,000 – ₹75,000/month',
  '₹75,000 – ₹1,00,000/month',
  'Above ₹1,00,000/month',
  '₹2 – ₹4 LPA',
  '₹4 – ₹6 LPA',
  '₹6 – ₹10 LPA',
  '₹10 – ₹15 LPA',
  '₹15 – ₹25 LPA',
  'Above ₹25 LPA',
]

export const LOCATION_TYPES = [
  'Any Location / Remote',
  'Specific Location',
]

export const FOOD_ACCOMMODATION = [
  'Not Provided',
  'Food Provided',
  'Accommodation Provided',
  'Both Food & Accommodation Provided',
]

// Default skills — admin can add more via Admin Dashboard
// These are stored in Firestore nj_skills collection
// This is just the fallback if Firestore not loaded yet
export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
export const GENDER_PREFERENCE = ['Male', 'Female', 'Any']

export const DEFAULT_SKILLS = [
  // Finance & Accounting
  'Accounting', 'Tally', 'GST', 'TDS', 'Auditing', 'Bookkeeping',
  'Financial Reporting', 'Payroll', 'Banking Operations', 'NEFT/RTGS',
  // Jewellery & Trade
  'Gold Assay', 'Jewellery Design', 'CAD/CAM', 'Gem Identification',
  'Trading', 'Export-Import', 'Commodity Trading', 'Stock Market',
  // Technology
  'React', 'JavaScript', 'Python', 'Java', 'SQL', 'Data Analysis',
  'Excel', 'MS Office', 'Tally ERP', 'SAP',
  // Business
  'Digital Marketing', 'Sales', 'Business Development', 'CRM',
  'HR Management', 'Operations', 'Supply Chain', 'Procurement',
  // Languages
  'Tamil', 'Hindi', 'English', 'Telugu', 'Kannada',
  // Others
  'Teaching', 'Research', 'Customer Service', 'Administration',
  'Driving (LMV)', 'Driving (HMV)', 'Security', 'Cooking',
]
