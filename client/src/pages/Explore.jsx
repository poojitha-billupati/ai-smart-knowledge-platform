import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { ErrorState, EmptyState } from '../components/QueryState';
import { SkeletonCards } from '../components/Skeleton';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import InformationDetailModal from '../components/InformationDetailModal';
import Icon from '../components/Icon';
import { getInformation } from '../api/client';

const accents = ['accent', 'sage', 'dusty'];

function matchesQuery(item, q) {
  return (
    item.title.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

export default function Explore() {
  const { status, data, error, retry } = useAsync(getInformation, []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [selected, setSelected] = useState(null);
  const wrapRef = useRef(null);
  const cardRefs = useRef(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    function onClickAway(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set((data ?? []).map((item) => item.category))],
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      return matchesCategory && (!q || matchesQuery(item, q));
    });
  }, [data, query, category]);

  const quickMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!data || !q) return [];
    return data.filter((item) => matchesQuery(item, q)).slice(0, 5);
  }, [data, query]);

  function jumpTo(item) {
    setCategory('All');
    setShowDropdown(false);
    setHighlightId(item._id);
    requestAnimationFrame(() => {
      cardRefs.current.get(item._id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setTimeout(() => setHighlightId((cur) => (cur === item._id ? null : cur)), 1600);
  }

  function askAboutSelected() {
    if (!selected) return;
    navigate('/assistant', { state: { question: `Tell me about ${selected.title}` } });
  }

  return (
    <div>
      <PageHeader eyebrow="Knowledge base" title="Explore">
        Browse every record the assistant draws on — admissions, fees, facilities, and more. Tap
        a card for the full details.
      </PageHeader>

      <div className="mb-5">
        <div ref={wrapRef} className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => query && setShowDropdown(true)}
            onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
            placeholder="Search title, description, tags…"
            className="w-full rounded-full border-2 border-rule bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          {showDropdown && quickMatches.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-surface shadow-card-hover">
              {quickMatches.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => jumpTo(item)}
                  className="flex w-full items-center justify-between gap-3 border-t border-rule-soft px-4 py-2.5 text-left text-sm transition-colors first:border-t-0 hover:bg-sunk"
                >
                  <span className="truncate font-semibold text-ink">{item.title}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
        <ErrorState message={error?.message ?? 'Could not load records.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No records match your search. Try a different term or category." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => (
            <div
              key={item._id}
              ref={(el) => {
                if (el) cardRefs.current.set(item._id, el);
                else cardRefs.current.delete(item._id);
              }}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(item);
                }
              }}
              className={`rise cursor-pointer rounded-2xl transition-shadow duration-300 ${
                highlightId === item._id ? 'ring-4 ring-marigold' : ''
              }`}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <Card
                title={item.title}
                subtitle={item.category}
                description={item.description}
                tags={item.tags}
                accent={accents[i % accents.length]}
              />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <InformationDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onAsk={askAboutSelected}
        />
      )}
    </div>
  );
}
