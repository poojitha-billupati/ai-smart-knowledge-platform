import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <Navbar />
      {/* key={pathname} remounts on navigation, re-triggering the rise animation as a page transition */}
      <main key={pathname} className="rise mx-auto w-full max-w-6xl flex-1 px-5 py-9">
        {children}
      </main>
      <footer className="border-t-2 border-dashed border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-ink-faint">
          <span>AI Smart Knowledge &amp; Assistance Platform</span>
          <span>Answers grounded in campus records only</span>
        </div>
      </footer>
    </div>
  );
}
