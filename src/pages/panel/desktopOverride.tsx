import type { ReactNode } from 'react';
import { DesktopOverrideContext, useDesktopOverride } from './desktopOverrideContext';

export function DesktopOverrideProvider({ children }: { children: ReactNode }) {
  const enabled = useDesktopOverride();
  return (
    <DesktopOverrideContext.Provider value={enabled}>
      {children}
    </DesktopOverrideContext.Provider>
  );
}
