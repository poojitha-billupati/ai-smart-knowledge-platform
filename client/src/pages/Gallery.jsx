import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { ErrorState, EmptyState } from '../components/QueryState';
import { SkeletonCards } from '../components/Skeleton';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import ImageDetailModal from '../components/ImageDetailModal';
import { getImages, getInformation, assetUrl } from '../api/client';

async function loadGallery() {
  const [images, information] = await Promise.all([getImages(), getInformation()]);
  const infoById = new Map(information.map((r) => [r._id, r]));

  return images.map((img) => ({
    ...img,
    linked: img.relatedType === 'information' ? infoById.get(img.relatedId) : undefined,
  }));
}

const accents = ['accent', 'sage', 'dusty'];

export default function Gallery() {
  const { status, data, error, retry } = useAsync(loadGallery, []);
  const [category, setCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = useMemo(
    () => ['All', ...new Set((data ?? []).map((img) => img.category))],
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return category === 'All' ? data : data.filter((img) => img.category === category);
  }, [data, category]);

  return (
    <div>
      <PageHeader eyebrow="Media" title="Gallery">
        Campus photos — tap one to see what it's from and why. Event photos live on their own
        event page instead.
      </PageHeader>

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
        <ErrorState message={error?.message ?? 'Could not load images.'} onRetry={retry} />
      )}
      {status === 'success' && filtered.length === 0 && (
        <EmptyState message="No images in this category yet." />
      )}
      {status === 'success' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((img, i) => (
            <div
              key={img._id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedImage(img)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedImage(img);
                }
              }}
              className="rise cursor-pointer rounded-2xl"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <Card
                title={img.title}
                subtitle={img.linked ? `From: ${img.linked.title}` : 'Standalone photo'}
                image={assetUrl(img.imageUrl)}
                accent={accents[i % accents.length]}
              />
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageDetailModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
}
