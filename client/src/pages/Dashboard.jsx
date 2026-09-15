import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { ErrorState } from '../components/QueryState';
import { SkeletonTiles } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
import { useCountUp } from '../hooks/useCountUp';
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
    dot: 'bg-dusty',
  },
  {
    key: 'events',
    label: 'Upcoming events',
    note: 'Sorted soonest first',
    to: '/events',
    dot: 'bg-accent',
  },
  {
    key: 'faq',
    label: 'FAQ entries',
    note: 'Common student questions',
    to: '/explore',
    dot: 'bg-sage',
  },
];

function TileNumber({ value }) {
  const display = useCountUp(value);
  return (
    <p className="mt-2 font-display text-6xl leading-none text-band tabular-nums">{display}</p>
  );
}

export default function Dashboard() {
  const { status, data, error, retry } = useAsync(loadStats, []);

  return (
    <div>
      <PageHeader eyebrow="Campus overview" title="Everything on campus, in one place">
        Browse departments, facilities and events — or ask the assistant a question in plain
        English and get an answer drawn only from these records.
      </PageHeader>

      {status === 'loading' && <SkeletonTiles count={3} />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load stats.'} onRetry={retry} />
      )}
      {status === 'success' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tiles.map((tile, i) => (
            <Link
              key={tile.key}
              to={tile.to}
              className="rise group rounded-2xl bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.98]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                <span className={`h-1.5 w-1.5 rounded-full ${tile.dot}`} aria-hidden="true" />
                {tile.label}
              </p>
              <TileNumber value={data[tile.key]} />
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                {tile.note}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </p>
            </Link>
          ))}
        </div>
      )}

      <section className="relative mt-10 overflow-hidden rounded-2xl bg-band px-7 py-8 text-band-ink">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-marigold">
              Grounded answers
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-snug">
              Ask the assistant anything about campus
            </h2>
            <p className="mt-2 max-w-xl text-sm text-band-dim">
              Every reply is built from records in this platform, with the sources listed
              underneath — so you can check where the answer came from.
            </p>
          </div>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95"
          >
            Open assistant
            <Icon name="send" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
