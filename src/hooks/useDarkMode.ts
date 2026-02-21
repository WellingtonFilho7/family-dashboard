import { useEffect, useState } from 'react';

const STORAGE_KEY = 'family-dashboard:dark-mode';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(STORAGE_KEY, dark ? '1' : '0');
  }, [dark]);

  return [dark, () => setDark((prev) => !prev)] as const;
}
