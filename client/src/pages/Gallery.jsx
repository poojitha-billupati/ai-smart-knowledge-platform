import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { ErrorState, EmptyState } from '../components/QueryState';
import { SkeletonCards } from '../components/Skeleton';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import { getImages, assetUrl } from '../api/client';

const accents = ['accent', 'sage', 'dusty'];

export default function Gallery() {
  const { status, data, error, retry } = useAsync(getImages, []);
  const [category, setCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...new Set((data ?? []).map((img) => img.category))],
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return category === 'All' ? data : data.filter((img) => img.category === category);
  }, [data, category]);

  return (
    <div>
      <PageHeader eyebrow="Media" title="Gallery">
        Images linked to events and knowledge records — not static files.
      </PageHeader>

      <div className="mb-7 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
              category === c
                ? 'bg-accent text-marigold-ink shadow-card'
                : 'bg-surface text-ink-soft shadow-card hover:text-ink'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {status === 'loading' && <SkeletonCards count={6} />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load images.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No images in this category yet." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((img, i) => (
            <div
              key={img._id}
              className="rise rounded-2xl"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <Card
                title={img.title}
                subtitle={`Linked to ${img.relatedType}`}
                image={assetUrl(img.imageUrl)}
                accent={accents[i % accents.length]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
