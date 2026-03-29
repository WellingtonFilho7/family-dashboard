import { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { getDesktopOverrideFromSearch, resolveDesktopOverride } from '@/lib/desktop-override';

const DESKTOP_OVERRIDE_STORAGE_KEY = 'family-dashboard:desktop-override';

export const DesktopOverrideContext = createContext(false);

export const useDesktopOverrideValue = () => useContext(DesktopOverrideContext);

export const useDesktopOverride = () => {
  const location = useLocation();
  const enabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem(DESKTOP_OVERRIDE_STORAGE_KEY);
    return resolveDesktopOverride(location.search, stored);
  }, [location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromSearch = getDesktopOverrideFromSearch(location.search);
    if (fromSearch !== null) {
      window.localStorage.setItem(
        DESKTOP_OVERRIDE_STORAGE_KEY,
        enabled ? '1' : '0',
      );
    }
  }, [enabled, location.search]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (enabled) {
      document.documentElement.dataset.desktop = '1';
    } else {
      delete document.documentElement.dataset.desktop;
    }
  }, [enabled]);

  return enabled;
};
