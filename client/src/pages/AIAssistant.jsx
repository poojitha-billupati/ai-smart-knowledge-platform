import { useEffect, useRef, useState } from 'react';
import { streamAssistant } from '../api/client';
import PageHeader from '../components/PageHeader';
import Markdown from '../components/Markdown';
import Icon, { Seal } from '../components/Icon';

const GREETING = {
  role: 'assistant',
  content:
    "Hello. I'm the campus assistant — ask me about admissions, fees, hostel, the library, or upcoming events.",
  sources: [],
};

const suggestions = [
  'What are the library hours?',
  'How do I apply for admission?',
  'Tell me about the fee structure',
  'What events are coming up?',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const listRef = useRef(null);
  const abortRef = useRef(null);

  const atBottom = useRef(true);

  useEffect(() => {
    if (atBottom.current) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function ask(question) {
    if (!question || pending) return;

    const history = messages
      .filter((m) => m !== GREETING)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', sources: [], streaming: true },
    ]);
    setInput('');
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const patchLast = (patch) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = typeof patch === 'function' ? patch(last) : { ...last, ...patch };
        return next;
      });

    try {
      await streamAssistant(question, history, {
        signal: controller.signal,
        onSources: (sources) => patchLast({ sources }),
        onToken: (token) => patchLast((last) => ({ ...last, content: last.content + token })),
      });
      patchLast({ streaming: false });
    } catch (err) {
      if (err.name === 'AbortError') {
        patchLast({ streaming: false, stopped: true });
      } else {
        patchLast({
          content: err.message || 'Something went wrong. Try asking again.',
          streaming: false,
          failed: true,
        });
      }
    } finally {
      setPending(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    ask(input.trim());
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input.trim());
    }
  }

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex min-h-[74vh] flex-col">
      <PageHeader
        eyebrow="Grounded answers"
        title="AI Assistant"
        aside={
          messages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                setMessages([GREETING]);
              }}
              className="border border-rule bg-surface px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
            >
              New conversation
            </button>
          )
        }
      >
        Replies are built only from records in this platform, and the sources appear under each
        answer so you can check them.
      </PageHeader>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="flex-1 space-y-5 overflow-y-auto border border-rule bg-sunk p-5"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap bg-band px-4 py-2.5 text-sm leading-relaxed text-band-ink">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-3">
              <Seal className="mt-1 h-6 w-6 shrink-0 text-marigold" />
              <div
                className={`max-w-[82%] border-l-[3px] bg-surface px-4 py-3 ${
                  m.failed ? 'border-terracotta' : 'border-marigold'
                }`}
              >
                {m.content ? (
                  <Markdown text={m.content} />
                ) : (
                  <span className="flex gap-1.5 py-1" aria-label="Thinking">
                    <span className="h-2 w-2 rotate-45 animate-pulse bg-terracotta" />
                    <span className="h-2 w-2 rotate-45 animate-pulse bg-accent [animation-delay:180ms]" />
                    <span className="h-2 w-2 rotate-45 animate-pulse bg-marigold [animation-delay:360ms]" />
                  </span>
                )}
                {m.streaming && m.content && (
                  <span className="ml-0.5 inline-block h-3.5 w-[7px] animate-pulse bg-marigold align-text-bottom" />
                )}
                {m.stopped && <p className="mt-1 text-xs text-ink-faint">Stopped.</p>}
                {m.sources?.length > 0 && !m.streaming && (
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
      </div>

      {showSuggestions && (
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

      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about admissions, fees, events…"
          className="max-h-32 min-h-[46px] flex-1 resize-y border border-rule bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        {pending ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="inline-flex h-[46px] items-center gap-2 border border-rule bg-surface px-5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex h-[46px] items-center gap-2 bg-marigold px-5 text-sm font-semibold text-marigold-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
            <Icon name="send" className="h-4 w-4" />
          </button>
        )}
      </form>
      <p className="mt-2 text-xs text-ink-faint">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
