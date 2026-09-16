import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { ErrorState, EmptyState } from '../components/QueryState';
import { SkeletonTiles, SkeletonTable } from '../components/Skeleton';
import RecordForm from '../components/RecordForm';
import PageHeader from '../components/PageHeader';
import Icon, { Seal } from '../components/Icon';
import { useCountUp } from '../hooks/useCountUp';
import {
  getInformation,
  getEvents,
  getFaq,
  getImages,
  createRecord,
  updateRecord,
  deleteRecord,
  login,
  setToken,
  clearToken,
} from '../api/client';

const USER_KEY = 'auth_user';

async function loadDashboard() {
  const [information, events, faq, images] = await Promise.all([
    getInformation(),
    getEvents(),
    getFaq(),
    getImages(),
  ]);
  return { information, events, faq, images };
}

const COLLECTIONS = {
  information: {
    title: 'Information',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'tags', label: 'Tags', type: 'tags' },
    ],
  },
  events: {
    title: 'Events',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'location', label: 'Location' },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'date', label: 'Date', type: 'datetime', required: true },
      { key: 'location', label: 'Location', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'registrationLink', label: 'Registration link', type: 'url' },
      { key: 'imageUrl', label: 'Image', required: false },
    ],
  },
  faq: {
    title: 'FAQ',
    columns: [
      { key: 'question', label: 'Question' },
      { key: 'category', label: 'Category' },
    ],
    fields: [
      { key: 'question', label: 'Question', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'keywords', label: 'Keywords', type: 'tags' },
    ],
  },
  images: {
    title: 'Images',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'imageUrl', label: 'Image URL', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'altText', label: 'Alt text', required: true },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        hint: "What this photo shows and why it was taken — shown as its caption in Gallery.",
      },
    ],
  },
};

/**
 * The two "which record is this photo from" fields for the Images form.
 * Built per-render (not static, unlike the other collections) because the
 * option list is the live information data, not a fixed schema. Event
 * photos aren't offered here — an event's own image lives on the Event
 * record itself (see the events collection's `imageUrl` field above), so
 * this collection only ever holds gallery photos.
 */
function buildImageLinkFields({ information }) {
  return [
    {
      key: 'relatedType',
      label: 'Linked to',
      type: 'select',
      options: [
        { value: '', label: 'Nothing — a standalone photo' },
        { value: 'information', label: 'A knowledge record' },
      ],
    },
    {
      key: 'relatedId',
      label: 'Which one',
      type: 'select',
      options: (values) => {
        if (values.relatedType === 'information') {
          return [
            { value: '', label: information.length ? 'Choose a record…' : 'No records yet' },
            ...information.map((r) => ({ value: r._id, label: r.title })),
          ];
        }
        return [{ value: '', label: 'Pick "Linked to" first' }];
      },
    },
  ];
}

const inputClass =
  'mt-1.5 w-full rounded-xl border-2 border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none';

function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { token, user } = await login(form.email, form.password);
      setToken(token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rise mx-auto mt-8 max-w-sm rounded-2xl bg-surface shadow-card-hover">
      <div className="rounded-t-2xl bg-band px-6 py-7 text-center">
        <Seal className="mx-auto h-10 w-10 text-marigold" />
        <h2 className="mt-3 text-2xl font-extrabold text-band-ink">Admin sign in</h2>
        <p className="mt-1 text-xs text-band-dim">Staff access for managing campus records</p>
      </div>

      <div className="space-y-4 p-6">
        <label className="block text-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Email
          </span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Password
          </span>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-xl border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-marigold px-4 py-2.5 text-sm font-bold text-marigold-ink transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}

const statDots = ['bg-dusty', 'bg-accent', 'bg-sage', 'bg-ink-faint'];

