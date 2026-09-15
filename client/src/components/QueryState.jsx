import Icon from './Icon';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full animate-bounce bg-dusty [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 rounded-full animate-bounce bg-accent [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 rounded-full animate-bounce bg-sage" />
      </span>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-terracotta/40 bg-terracotta-wash px-6 py-16 text-center">
      <p className="font-display text-3xl text-ink">Couldn't load this</p>
      <p className="max-w-md text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-rule px-6 py-16 text-center">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-dusty" />
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="h-2 w-2 rounded-full bg-sage" />
      </span>
      <p className="text-sm text-ink-soft">{message}</p>
    </div>
  );
}
