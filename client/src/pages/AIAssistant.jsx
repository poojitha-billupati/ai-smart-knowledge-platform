import { useRef, useState } from 'react';
import { askAssistant } from '../api/client';
import PageHeader from '../components/PageHeader';
import Icon, { Seal } from '../components/Icon';

const suggestions = [
  'What are the library hours?',
  'How do I apply for admission?',
  'What events are coming up?',
];

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

  async function ask(question) {
    if (!question || pending) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setPending(true);

    try {
      const { answer, sources } = await askAssistant(question);
      setMessages((prev) => [...prev, { role: 'assistant', answer, sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', answer: err.message || 'Something went wrong.', sources: [] },
      ]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    ask(input.trim());
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <PageHeader eyebrow="Grounded answers" title="AI Assistant">
        Replies are built only from records in this platform. Sources appear under each answer so
        you can check where it came from.
      </PageHeader>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto border border-rule bg-sunk p-5"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] bg-band px-4 py-2.5 text-sm leading-relaxed text-band-ink">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-3">
              <Seal className="mt-0.5 h-6 w-6 shrink-0 text-marigold" />
              <div className="max-w-[80%] border-l-[3px] border-marigold bg-surface px-4 py-2.5">
                <p className="text-sm leading-relaxed text-ink">{m.answer}</p>
                {m.sources?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-rule pt-2.5">
                    {m.sources.map((s) => (
                      <li
                        key={`${s.type}-${s.id}`}
                        className="bg-accent-wash px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent"
                      >
                        {s.type} · {s.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ),
        )}
        {pending && (
          <div className="flex items-center gap-3">
            <Seal className="h-6 w-6 shrink-0 text-marigold" />
            <span className="flex gap-1.5 border-l-[3px] border-marigold bg-surface px-4 py-3.5">
              <span className="h-2 w-2 rotate-45 animate-pulse bg-terracotta" />
              <span className="h-2 w-2 rotate-45 animate-pulse bg-accent [animation-delay:180ms]" />
              <span className="h-2 w-2 rotate-45 animate-pulse bg-marigold [animation-delay:360ms]" />
            </span>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="border border-rule bg-surface px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about admissions, fees, events…"
          className="flex-1 border border-rule bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="inline-flex items-center gap-2 bg-marigold px-5 py-2.5 text-sm font-semibold text-marigold-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Send
          <Icon name="send" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
