import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import RecordForm from '../components/RecordForm';
import PageHeader from '../components/PageHeader';
import Icon, { Seal } from '../components/Icon';
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
    ],
  },
};

const inputClass =
  'mt-1.5 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none';

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
    <form onSubmit={handleSubmit} className="rise mx-auto mt-8 max-w-sm border border-rule bg-surface">
      <div className="relative overflow-hidden bg-band px-6 py-6 text-center">
        <div
          className="jaali pointer-events-none absolute inset-0 text-marigold opacity-15"
          aria-hidden="true"
        />
        <Seal className="relative mx-auto h-10 w-10 text-marigold" />
        <h2 className="relative mt-3 font-display text-2xl text-band-ink">Admin sign in</h2>
        <p className="relative mt-1 text-xs text-band-dim">
          Staff access for managing campus records
        </p>
      </div>

      <div className="space-y-4 p-6">
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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
          <p className="border-l-[3px] border-terracotta bg-terracotta-wash px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-marigold px-4 py-2.5 text-sm font-semibold text-marigold-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}

const statRules = ['bg-terracotta', 'bg-accent', 'bg-marigold', 'bg-ink-faint'];

function StatCard({ label, value, index }) {
  return (
    <div className="relative border border-rule bg-surface p-5">
      <span
        className={`absolute inset-x-0 top-0 h-[3px] ${statRules[index % statRules.length]}`}
        aria-hidden="true"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <p className="mt-1.5 font-display text-4xl leading-none text-accent tabular-nums">{value}</p>
    </div>
  );
}

function RecordsTable({ collection, rows, onChange }) {
  const { title, columns, fields } = COLLECTIONS[collection];
  const [deletingId, setDeletingId] = useState(null);
  const [formState, setFormState] = useState(null); // null | 'new' | row object

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
      <div className="mb-3 flex items-center justify-between border-b border-rule pb-2.5">
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <button
          type="button"
          onClick={() => setFormState('new')}
          className="inline-flex items-center gap-1.5 border border-rule bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} records yet.`} />
      ) : (
        <div className="overflow-x-auto border border-rule bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunk">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint"
                  >
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t border-rule-soft hover:bg-sunk">
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-xs truncate px-4 py-2.5 text-ink">
                      {row[c.key]}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setFormState(row)}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row._id)}
                      disabled={deletingId === row._id}
                      className="ml-4 text-xs font-semibold text-terracotta hover:underline disabled:opacity-50"
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
        title="Admin"
        aside={
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 border border-rule bg-surface px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            <Icon name="logout" className="h-3.5 w-3.5" />
            Sign out · {admin.email}
          </button>
        }
      >
        Add, edit and remove the records that Explore, Events, Gallery and the assistant all read
        from.
      </PageHeader>

      {status === 'loading' && <Loading label="Loading records" />}
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
          <RecordsTable collection="images" rows={data.images} onChange={retry} />
        </>
      )}
    </div>
  );
}
