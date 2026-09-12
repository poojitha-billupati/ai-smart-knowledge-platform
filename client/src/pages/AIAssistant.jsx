import { useRef, useState } from 'react';
import { askAssistant } from '../api/client';

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
