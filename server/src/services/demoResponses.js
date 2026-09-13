/**
 * Canned answers for DEMO_MODE (§8) — the only fallback once the model is
 * out of the picture. Also used as a last resort when a live model
 * call fails (not running, model not pulled, timeout), so the demo
 * never shows a raw error. Keyed to the seeded dataset (§9 seed.js);
 * add more entries here as rehearsed demo questions are finalized.
 */
const DEMO_RESPONSES = [
  {
    keywords: ['hostel', 'housing', 'allotment', 'room'],
    answer:
      'Hostel rooms are allotted by seniority and distance from campus. First-year students are guaranteed a seat if they apply before the July deadline.',
    sources: [{ type: 'INFO', id: 'demo-hostel', title: 'Hostel Allotment' }],
  },
  {
    keywords: ['fee', 'fees', 'tuition', 'scholarship', 'cost'],
    answer:
      'Tuition is billed per semester, with hostel and mess fees billed separately. A need-based scholarship covers up to 50% of tuition for eligible students.',
    sources: [{ type: 'INFO', id: 'demo-fees', title: 'Fee Structure' }],
  },
  {
    keywords: ['library', 'hours', 'timing'],
    answer: 'The central library is open 8am-10pm on weekdays and 9am-6pm on weekends.',
    sources: [{ type: 'INFO', id: 'demo-library', title: 'Library Hours' }],
  },
  {
    keywords: ['admission', 'admissions', 'apply', 'counseling'],
    answer:
      'Admissions open every June through the online portal. Shortlisted candidates are called for counseling in July.',
    sources: [{ type: 'INFO', id: 'demo-admission', title: 'Admission Process' }],
  },
  {
    keywords: ['workshop', 'ai', 'ml', 'machine learning'],
    answer:
      'The AI & ML Workshop is a hands-on session on machine learning, model training, and deployment, open to all second-year and above students.',
    sources: [{ type: 'EVENT', id: 'demo-workshop', title: 'AI & ML Workshop' }],
  },
  {
    keywords: ['tech fest', 'innovate', 'hackathon'],
    answer:
      'The Annual Tech Fest — Innovate is a three-day event with hackathons, robotics demos, and guest talks from industry speakers.',
    sources: [{ type: 'EVENT', id: 'demo-techfest', title: 'Annual Tech Fest — Innovate' }],
  },
  {
    keywords: ['career fair', 'placement', 'internship', 'job'],
    answer:
      'The Career Fair brings over 40 companies on campus for internship and placement interviews. Bring printed resumes.',
    sources: [{ type: 'EVENT', id: 'demo-career', title: 'Career Fair' }],
  },
];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordMatches(question, keyword) {
  return new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i').test(question);
}

export function matchDemoResponse(question) {
  const scored = DEMO_RESPONSES.map((entry) => ({
    entry,
    hits: entry.keywords.filter((kw) => keywordMatches(question, kw)).length,
  }))
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  return scored.length > 0
    ? { answer: scored[0].entry.answer, sources: scored[0].entry.sources }
    : null;
}
