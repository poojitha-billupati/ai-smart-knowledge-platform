const fields = [
  { key: 'program', label: 'Program', dot: 'bg-dusty' },
  { key: 'college', label: 'College', dot: 'bg-accent' },
  { key: 'hometown', label: 'Hometown', dot: 'bg-sage' },
];

function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function CreatorCard({ data }) {
  return (
    <div className="rise mt-3 overflow-hidden rounded-2xl bg-surface shadow-card">
      <div className="flex items-center gap-3 border-b-2 border-dashed border-rule bg-band px-4 py-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marigold text-lg font-extrabold text-marigold-ink">
          {initialsOf(data.name)}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-marigold">Built by</p>
          <p className="font-display text-2xl leading-none text-band-ink">{data.name}</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.key}>
            <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${f.dot}`} aria-hidden="true" />
              {f.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{data[f.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
