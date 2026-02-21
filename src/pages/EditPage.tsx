import { Moon, RefreshCcw, Sun } from 'lucide-react';
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
} from '@/components';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useKioskData } from '@/hooks/useKioskData';
import { supabase } from '@/lib/supabase';

import {
  AgendaAdmin,
  ConfigAdmin,
  ContentAdmin,
  LoginCard,
  PeopleAdmin,
  ReplenishAdmin,
  RoutinesAdmin,
} from './admin';

type AdminCategory = 'people' | 'agenda' | 'routines' | 'replenish' | 'content' | 'config';

function EditPage() {
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();
  const [session, setSession] = useState<Session | null>(null);
  const [category, setCategory] = useState<AdminCategory>('people');

  const { data, loading, refresh, isMock, hasConfig } = useKioskData(false, {
    bypassVisitMode: true,
    requireAuth: true,
    sessionToken: session?.access_token ?? null,
  });

  const supabaseReady = Boolean(supabase) && hasConfig;

  useEffect(() => {
    const handleHashErrors = () => {
      const hash = window.location.hash || '';
      if (!hash.includes('error')) return;
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const errorCode = params.get('error_code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
        toast.error('Link expirado ou inválido', {
          description: 'Solicite um novo link e abra apenas uma vez.',
        });
      } else if (error || errorDescription) {
        toast.error(error || 'Erro de autenticação', {
          description: errorDescription ?? undefined,
        });
      }

      // Limpa o hash para evitar loops
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    };

    handleHashErrors();

    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">Administração</p>
            <h1 className="text-2xl font-bold">Family Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDark} className="h-9 w-9">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/painel')}>
              Voltar ao painel
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

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
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-700">Modo mock</CardTitle>
              <CardDescription>Sem credenciais Supabase; dados não serão salvos.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {session ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'people', label: 'Pessoas' },
              { key: 'agenda', label: 'Agenda' },
              { key: 'routines', label: 'Rotinas' },
              { key: 'replenish', label: 'Reposição' },
              { key: 'content', label: 'Conteúdo' },
              { key: 'config', label: 'Config' },
            ].map((item) => (
              <Button
                key={item.key}
                variant={category === item.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(item.key as AdminCategory)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}

        {!session ? (
          <LoginCard supabaseReady={supabaseReady} />
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
            {category === 'config' && (
              <ConfigAdmin
                visitMode={data?.settings.visitMode ?? false}
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
