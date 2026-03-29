import { Eye, EyeOff, LogIn, RefreshCcw } from 'lucide-react';
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
import { sendAdminPasswordReset, signInAdmin } from '@/lib/api/admin-auth';

type LoginCardProps = {
  supabaseReady: boolean;
  recoveryMode?: boolean;
  recoverySessionReady?: boolean;
  onSubmitNewPassword?: (password: string) => Promise<void>;
};

export function LoginCard({
  supabaseReady,
  recoveryMode = false,
  recoverySessionReady = false,
  onSubmitNewPassword,
}: LoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Preencha o e-mail para redefinir a senha');
      return;
    }
    setLoading(true);
    try {
      const { error } = await sendAdminPasswordReset(email, `${window.location.origin}/editar?mode=recovery`);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('E-mail de redefinição enviado!', {
          description: 'Verifique sua caixa de entrada.',
        });
        setIsReset(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNewPassword = async () => {
    if (!supabaseReady) {
      toast.error('Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      return;
    }
    if (!recoverySessionReady || !onSubmitNewPassword) {
      toast.error('Abra o link de redefinição novamente para continuar');
      return;
    }
    if (!password || !confirmPassword) {
      toast.error('Preencha a nova senha e a confirmação');
      return;
    }
    if (password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await onSubmitNewPassword(password);
      setPassword('');
      setConfirmPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabaseReady) {
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
      const { error } = await signInAdmin(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-mail ou senha incorretos');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Login realizado');
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
          {recoveryMode
            ? 'Defina sua nova senha para concluir a recuperação.'
            : isReset
              ? 'Enviaremos um link para redefinir sua senha.'
              : 'Entre com e-mail e senha.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supabaseReady && (
          <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o login.
          </div>
        )}
        {recoveryMode ? (
          <div className="space-y-3">
            {!recoverySessionReady ? (
              <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                Validando o link de recuperação. Se isso não avançar, abra o link recebido no e-mail novamente.
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Nova senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!supabaseReady || loading}
                  autoComplete="new-password"
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
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Confirmar senha</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!supabaseReady || loading}
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handleSubmitNewPassword}
              disabled={!supabaseReady || loading || !recoverySessionReady}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </Button>
          </div>
        ) : isReset ? (
          <div className="space-y-3">
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
            <Button onClick={handleResetPassword} disabled={!supabaseReady || loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de redefinição'
              )}
            </Button>
            <button
              type="button"
              onClick={() => setIsReset(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
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
                    autoComplete="current-password"
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
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsReset(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Esqueci minha senha
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
