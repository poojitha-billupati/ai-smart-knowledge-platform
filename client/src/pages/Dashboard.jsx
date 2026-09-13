import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState } from '../components/QueryState';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
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
  {
    key: 'information',
    label: 'Knowledge records',
    note: 'Admissions, fees, facilities',
    to: '/explore',
    rule: 'bg-terracotta',
  },
  {
    key: 'events',
    label: 'Upcoming events',
    note: 'Sorted soonest first',
    to: '/events',
    rule: 'bg-accent',
  },
  {
    key: 'faq',
    label: 'FAQ entries',
    note: 'Common student questions',
    to: '/explore',
    rule: 'bg-marigold',
  },
];

export default function Dashboard() {
  const { status, data, error, retry } = useAsync(loadStats, []);

  return (
    <div>
      <PageHeader eyebrow="Campus overview" title="Everything on campus, in one place">
        Browse departments, facilities and events — or ask the assistant a question in plain
        English and get an answer drawn only from these records.
      </PageHeader>

      {status === 'loading' && <Loading label="Loading stats" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load stats.'} onRetry={retry} />
      )}
      {status === 'success' && (
        <div className="rise grid grid-cols-1 border border-rule bg-surface sm:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              to={tile.to}
              className="group relative border-b border-rule p-6 transition-colors last:border-b-0 hover:bg-sunk sm:border-b-0 sm:border-l sm:first:border-l-0"
            >
              <span
                className={`absolute inset-x-0 top-0 h-[3px] ${tile.rule}`}
                aria-hidden="true"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {tile.label}
              </p>
              <p className="mt-2 font-display text-5xl leading-none text-accent tabular-nums">
                {data[tile.key]}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
                {tile.note}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </p>
            </Link>
          ))}
        </div>
      )}

      <section className="relative mt-10 overflow-hidden bg-band px-7 py-8 text-band-ink">
        <div
          className="jaali pointer-events-none absolute inset-0 text-marigold opacity-15"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-marigold">
              Grounded answers
            </p>
            <h2 className="mt-2 max-w-xl font-display text-2xl leading-snug">
              Ask the assistant anything about campus
            </h2>
            <p className="mt-2 max-w-xl text-sm text-band-dim">
              Every reply is built from records in this platform, with the sources listed
              underneath — so you can check where the answer came from.
            </p>
          </div>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 bg-marigold px-5 py-2.5 text-sm font-semibold text-marigold-ink transition-opacity hover:opacity-90"
          >
            Open assistant
            <Icon name="send" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
