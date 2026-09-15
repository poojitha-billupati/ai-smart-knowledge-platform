import { useEffect } from 'react';
import Icon from './Icon';

export default function InformationDetailModal({ item, onClose, onAsk }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-band/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rise max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-rule px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              {item.category}
            </p>
            <h3 className="text-2xl font-extrabold leading-snug text-band">{item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {item.description}
          </p>

          {item.tags?.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-accent-wash px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-b-2xl border-t-2 border-dashed border-rule px-6 py-4">
          <button
            type="button"
            onClick={onAsk}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95"
          >
            Ask the assistant about this
            <Icon name="send" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
