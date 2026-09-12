export default function Card({ title, subtitle, description, image, footer }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {image && (
        <img src={image} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-violet-600 dark:text-violet-400">{subtitle}</p>
        )}
        {description && (
          <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  );
}
