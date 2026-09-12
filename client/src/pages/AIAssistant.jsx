import { useRef, useState } from 'react';
import information from '../mock/information.json';
import events from '../mock/events.json';
import faq from '../mock/faq.json';
import { delay } from '../hooks/useAsync';

const FALLBACK = "I don't have that information in my knowledge base.";

const STOPWORDS = new Set([
  'what', 'when', 'where', 'why', 'how', 'who', 'is', 'are', 'was', 'were',
  'the', 'a', 'an', 'do', 'does', 'did', 'to', 'of', 'in', 'on', 'for',
  'and', 'or', 'i', 'me', 'my', 'you', 'your', 'can', 'about', 'today',
]);

/**
 * Stand-in for the real retrieval + Qwen3-4B call (§4/§5 of the plan,
 * built in Phase 4). Same request/response shape as the future
 * POST /api/chat, so swapping this out is a one-line change.
 */
function mockAskAssistant(question) {
  const q = question.toLowerCase();

  const pool = [
    ...information.map((r) => ({ type: 'INFO', id: r._id, title: r.title, text: r.description })),
    ...events.map((r) => ({ type: 'EVENT', id: r._id, title: r.title, text: r.description })),
    ...faq.map((r) => ({ type: 'FAQ', id: r._id, title: r.question, text: r.answer })),
  ];

  const queryWords = q.split(/\W+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const scored = pool
    .map((r) => {
      const haystack = `${r.title} ${r.text}`.toLowerCase();
      const hits = queryWords.filter((w) => haystack.includes(w)).length;
      return { ...r, hits };
    })
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3);

  if (scored.length === 0) {
    return delay({ answer: FALLBACK, sources: [] }, 600);
  }

  const best = scored[0];
  return delay(
    {
      answer: `${best.text} (mock answer — Phase 4 wires this to Qwen3-4B via Ollama)`,
      sources: scored.map((r) => ({ type: r.type, id: r.id, title: r.title })),
    },
    900,
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      answer: 'Ask me anything about admissions, fees, facilities, or events.',
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setPending(true);

    try {
      const { answer, sources } = await mockAskAssistant(question);
      setMessages((prev) => [...prev, { role: 'assistant', answer, sources }]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Answers are grounded only in this platform's data; sources are shown under each reply.
      </p>

      <div
        ref={listRef}
        className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-lg bg-violet-600 px-3 py-2 text-sm text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[80%] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-gray-800 dark:text-gray-200">{m.answer}</p>
                {m.sources?.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {m.sources.map((s) => (
                      <li
                        key={`${s.type}-${s.id}`}
                        className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                      >
                        [{s.type}] {s.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ),
        )}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
              </span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about admissions, fees, events…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
