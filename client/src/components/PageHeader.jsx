export default function PageHeader({ eyebrow, title, children, aside }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b-2 border-dashed border-rule pb-5">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-balance text-[40px] leading-none text-band">{title}</h1>
        {children && <p className="mt-2.5 max-w-2xl text-sm text-ink-soft">{children}</p>}
      </div>
      {aside}
    </div>
  );
}
