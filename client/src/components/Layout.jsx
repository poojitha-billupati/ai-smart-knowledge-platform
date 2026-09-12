import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-svh bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-200">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
