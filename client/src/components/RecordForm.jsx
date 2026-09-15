import { useState } from 'react';
import { assetUrl, uploadImage } from '../api/client';
import Icon from './Icon';

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
  // An empty optional select (e.g. "no linked record") must reach the API as
  // null, not be silently dropped — that's the only way an update can clear
  // a previously-set relation instead of leaving the old value in place.
  if (field.type === 'select' && value === '') return null;
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again after an error
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const imageUrl = await uploadImage(file);
      setValues((v) => ({ ...v, imageUrl }));
      setPreviewBroken(false);
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

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
              ) : f.type === 'select' ? (
                <select
                  required={f.required}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={inputClass}
                >
                  {(typeof f.options === 'function' ? f.options(values) : f.options ?? []).map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ),
                  )}
                </select>
              ) : (
                <input
                  type={f.type === 'datetime' ? 'datetime-local' : f.type === 'url' ? 'url' : 'text'}
                  required={f.required}
                  placeholder={f.type === 'url' ? 'https://…' : undefined}
                  value={values[f.key]}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [f.key]: e.target.value }));
                    if (f.key === 'imageUrl') setPreviewBroken(false);
                  }}
                  className={inputClass}
                />
              )}
              {f.type === 'tags' && !f.hint && (
                <span className="mt-1 block text-xs text-ink-faint">Separate with commas</span>
              )}
              {f.hint && <span className="mt-1 block text-xs text-ink-faint">{f.hint}</span>}
              {f.key === 'imageUrl' && (
                <>
                  <span className="mt-1 block text-xs text-ink-faint">
                    Must be a direct link to the image file itself (ending in .jpg, .png, .webp…) —
                    not a link to a webpage that merely shows the image.
                  </span>
                  <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-full bg-sunk px-3.5 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:text-ink">
                    <Icon name="plus" className="h-3 w-3" />
                    {uploading ? 'Uploading…' : 'Upload from your computer'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploading}
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  {uploadError && (
                    <span className="mt-1.5 block text-xs text-terracotta">{uploadError}</span>
                  )}
                  {values.imageUrl && (
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
                </>
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
