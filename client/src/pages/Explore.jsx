import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import Card from '../components/Card';
import { getInformation } from '../api/client';

export default function Explore() {
  const { status, data, error, retry } = useAsync(getInformation, []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...new Set((data ?? []).map((item) => item.category))],
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [data, query, category]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Explore</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Browse knowledge base records — admissions, fees, facilities, and more.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, description, tags…"
          className="min-w-48 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && <Loading label="Loading knowledge base…" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load records.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No records match your search." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card
              key={item._id}
              title={item.title}
              subtitle={item.category}
              description={item.description}
            />
          ))}
        </div>
      )}
    </div>
  );
}
