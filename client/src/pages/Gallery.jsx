import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import Card from '../components/Card';
import { getImages } from '../api/client';

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
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Gallery</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Images linked to events and knowledge records — not static files.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm ${
              category === c
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading label="Loading gallery…" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load images.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No images in this category yet." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((img) => (
            <Card
              key={img._id}
              title={img.title}
              subtitle={`Linked to ${img.relatedType} · ${img.relatedId}`}
              image={img.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
