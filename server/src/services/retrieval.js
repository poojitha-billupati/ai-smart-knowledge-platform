import Information from '../models/Information.js';
import Event from '../models/Event.js';
import Faq from '../models/Faq.js';

const SCORE_THRESHOLD = 0.5;
const PER_COLLECTION_LIMIT = 3;
const TOTAL_LIMIT = 5;

async function textSearch(Model, type, query) {
  const docs = await Model.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(PER_COLLECTION_LIMIT)
    .lean();

  return docs.map((doc) => toResult(type, doc, doc.score));
}

function toResult(type, doc, score = 0) {
  if (type === 'FAQ') {
    return { type, id: doc._id, title: doc.question, text: doc.answer, score };
  }
  if (type === 'EVENT') {
    const date = new Date(doc.date).toISOString().slice(0, 10);
    return {
      type,
      id: doc._id,
      title: doc.title,
      text: `${doc.title} — ${date}, ${doc.location} — ${doc.description}`,
      score,
    };
  }
  return { type, id: doc._id, title: doc.title, text: doc.description, score };
}

/** Regex-on-tags/keywords fallback for single-keyword questions $text scores poorly. */
async function tagFallback(question) {
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return [];

  const regexes = words.map((w) => new RegExp(w, 'i'));
  const [info, faqs] = await Promise.all([
    Information.find({ tags: { $in: regexes } }).limit(PER_COLLECTION_LIMIT).lean(),
    Faq.find({ keywords: { $in: regexes } }).limit(PER_COLLECTION_LIMIT).lean(),
  ]);

  return [...info.map((d) => toResult('INFO', d, SCORE_THRESHOLD)), ...faqs.map((d) => toResult('FAQ', d, SCORE_THRESHOLD))];
}

function buildContextBlock(results) {
  return results.map((r) => `[${r.type}] ${r.type === 'FAQ' ? `Q: ${r.title} A: ${r.text}` : r.text}`).join('\n');
}

/**
 * $text search across information/events/faq (§5), merged and scored,
 * falling back to a tag/keyword regex pass, then declaring no-match.
 * No-match means the caller must NOT call the AI (no hallucination risk,
 * no wasted quota).
 */
export async function retrieve(question) {
  const [information, events, faq] = await Promise.all([
    textSearch(Information, 'INFO', question),
    textSearch(Event, 'EVENT', question),
    textSearch(Faq, 'FAQ', question),
  ]);

  let merged = [...information, ...events, ...faq].sort((a, b) => b.score - a.score);

  if (merged.length === 0 || merged[0].score < SCORE_THRESHOLD) {
    const fallback = await tagFallback(question);
    if (fallback.length > 0) {
      merged = fallback;
    }
  }

  const top = merged.slice(0, TOTAL_LIMIT);

  if (top.length === 0 || top[0].score < SCORE_THRESHOLD) {
    return { matched: false, sources: [], contextBlock: '' };
  }

  // Everything retrieved is worth showing the model, but citing all of it
  // lists records that merely shared a common word. Only surface those
  // scoring near the best match.
  const cutoff = top[0].score * 0.6;
  const cited = top.filter((r) => r.score >= cutoff).slice(0, 3);

  return {
    matched: true,
    sources: cited.map((r) => ({ type: r.type, id: r.id, title: r.title })),
    contextBlock: buildContextBlock(top),
  };
}
