import { useCallback, useState } from 'react';

function currentlyDark() {
  return document.documentElement.classList.contains('dark');
}

/** Reads the theme applied by the boot script in index.html and lets the user flip it. */
export function useTheme() {
  const [dark, setDark] = useState(currentlyDark);

  const toggle = useCallback(() => {
    const next = !currentlyDark();
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // storage unavailable — the choice just won't persist
    }
    setDark(next);
  }, []);

  return { dark, toggle };
}
