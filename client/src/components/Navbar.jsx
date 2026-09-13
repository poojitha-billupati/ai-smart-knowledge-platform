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
  `flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-marigold font-semibold text-marigold-ink'
      : 'text-band-dim hover:bg-white/10 hover:text-band-ink'
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();

  return (
    <header className="relative overflow-hidden bg-band text-band-ink">
      <div
        className="jaali pointer-events-none absolute inset-0 text-marigold opacity-15"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex items-center justify-between gap-4 py-3.5">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Seal className="h-8 w-8 text-marigold" />
            <span className="font-display text-lg leading-none tracking-wide">
              Knowledge Platform
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <nav className="hidden md:block">
              <ul className="flex">
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
              className="ml-1 p-2 text-band-dim transition-colors hover:bg-white/10 hover:text-band-ink"
            >
              <Icon name={dark ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="p-2 text-band-dim transition-colors hover:bg-white/10 hover:text-band-ink md:hidden"
            >
              <Icon name={open ? 'close' : 'menu'} className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-white/15 pb-3 md:hidden">
            <ul className="grid pt-2">
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

      <div className="relative h-1 bg-marigold" aria-hidden="true" />
    </header>
  );
}
