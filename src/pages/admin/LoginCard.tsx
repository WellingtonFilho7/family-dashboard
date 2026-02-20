import { RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components';
import { supabase } from '@/lib/supabase';

export function LoginCard({ supabaseReady }: { supabaseReady: boolean }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      return;
    }
    if (!email) {
      toast.error('Informe um e-mail');
      return;
    }
    setSending(true);
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/editar` },
    });
    if (import.meta.env.DEV) {
      console.log('OTP sign-in result', { data, error });
    }
    if (error) {
      const isRateLimit = (error as any)?.status === 429 || error.message.toLowerCase().includes('rate');
      if (isRateLimit) {
        toast.error('Muitos pedidos', {
          description: 'Aguarde antes de reenviar o link.',
        });
        setCooldown(60);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Link enviado — verifique seu e-mail', {
        description: 'Abra no Safari e clique apenas 1 vez.',
      });
      setCooldown(60);
    }
    setSending(false);
  };

  return (
    <Card className="w-full max-w-md border border-border/60 bg-white/90">
      <CardHeader>
        <CardTitle>Área administrativa</CardTitle>
        <CardDescription>Login via Supabase Auth (OTP por e-mail).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
          {supabaseReady
            ? 'Insira seu e-mail para receber um link de acesso seguro.'
            : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o login.'}
        </div>
        <form className="space-y-3" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">E-mail</label>
            <Input
              type="email"
              placeholder="admin@familia.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!supabaseReady || sending || cooldown > 0}
            />
          </div>
          <Button type="submit" disabled={!supabaseReady || sending || cooldown > 0} className="w-full">
            {sending ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Receber link'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
