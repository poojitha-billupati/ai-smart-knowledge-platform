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
  ts: null,
};

const suggestions = [
  'What are the library hours?',
  'How do I apply for admission?',
  'Tell me about the fee structure',
  'What events are coming up?',
];

const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

export default function AIAssistant() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
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
      { role: 'user', content: question, ts: Date.now() },
      { role: 'assistant', content: '', sources: [], streaming: true, ts: Date.now() },
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

  async function copyAnswer(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 1500);
    } catch {
      // Clipboard permission denied — nothing to fall back to silently, so just skip.
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
              className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-soft shadow-card transition-colors hover:text-ink"
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
        className="flex-1 space-y-5 overflow-y-auto rounded-2xl bg-sunk p-4 sm:p-5"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[88%] sm:max-w-[80%]">
                <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-band px-4 py-2.5 text-sm leading-relaxed text-band-ink">
                  {m.content}
                </p>
                {m.ts && (
                  <p className="mt-1 pr-1 text-right text-[10px] text-ink-faint">
                    {timeFormatter.format(m.ts)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div key={i} className="group flex items-start gap-2.5 sm:gap-3">
              <Seal className="mt-1 h-6 w-6 shrink-0 text-marigold" />
              <div className="max-w-[88%] sm:max-w-[80%]">
                <div
                  className={`rounded-2xl rounded-bl-md bg-surface px-4 py-3 shadow-card ${
                    m.failed ? 'ring-2 ring-terracotta/50' : ''
                  }`}
                >
                  {m.content ? (
                    <Markdown text={m.content} />
                  ) : (
                    <span className="flex gap-1.5 py-1" aria-label="Thinking">
                      <span className="h-2 w-2 rounded-full animate-bounce bg-dusty [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full animate-bounce bg-accent [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full animate-bounce bg-sage" />
                    </span>
                  )}
                  {m.streaming && m.content && (
                    <span className="ml-0.5 inline-block h-3.5 w-[7px] animate-pulse bg-marigold align-text-bottom" />
                  )}
                  {m.stopped && <p className="mt-1 text-xs text-ink-faint">Stopped.</p>}
                  {m.sources?.length > 0 && !m.streaming && (
                    <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-rule pt-2.5">
                      {m.sources.map((s) => (
                        <li
                          key={`${s.type}-${s.id}`}
                          className="rounded-full bg-accent-wash px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-accent"
                        >
                          {s.type} · {s.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {!m.streaming && m.content && (
                  <div className="mt-1 flex items-center gap-3 pl-1">
                    {m.ts && <p className="text-[10px] text-ink-faint">{timeFormatter.format(m.ts)}</p>}
                    <button
                      type="button"
                      onClick={() => copyAnswer(m.content, i)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Icon name={copiedIndex === i ? 'check' : 'copy'} className="h-3 w-3" />
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                  </div>
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
              className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-soft shadow-card transition-all duration-200 hover:text-ink active:scale-95"
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
          className="max-h-32 min-h-[46px] flex-1 resize-y rounded-2xl border-2 border-rule bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        {pending ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="inline-flex h-[46px] items-center gap-2 rounded-full bg-surface px-5 text-sm font-bold text-ink-soft shadow-card transition-all duration-200 hover:text-ink active:scale-95"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex h-[46px] items-center gap-2 rounded-full bg-marigold px-5 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40"
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
