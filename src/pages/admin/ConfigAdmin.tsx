import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/components';
import { supabase } from '@/lib/supabase';
import type { AdminSectionProps } from './shared';
import { requireAuth } from './shared';

export function ConfigAdmin({
  visitMode,
  loading,
  refresh,
  disabled,
  hasSession,
}: AdminSectionProps & { visitMode: boolean }) {
  const toggleVisit = async () => {
    if (!requireAuth(hasSession)) return;
    const { error } = await supabase!
      .from('settings')
      .upsert({ id: 1, visit_mode: !visitMode }, { onConflict: 'id' });
    if (error) toast.error(error.message);
    else {
      toast.success('Configuração salva');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Opções gerais do painel.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <span className="text-sm font-semibold">Modo visitas</span>
        <Switch checked={visitMode} onCheckedChange={toggleVisit} disabled={disabled || loading} />
      </CardContent>
    </Card>
  );
}
