import { ArrowLeft, LogOut, Moon, RefreshCcw, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/components';
import {
  getAdminSession,
  isPasswordRecoveryLocation,
  signOutAdmin,
  subscribeAdminAuth,
  updateAdminPassword,
} from '@/lib/api/admin-auth';
import { updateVisitMode } from '@/lib/api/settings';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useKioskData } from '@/hooks/useKioskData';
import { adminSupabase, hasSupabaseConfig } from '@/lib/supabase';

import {
  AgendaAdmin,
  ContentAdmin,
  LoginCard,
  PeopleAdmin,
  ReplenishAdmin,
  RoutinesAdmin,
  SupplyAdmin,
} from './admin';

type AdminCategory = 'people' | 'agenda' | 'routines' | 'supply' | 'replenish' | 'content';

function EditPage() {
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();
  const [session, setSession] = useState<Session | null>(null);
  const [category, setCategory] = useState<AdminCategory>('agenda');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isPasswordRecoveryLocation(window.location);
  });

  const { data, loading, refresh, isMock, hasConfig } = useKioskData(false, {
    bypassVisitMode: true,
    requireAuth: true,
    sessionToken: session?.access_token ?? null,
  });

  const supabaseReady = Boolean(adminSupabase) && hasSupabaseConfig && hasConfig;

  const handleLogout = async () => {
    if (!adminSupabase) return;
    await signOutAdmin();
    toast.success('Sessão encerrada');
  };

  const toggleVisitMode = async () => {
    if (!adminSupabase || !session) return;
    const current = data?.settings.visitMode ?? false;
    const { error } = await updateVisitMode(!current);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? 'Modo visitas desativado' : 'Modo visitas ativado');
      refresh();
    }
  };

  useEffect(() => {
    if (!adminSupabase) return;
    getAdminSession().then(setSession);
    const subscription = subscribeAdminAuth((nextSession, event) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handlePasswordRecoveryComplete = async (password: string) => {
    const { error } = await updateAdminPassword(password);
    if (error) {
      toast.error(error.message);
      return;
    }

    setIsPasswordRecovery(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/editar');
    }
    toast.success('Senha atualizada');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-4 py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* Header — compact, icon-only on mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/painel')} aria-label="Voltar ao painel">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">Editar</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleDark} aria-label={dark ? 'Modo claro' : 'Modo escuro'}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={refresh} disabled={loading} aria-label="Atualizar dados">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {session && !isPasswordRecovery && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Visit mode toggle — inline under header */}
        {session && !isPasswordRecovery && (
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
            <span className="text-sm font-medium">Modo visitas</span>
            <Switch
              checked={data?.settings.visitMode ?? false}
              onCheckedChange={toggleVisitMode}
              disabled={!supabaseReady || loading}
            />
          </div>
        )}

        {!supabaseReady ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Configurar Supabase</CardTitle>
              <CardDescription>
                Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar o CRUD direto aqui.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {isMock ? (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">Modo mock</CardTitle>
              <CardDescription>Sem credenciais Supabase; dados não serão salvos.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {/* Category tabs — horizontal scroll */}
        {session && !isPasswordRecovery ? (
          <div className="-mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: 'agenda', label: 'Agenda', count: (data?.recurringItems?.length ?? 0) + (data?.oneOffItems?.length ?? 0) },
                { key: 'people', label: 'Pessoas', count: data?.people?.length },
                { key: 'routines', label: 'Rotinas', count: data?.kidRoutineTemplates?.length },
                { key: 'supply', label: 'Abastecimento', count: data?.supplyStates?.length },
                { key: 'replenish', label: 'Lembretes', count: data?.replenishItems?.length },
                { key: 'content', label: 'Conteúdo', count: (data?.weeklyFocus?.length ?? 0) + (data?.homeschoolNotes?.length ?? 0) },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={category === item.key ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCategory(item.key as AdminCategory)}
                >
                  {item.label}
                  {item.count != null && item.count > 0 ? (
                    <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 py-0.5 text-xs tabular-nums leading-none">
                      {item.count}
                    </span>
                  ) : null}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {!session || isPasswordRecovery ? (
          <LoginCard
            supabaseReady={supabaseReady}
            recoveryMode={isPasswordRecovery}
            recoverySessionReady={Boolean(session)}
            onSubmitNewPassword={handlePasswordRecoveryComplete}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {category === 'people' && (
              <PeopleAdmin
                people={data?.people ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'agenda' && (
              <AgendaAdmin
                people={data?.people ?? []}
                recurring={data?.recurringItems ?? []}
                oneOff={data?.oneOffItems ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'routines' && (
              <RoutinesAdmin
                people={data?.people ?? []}
                templates={data?.kidRoutineTemplates ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'replenish' && (
              <ReplenishAdmin
                items={data?.replenishItems ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'supply' && (
              <SupplyAdmin
                states={data?.supplyStates ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
            {category === 'content' && (
              <ContentAdmin
                people={data?.people ?? []}
                focus={data?.weeklyFocus ?? []}
                notes={data?.homeschoolNotes ?? []}
                loading={loading}
                refresh={refresh}
                disabled={!supabaseReady || !session}
                hasSession={Boolean(session)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EditPage;
