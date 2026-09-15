const dotClass = { accent: 'bg-accent', sage: 'bg-sage', dusty: 'bg-dusty' };
const tiltClass = {
  accent: 'rotate-[-0.6deg]',
  sage: 'rotate-[0.5deg]',
  dusty: 'rotate-[-0.4deg]',
};

export default function Card({ title, subtitle, description, image, footer, accent = 'accent' }) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl bg-surface p-2 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-card-hover ${tiltClass[accent]}`}
    >
      {image && (
        <img
          src={image}
          alt=""
          className="h-40 w-full rounded-xl object-cover object-top"
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-1.5 pt-3">
        {subtitle && (
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[accent]}`} aria-hidden="true" />
            {subtitle}
          </p>
        )}
        <h3 className="text-base font-extrabold leading-snug text-ink">{title}</h3>
        {description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </div>
    </article>
  );
}
