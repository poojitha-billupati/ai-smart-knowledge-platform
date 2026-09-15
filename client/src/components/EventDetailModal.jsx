import { useEffect } from 'react';
import Icon from './Icon';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
  timeStyle: 'short',
});

export default function EventDetailModal({ event, onClose }) {
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
        {event.image && (
          <img
            src={event.image}
            alt=""
            className="h-48 w-full rounded-t-2xl object-cover object-top"
          />
        )}
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-rule px-6 py-4">
          <h3 className="text-2xl font-extrabold leading-snug text-band">{event.title}</h3>
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
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">When</dt>
                <dd className="text-sm font-semibold text-ink">
                  {dateFormatter.format(new Date(event.date))}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-dusty" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Where</dt>
                <dd className="text-sm font-semibold text-ink">{event.location}</dd>
              </div>
            </div>
          </dl>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {event.description}
          </p>
        </div>

        <div className="rounded-b-2xl border-t-2 border-dashed border-rule px-6 py-4">
          {event.registrationLink ? (
            <a
              href={event.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95"
            >
              Register for this event
              <Icon name="externalLink" className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-center text-xs text-ink-faint">
              No registration link has been added for this event yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
