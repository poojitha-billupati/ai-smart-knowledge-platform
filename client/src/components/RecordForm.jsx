import { useState } from 'react';
import { assetUrl } from '../api/client';

function toFormValue(field, value) {
  if (value == null) return '';
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : value;
  if (field.type === 'datetime') return new Date(value).toISOString().slice(0, 16);
  return value;
}

function toPayloadValue(field, value) {
  if (field.type === 'tags') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (field.type === 'datetime') return new Date(value).toISOString();
  return value;
}

const inputClass =
  'mt-1.5 w-full rounded-xl border-2 border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none';

/** Generic add/edit modal driven by a field-definition list (§9 Phase 5 CRUD). */
export default function RecordForm({ title, fields, initialValues = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, toFormValue(f, initialValues[f.key])])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.fromEntries(
        fields.map((f) => [f.key, toPayloadValue(f, values[f.key])]),
      );
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-band/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="rise w-full max-w-md rounded-2xl bg-surface shadow-2xl"
      >
        <div className="rounded-t-2xl border-b-2 border-dashed border-rule px-6 py-4">
          <h3 className="text-lg font-extrabold text-band">{title}</h3>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
          {fields.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                {f.label}
              </span>
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  rows={3}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={inputClass}
                />
              ) : (
                <input
                  type={f.type === 'datetime' ? 'datetime-local' : 'text'}
                  required={f.required}
                  value={values[f.key]}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [f.key]: e.target.value }));
                    if (f.key === 'imageUrl') setPreviewBroken(false);
                  }}
                  className={inputClass}
                />
              )}
              {f.type === 'tags' && (
                <span className="mt-1 block text-xs text-ink-faint">Separate with commas</span>
              )}
              {f.key === 'imageUrl' && values.imageUrl && (
                <span className="mt-2 block overflow-hidden rounded-xl border-2 border-dashed border-rule bg-sunk">
                  {previewBroken ? (
                    <span className="flex h-28 items-center justify-center text-xs text-ink-faint">
                      Image not found yet — check the path once saved
                    </span>
                  ) : (
                    <img
                      src={assetUrl(values.imageUrl)}
                      alt=""
                      className="h-28 w-full object-cover object-top"
                      onError={() => setPreviewBroken(true)}
                    />
                  )}
                </span>
              )}
            </label>
          ))}

          {error && (
            <p className="rounded-xl border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 rounded-b-2xl border-t-2 border-dashed border-rule px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-marigold px-5 py-2 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
