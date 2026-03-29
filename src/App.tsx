import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import { isDebugEnabled } from '@/lib/debug-utils';
import EditPage from '@/pages/EditPage';
import PanelPage from '@/pages/panel/PanelPage';
import { DesktopOverrideProvider } from '@/pages/panel/desktopOverride';

function App() {
  return (
    <BrowserRouter>
      <DesktopOverrideProvider>
        <Routes>
          <Route path="/painel" element={<PanelPage />} />
          <Route path="/editar" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
        <DebugOverlay />
        <Toaster position="top-right" richColors />
      </DesktopOverrideProvider>
    </BrowserRouter>
  );
}

const getDebugInfo = () => {
  if (typeof window === 'undefined') {
    return {
      innerWidth: 0,
      innerHeight: 0,
      screenWidth: 0,
      screenHeight: 0,
      dpr: 1,
      vvWidth: null as number | null,
      vvHeight: null as number | null,
      vvScale: null as number | null,
      userAgent: 'unknown',
    };
  }

  const vv = window.visualViewport;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    dpr: window.devicePixelRatio ?? 1,
    vvWidth: vv?.width ?? null,
    vvHeight: vv?.height ?? null,
    vvScale: vv?.scale ?? null,
    userAgent: navigator.userAgent,
  };
};

function DebugOverlay() {
  const location = useLocation();
  const enabled = isDebugEnabled(location.search);
  const info = getDebugInfo();

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] max-w-[92vw] rounded-xl bg-black/80 p-3 text-xs text-white shadow-xl">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Debug</p>
      <div className="mt-2 space-y-1 font-mono">
        <p>
          viewport: {Math.round(info.innerWidth)}x{Math.round(info.innerHeight)}
        </p>
        <p>
          screen: {info.screenWidth}x{info.screenHeight}
        </p>
        <p>dpr: {info.dpr}</p>
        {info.vvWidth && info.vvHeight ? (
          <p>
            visualViewport: {Math.round(info.vvWidth)}x{Math.round(info.vvHeight)} scale {info.vvScale}
          </p>
        ) : null}
        <p className="break-all text-white/70">ua: {info.userAgent}</p>
      </div>
    </div>
  );
}

export default App;
