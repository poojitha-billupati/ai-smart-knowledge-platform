import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
import { getInformation } from '../api/client';

const accents = ['indigo', 'marigold', 'terracotta'];

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
      <PageHeader eyebrow="Knowledge base" title="Explore">
        Browse every record the assistant draws on — admissions, fees, facilities, and more.
      </PageHeader>

      <div className="mb-7 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, description, tags…"
            className="w-full border border-rule bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-rule bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && <Loading label="Loading knowledge base" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load records.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No records match your search. Try a different term or category." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="rise grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => (
            <Card
              key={item._id}
              title={item.title}
              subtitle={item.category}
              description={item.description}
              accent={accents[i % accents.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
