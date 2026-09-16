import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon, { Seal } from './Icon';
import { useTheme } from '../hooks/useTheme';

const links = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/gallery', label: 'Gallery', icon: 'gallery' },
  { to: '/events', label: 'Events', icon: 'events' },
  { to: '/assistant', label: 'AI Assistant', icon: 'assistant' },
  { to: '/admin', label: 'Admin', icon: 'admin' },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
    isActive
      ? 'bg-accent text-marigold-ink shadow-card'
      : 'text-ink-soft hover:bg-sunk hover:text-ink'
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();

  return (
    <header className="border-b-2 border-dashed border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <Seal className="h-9 w-9 text-accent" />
            <span className="font-display text-[30px] leading-none text-band">
              VITS Space
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <nav className="hidden md:block">
              <ul className="flex gap-1">
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} end={link.end} className={linkClass}>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="ml-1 rounded-full p-2 text-ink-faint transition-colors hover:bg-sunk hover:text-ink"
            >
              <Icon name={dark ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="rounded-full p-2 text-ink-faint transition-colors hover:bg-sunk hover:text-ink md:hidden"
            >
              <Icon name={open ? 'close' : 'menu'} className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t-2 border-dashed border-rule pb-3 md:hidden">
            <ul className="grid gap-1 pt-2.5">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    <Icon name={link.icon} className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
