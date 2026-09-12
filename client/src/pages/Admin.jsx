import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import RecordForm from '../components/RecordForm';
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
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Login</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Single seeded admin account (§6).
      </p>
      <label className="mt-4 block text-sm">
        <span className="text-gray-700 dark:text-gray-300">Email</span>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className="text-gray-700 dark:text-gray-300">Password</span>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{value}</p>
      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{label}</p>
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
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <button
          type="button"
          onClick={() => setFormState('new')}
          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          + Add
        </button>
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No records." />
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-3 py-2 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t border-gray-200 dark:border-gray-800">
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-xs truncate px-3 py-2">
                      {row[c.key]}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setFormState(row)}
                      className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row._id)}
                      disabled={deletingId === row._id}
                      className="ml-3 text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
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
    </div>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Admin</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:underline dark:text-gray-400"
        >
          Log out ({admin.email})
        </button>
      </div>

      {status === 'loading' && <Loading label="Loading dashboard…" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load dashboard.'} onRetry={retry} />
      )}
      {status === 'success' && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard label="Information records" value={data.information.length} />
            <StatCard label="Events" value={data.events.length} />
            <StatCard label="FAQ entries" value={data.faq.length} />
            <StatCard label="Images" value={data.images.length} />
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
