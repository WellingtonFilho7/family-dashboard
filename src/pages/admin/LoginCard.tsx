import { Eye, EyeOff, LogIn, RefreshCcw, UserPlus } from 'lucide-react';
import { useState } from 'react';
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast.error('Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      return;
    }
    if (!email || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }
    if (password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Conta criada com sucesso!', {
            description: 'Você já está logado.',
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('E-mail ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle>Área administrativa</CardTitle>
        <CardDescription>
          {isSignUp ? 'Criar conta de administrador.' : 'Entre com e-mail e senha.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supabaseReady && (
          <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o login.
          </div>
        )}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">E-mail</label>
            <Input
              type="email"
              placeholder="admin@familia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!supabaseReady || loading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!supabaseReady || loading}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={!supabaseReady || loading} className="w-full">
            {loading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? 'Criando...' : 'Entrando...'}
              </>
            ) : isSignUp ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar conta
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </>
            )}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setIsSignUp((prev) => !prev)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {isSignUp ? 'Já tem conta? Entrar' : 'Primeira vez? Criar conta'}
        </button>
      </CardContent>
    </Card>
  );
}
