import { BookOpen, CalendarDays, CheckSquare, Settings } from 'lucide-react';
import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const items: NavItem[] = [
  { to: 'calendario', label: 'Calendário', icon: CalendarDays },
  { to: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { to: 'aprendizado', label: 'Aprendizado', icon: BookOpen },
  { to: 'configuracoes', label: 'Ajustes', icon: Settings },
];

export function SideNav() {
  return (
    <nav
      aria-label="Navegação do painel"
      className="flex w-20 shrink-0 flex-col items-center gap-1 border-r border-border/40 bg-background/60 py-6"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'group flex w-14 flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
