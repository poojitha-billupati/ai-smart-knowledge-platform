const GREETING = /^(hi|hey|hello|yo|hii+|namaste|good\s+(morning|afternoon|evening|day))\b/i;
const THANKS = /^(thanks|thank\s*you|thx|ty|great|awesome|nice|cool|perfect)\b/i;
const FAREWELL = /^(bye|goodbye|see\s*you|cya|good\s*night)\b/i;
const CAPABILITY = /(what can you do|who are you|what are you|how do you work|what do you know|help me|^help$)/i;

const replies = {
  greeting:
    "Hello. I'm the campus assistant — I can answer questions about admissions, fees, facilities, hostel, the library, and upcoming events. What would you like to know?",
  thanks: 'Happy to help. Ask me anything else about campus.',
  farewell: 'Goodbye. Come back any time you need campus information.',
  capability:
    "I answer questions using this college's own records — admissions and the application process, fee structure and scholarships, hostel allotment, library hours and facilities, and the upcoming events calendar. Everything I tell you comes from those records, and I show you the sources underneath each answer.",
};

/**
 * Conversational turns that shouldn't touch retrieval — without this, "hi"
 * falls through to the no-match path and answers "I don't have that
 * information in my knowledge base", which reads as broken.
 */
export function detectSmallTalk(question) {
  const q = question.trim();
  if (q.length > 60) return null;
  if (CAPABILITY.test(q)) return replies.capability;
  if (GREETING.test(q)) return replies.greeting;
  if (THANKS.test(q)) return replies.thanks;
  if (FAREWELL.test(q)) return replies.farewell;
  return null;
}

const FOLLOW_UP = /^(is|are|was|were|does|do|did|can|could|will|would|and|but|what about|how about|why|when|where|who|which|it|that|they|those|these|there|also|ok|okay|so)\b/i;
const STOP_WORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'why', 'how', 'the', 'and', 'for', 'are', 'is',
  'was', 'were', 'does', 'do', 'did', 'can', 'could', 'will', 'would', 'about', 'that',
  'this', 'there', 'they', 'them', 'with', 'from', 'you', 'your', 'have', 'has', 'any',
  'its', 'it', 'but', 'also', 'ok', 'okay', 'so', 'get', 'tell', 'need',
]);

function keywords(text) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Short or pronoun-led questions ("is it open on sunday?") carry almost no
 * searchable terms of their own, so retrieval scores them against the wrong
 * records. Borrowing nouns from the previous turn keeps the thread intact
 * without spending a second model round-trip on query rewriting.
 */
export function buildRetrievalQuery(question, history = []) {
  const own = keywords(question);
  const looksLikeFollowUp = own.length <= 2 || FOLLOW_UP.test(question.trim());
  if (!looksLikeFollowUp || history.length === 0) return question;

  const priorUser = [...history].reverse().find((m) => m.role === 'user');
  if (!priorUser) return question;

  const carried = keywords(priorUser.content).filter((w) => !own.includes(w));
  return carried.length > 0 ? `${question} ${carried.join(' ')}` : question;
}
