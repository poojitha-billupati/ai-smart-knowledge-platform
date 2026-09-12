import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import Card from '../components/Card';
import { getEvents, getImages } from '../api/client';

async function loadEvents() {
  const [events, images] = await Promise.all([getEvents(), getImages()]);
  const imageById = new Map(images.map((img) => [img._id, img.imageUrl]));
  return [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((event) => ({ ...event, image: event.imageId ? imageById.get(event.imageId) : undefined }));
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function Events() {
  const { status, data, error, retry } = useAsync(loadEvents, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Events</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Upcoming campus events, soonest first.
      </p>

      {status === 'loading' && <Loading label="Loading events…" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load events.'} onRetry={retry} />
      )}
      {status === 'success' && data.length === 0 && (
        <EmptyState message="No events scheduled." />
      )}
      {status === 'success' && data.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => (
            <Card
              key={event._id}
              title={event.title}
              subtitle={`${dateFormatter.format(new Date(event.date))} · ${event.location}`}
              description={event.description}
              image={event.image}
            />
          ))}
        </div>
      )}
    </div>
  );
}
