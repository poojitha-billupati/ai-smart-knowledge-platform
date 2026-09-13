import Icon from './Icon';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rotate-45 animate-pulse bg-terracotta" />
        <span className="h-2.5 w-2.5 rotate-45 animate-pulse bg-accent [animation-delay:180ms]" />
        <span className="h-2.5 w-2.5 rotate-45 animate-pulse bg-marigold [animation-delay:360ms]" />
      </span>
      <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-rule bg-terracotta-wash px-6 py-16 text-center">
      <p className="font-display text-lg text-ink">Couldn't load this</p>
      <p className="max-w-md text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 bg-terracotta px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Icon name="retry" className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-rule px-6 py-16 text-center">
      <span
        className="jaali h-9 w-9 text-ink-faint opacity-40"
        aria-hidden="true"
      />
      <p className="text-sm text-ink-soft">{message}</p>
    </div>
  );
}
