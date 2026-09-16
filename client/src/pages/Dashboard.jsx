import { Link, useNavigate } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { ErrorState } from '../components/QueryState';
import { SkeletonTiles } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
import { getInformation, getEvents, getFaq } from '../api/client';

async function loadDashboard() {
  const [information, events, faq] = await Promise.all([getInformation(), getEvents(), getFaq()]);
  const upcoming = [...events]
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return { information, events, upcoming, faq: faq.slice(0, 3) };
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: '2-digit' });
const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const timeFormatter = new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' });

export default function Dashboard() {
  const { status, data, error, retry } = useAsync(loadDashboard, []);
  const navigate = useNavigate();

  function askQuestion(question) {
    navigate('/assistant', { state: { question } });
  }

  return (
    <div>
      <PageHeader eyebrow="Campus overview" title="What's on at PBR VITS">
        The next events on campus, and a straight line to the assistant if your question isn't
        here.
      </PageHeader>

      {status === 'loading' && <SkeletonTiles count={3} />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load the dashboard.'} onRetry={retry} />
      )}

      {status === 'success' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {data.upcoming.length === 0 && (
              <div className="rounded-2xl bg-surface p-6 text-sm text-ink-soft shadow-card">
                No upcoming events on the calendar right now.
              </div>
            )}
            {data.upcoming.map((event, i) => (
              <Link
                key={event._id}
                to="/events"
                className="rise group flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.98]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex w-14 shrink-0 flex-col items-center leading-none">
                  <span className="font-display text-3xl text-band">
                    {dateFormatter.format(new Date(event.date))}
                  </span>
                  <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-ink-faint">
                    {monthFormatter.format(new Date(event.date))}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-extrabold text-ink">{event.title}</p>
                  <p className="text-xs font-semibold text-ink-faint">
                    {event.location} · {timeFormatter.format(new Date(event.date))}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ))}

            <Link
              to="/events"
              className="mt-1 text-center text-xs font-bold text-ink-faint transition-colors hover:text-ink"
            >
              See all events →
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rise rounded-2xl bg-band px-6 py-6 text-band-ink">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-marigold">
                Grounded answers
              </p>
              <h2 className="font-display mt-1 text-[26px] leading-none">
                Ask me anything about campus
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(data.faq.length > 0
                  ? data.faq.map((f) => f.question)
                  : ['What are the library hours?', 'Tell me about the fee structure']
                ).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => askQuestion(q)}
                    className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/25"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <Link
                to="/assistant"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95"
              >
                Open assistant
                <Icon name="send" className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl bg-surface p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                Also on file
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {data.information.length > 0
                  ? data.information.map((r) => r.title).join(' · ')
                  : 'No knowledge records yet.'}
              </p>
              <Link
                to="/explore"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink-faint transition-colors hover:text-ink"
              >
                Browse Explore →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
