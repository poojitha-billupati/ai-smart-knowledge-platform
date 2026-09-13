import { useState } from 'react';

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
  'mt-1.5 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none';

/** Generic add/edit modal driven by a field-definition list (§9 Phase 5 CRUD). */
export default function RecordForm({ title, fields, initialValues = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, toFormValue(f, initialValues[f.key])])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
        className="w-full max-w-md border border-rule bg-surface shadow-xl"
      >
        <div className="border-b border-rule bg-band px-6 py-4">
          <h3 className="font-display text-xl text-band-ink">{title}</h3>
        </div>

        <div className="space-y-4 p-6">
          {fields.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={inputClass}
                />
              )}
              {f.type === 'tags' && (
                <span className="mt-1 block text-xs text-ink-faint">Separate with commas</span>
              )}
            </label>
          ))}

          {error && (
            <p className="border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-rule px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-marigold px-5 py-2 text-sm font-semibold text-marigold-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
