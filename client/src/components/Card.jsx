const rules = {
  indigo: 'bg-accent',
  marigold: 'bg-marigold',
  terracotta: 'bg-terracotta',
};

export default function Card({ title, subtitle, description, image, footer, accent = 'indigo' }) {
  return (
    <article className="group flex flex-col border border-rule bg-surface transition-colors hover:border-ink-faint">
      <span className={`h-[3px] w-full ${rules[accent]}`} aria-hidden="true" />
      {image && (
        <img
          src={image}
          alt=""
          className="h-44 w-full border-b border-rule object-cover object-top"
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        {subtitle && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {subtitle}
          </p>
        )}
        <h3 className="font-display text-lg leading-snug text-ink">{title}</h3>
        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </div>
    </article>
  );
}
