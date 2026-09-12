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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

        <div className="mt-4 space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300">{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  rows={3}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                />
              ) : (
                <input
                  type={f.type === 'datetime' ? 'datetime-local' : 'text'}
                  required={f.required}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                />
              )}
              {f.type === 'tags' && (
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-500">
                  Comma-separated
                </span>
              )}
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
