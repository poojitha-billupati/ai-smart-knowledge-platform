import { useEffect } from 'react';
import Icon from './Icon';
import { assetUrl } from '../api/client';

const LINKED_LABEL = { event: 'Event', information: 'Knowledge record' };

export default function ImageDetailModal({ image, onClose, onViewEvent }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const linkedLabel = LINKED_LABEL[image.relatedType] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-band/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rise max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface shadow-2xl">
        <img
          src={assetUrl(image.imageUrl)}
          alt={image.altText}
          className="h-56 w-full rounded-t-2xl object-cover object-top"
        />
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-rule px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              {image.category}
            </p>
            <h3 className="text-2xl font-extrabold leading-snug text-band">{image.title}</h3>
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
          <p className="text-sm leading-relaxed text-ink-soft">
            {image.description || image.altText}
          </p>

          {linkedLabel && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-sunk px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                  {linkedLabel}
                </p>
                <p className="text-sm font-semibold text-ink">
                  {image.linked ? image.linked.title : 'That record has since been removed'}
                </p>
              </div>
              {image.relatedType === 'event' && image.linked && (
                <button
                  type="button"
                  onClick={onViewEvent}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-marigold px-4 py-1.5 text-xs font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95"
                >
                  View event
                  <Icon name="externalLink" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
