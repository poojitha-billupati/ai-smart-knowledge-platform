const paths = {
  dashboard: 'M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z',
  explore: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  gallery: 'M3 5h18v14H3V5Zm0 10 5-5 4 4 3-3 6 6',
  events: 'M3 6h18v15H3V6Zm0 5h18M8 3v5m8-5v5',
  assistant: 'M4 4h16v12H9l-5 4V4Zm4 5h8M8 12h5',
  admin: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm0 6v4m0 3h.01',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  send: 'M4 12h15M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  logout: 'M15 17l5-5-5-5M20 12H9M12 4H5v16h7',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4-4',
  retry: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
};

export default function Icon({ name, className = 'h-4 w-4', strokeWidth = 1.6 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** The lattice medallion used as the platform mark. */
export function Seal({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path
        d="M16 3.5 28.5 16 16 28.5 3.5 16 16 3.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.8"
      />
      <path d="M16 9.5 22.5 16 16 22.5 9.5 16 16 9.5Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
