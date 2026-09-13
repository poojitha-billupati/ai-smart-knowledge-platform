import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import { getEvents, getImages, assetUrl } from '../api/client';

async function loadEvents() {
  const [events, images] = await Promise.all([getEvents(), getImages()]);
  const imageById = new Map(images.map((img) => [img._id, assetUrl(img.imageUrl)]));
  return [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((event) => ({ ...event, image: event.imageId ? imageById.get(event.imageId) : undefined }));
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const accents = ['indigo', 'marigold', 'terracotta'];

export default function Events() {
  const { status, data, error, retry } = useAsync(loadEvents, []);

  return (
    <div>
      <PageHeader eyebrow="Calendar" title="Events">
        Upcoming campus events, soonest first.
      </PageHeader>

      {status === 'loading' && <Loading label="Loading events" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load events.'} onRetry={retry} />
      )}
      {status === 'success' && data.length === 0 && (
        <EmptyState message="No events scheduled yet." />
      )}
      {status === 'success' && data.length > 0 && (
        <div className="rise grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event, i) => (
            <Card
              key={event._id}
              title={event.title}
              subtitle={`${dateFormatter.format(new Date(event.date))} · ${event.location}`}
              description={event.description}
              image={event.image}
              accent={accents[i % accents.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
