import { useState } from 'react';
import { useAsync, delay } from '../hooks/useAsync';
import { Loading, ErrorState, EmptyState } from '../components/QueryState';
import information from '../mock/information.json';
import events from '../mock/events.json';
import faq from '../mock/faq.json';

function loadCounts() {
  return delay({ information: information.length, events: events.length, faq: faq.length });
}

function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });

  function handleSubmit(e) {
    e.preventDefault();
    // Phase 5 wires this to POST /api/auth/login (JWT + bcrypt, §6).
    onLogin(form.email || 'admin@example.com');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Login</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Single seeded admin account (Phase 5).
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
      <button
        type="submit"
        className="mt-5 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        Log in
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

function RecordsTable({ title, rows, columns }) {
  const [items, setItems] = useState(rows);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <button
          type="button"
          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled
          title="Wired to POST /api/... in Phase 5"
        >
          + Add
        </button>
      </div>
      {items.length === 0 ? (
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
              {items.map((row) => (
                <tr key={row._id} className="border-t border-gray-200 dark:border-gray-800">
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-xs truncate px-3 py-2">
                      {row[c.key]}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((r) => r._id !== row._id))}
                      className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [admin, setAdmin] = useState(null);
  const { status, data, error, retry } = useAsync(loadCounts, []);

  if (!admin) {
    return <LoginForm onLogin={setAdmin} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Admin</h1>
        <button
          type="button"
          onClick={() => setAdmin(null)}
          className="text-sm text-gray-600 hover:underline dark:text-gray-400"
        >
          Log out ({admin})
        </button>
      </div>

      {status === 'loading' && <Loading label="Loading dashboard…" />}
      {status === 'error' && (
        <ErrorState message={error?.message ?? 'Could not load dashboard.'} onRetry={retry} />
      )}
      {status === 'success' && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Information records" value={data.information} />
            <StatCard label="Events" value={data.events} />
            <StatCard label="FAQ entries" value={data.faq} />
          </div>

          <RecordsTable
            title="Information"
            rows={information}
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'category', label: 'Category' },
            ]}
          />
          <RecordsTable
            title="Events"
            rows={events}
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'location', label: 'Location' },
            ]}
          />
        </>
      )}
    </div>
  );
}