function StatCard({ label, value, index }) {
  const display = useCountUp(value);
  return (
    <div className="rise rounded-2xl bg-surface p-5 shadow-card" style={{ animationDelay: `${index * 60}ms` }}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
        <span className={`h-1.5 w-1.5 rounded-full ${statDots[index % statDots.length]}`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1.5 font-display text-5xl leading-none text-band tabular-nums">{display}</p>
    </div>
  );
}

function RecordsTable({ collection, rows, onChange, linkables }) {
  const { title, columns, fields: baseFields } = COLLECTIONS[collection];
  const fields = collection === 'images' ? [...baseFields, ...buildImageLinkFields(linkables)] : baseFields;
  const [deletingId, setDeletingId] = useState(null);
  const [formState, setFormState] = useState(null); // null | 'new' | row object
  const [selected, setSelected] = useState(() => new Set());
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort(
      (a, b) => String(a[sort.key]).localeCompare(String(b[sort.key])) * factor,
    );
  }, [rows, sort]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r._id))));
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteRecord(collection, id);
      onChange();
    } catch (err) {
      window.alert(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    const n = selected.size;
    if (!window.confirm(`Delete ${n} ${title.toLowerCase()} record${n === 1 ? '' : 's'}? This can't be undone.`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => deleteRecord(collection, id)));
      setSelected(new Set());
      onChange();
    } catch (err) {
      window.alert(err.message || 'Bulk delete failed.');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleSubmit(payload) {
    if (formState === 'new') {
      await createRecord(collection, payload);
    } else {
      await updateRecord(collection, formState._id, payload);
    }
    setFormState(null);
    onChange();
  }

  return (
    <section className="mt-9">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-rule pb-2.5">
        <h3 className="text-xl font-extrabold text-band">{title}</h3>
        <button
          type="button"
          onClick={() => setFormState('new')}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-soft shadow-card transition-all duration-200 hover:text-ink active:scale-95"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {selected.size > 0 && (
        <div className="rise mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-band px-4 py-2.5 text-band-ink">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-marigold text-marigold-ink">
              <Icon name="check" className="h-3 w-3" />
            </span>
            {selected.size} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-bold text-band-dim hover:text-band-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="rounded-full bg-terracotta px-3.5 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting…' : 'Delete selected'}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} records yet.`} />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunk">
              <tr>
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 accent-accent"
                  />
                </th>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
                    >
                      {c.label}
                      <Icon
                        name="chevron"
                        className={`h-3 w-3 transition-transform ${
                          sort.key === c.key
                            ? `text-accent ${sort.dir === 'asc' ? 'rotate-180' : ''}`
                            : 'opacity-30'
                        }`}
                      />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row._id}
                  className={`border-t border-rule-soft hover:bg-sunk ${
                    selected.has(row._id) ? 'bg-accent-wash' : ''
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(row._id)}
                      onChange={() => toggleRow(row._id)}
                      aria-label={`Select ${row.title ?? row.question ?? 'row'}`}
                      className="h-4 w-4 accent-accent"
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-xs truncate px-4 py-2.5 text-ink">
                      {row[c.key]}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setFormState(row)}
                      className="text-xs font-bold text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row._id)}
                      disabled={deletingId === row._id}
                      className="ml-4 text-xs font-bold text-terracotta hover:underline disabled:opacity-50"
                    >
                      {deletingId === row._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formState && (
        <RecordForm
          title={formState === 'new' ? `Add ${title}` : `Edit ${title}`}
          fields={fields}
          initialValues={formState === 'new' ? {} : formState}
          onSubmit={handleSubmit}
          onCancel={() => setFormState(null)}
        />
      )}
    </section>
  );
}

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export default function Admin() {
  const [admin, setAdmin] = useState(storedUser);
  const { status, data, error, retry } = useAsync(loadDashboard, []);

  function handleLogout() {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setAdmin(null);
  }

  if (!admin) {
    return <LoginForm onLogin={setAdmin} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Staff only"
        title="VITS Space"
        aside={
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-soft shadow-card transition-colors hover:text-ink"
          >
            <Icon name="logout" className="h-3.5 w-3.5" />
            Sign out · {admin.email}
          </button>
        }
      >
        Add, edit and remove the records that Explore, Events, Gallery and the assistant all read
        from. Select rows to delete several at once.
      </PageHeader>

      {status === 'loading' && (
        <>
          <SkeletonTiles count={4} />
          <div className="mt-9">
            <SkeletonTable rows={4} />
          </div>
        </>
      )}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load dashboard.'} onRetry={retry} />
      )}
      {status === 'success' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Information" value={data.information.length} index={0} />
            <StatCard label="Events" value={data.events.length} index={1} />
            <StatCard label="FAQ entries" value={data.faq.length} index={2} />
            <StatCard label="Images" value={data.images.length} index={3} />
          </div>

          <RecordsTable collection="information" rows={data.information} onChange={retry} />
          <RecordsTable collection="events" rows={data.events} onChange={retry} />
          <RecordsTable collection="faq" rows={data.faq} onChange={retry} />
          <RecordsTable
            collection="images"
            rows={data.images}
            onChange={retry}
            linkables={{ information: data.information }}
          />
        </>
      )}
    </div>
  );
}
