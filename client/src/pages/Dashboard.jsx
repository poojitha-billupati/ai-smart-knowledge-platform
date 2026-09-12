import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState } from '../components/QueryState';
import { getInformation, getEvents, getFaq } from '../api/client';

async function loadStats() {
  const [information, events, faq] = await Promise.all([getInformation(), getEvents(), getFaq()]);
  return {
    information: information.length,
    events: events.length,
    faq: faq.length,
  };
}

const tiles = [
  { key: 'information', label: 'Knowledge records', to: '/explore' },
  { key: 'events', label: 'Upcoming events', to: '/events' },
  { key: 'faq', label: 'FAQ entries', to: '/explore' },
];

export default function Dashboard() {
  const { status, data, error, retry } = useAsync(loadStats, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        A single place to browse campus information, events, and media — and to ask the AI
        assistant anything grounded in this data.
      </p>

      {status === 'loading' && <Loading label="Loading stats…" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load stats.'} onRetry={retry} />
      )}
      {status === 'success' && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              to={tile.to}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                {data[tile.key]}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{tile.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Ask the AI Assistant
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Questions are answered only from data in this platform, with sources shown.
        </p>
        <Link
          to="/assistant"
          className="mt-3 inline-block rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Open AI Assistant
        </Link>
      </div>
    </div>
  );
}
