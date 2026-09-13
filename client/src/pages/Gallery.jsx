import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import { getImages, assetUrl } from '../api/client';

const accents = ['indigo', 'marigold', 'terracotta'];

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
            className={`border px-3.5 py-1.5 text-sm transition-colors ${
              category === c
                ? 'border-accent bg-accent font-semibold text-band-ink'
                : 'border-rule bg-surface text-ink-soft hover:border-ink-faint hover:text-ink'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading label="Loading gallery" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load images.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No images in this category yet." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="rise grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((img, i) => (
            <Card
              key={img._id}
              title={img.title}
              subtitle={`Linked to ${img.relatedType}`}
              image={assetUrl(img.imageUrl)}
              accent={accents[i % accents.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
