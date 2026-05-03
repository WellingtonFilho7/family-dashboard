import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { mockPeople } from './mock';
import { PanelHeader } from './components/PanelHeader';
import { SideNav } from './components/SideNav';

export default function PanelV2() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelHeader now={now} people={mockPeople} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
