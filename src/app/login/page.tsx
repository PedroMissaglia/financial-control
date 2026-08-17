'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CriarUsuarioModal } from '@/components/criar-usuario-modal';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/store/hooks';

const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCriarOpen, setIsCriarOpen] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, router]);

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true);
    setError(null);

    const result = await login(data.email, data.senha);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível autenticar');
      return;
    }

    router.replace('/');
  }

  return (
    <>
      <Header />
      <main id="main-content" className="grid min-h-0 flex-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src="/login-opcoes/4-still-life.png"
            alt="Cofre e planta em mesa clara, ilustrando organização financeira"
            className="absolute inset-0 size-full object-cover"
          />
        </div>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl" aria-hidden="true">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">Fin Control</h1>
                <p className="text-muted-foreground mt-1 text-sm">Entre para gerenciar suas finanças</p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-card space-y-4 rounded-xl border p-6 shadow-sm"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
                {errors.email && (
                  <p id="login-email-error" className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••"
                    className="pe-10"
                    {...register('senha')}
                    aria-invalid={!!errors.senha}
                    aria-describedby={errors.senha ? 'login-senha-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(visivel => !visivel)}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 end-0 flex items-center px-3 focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={mostrarSenha}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.senha && (
                  <p id="login-senha-error" className="text-destructive text-sm">
                    {errors.senha.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setIsCriarOpen(true)}
                  className="text-primary font-medium hover:underline focus:outline-none focus-visible:underline"
                >
                  Criar conta
                </button>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />

      <CriarUsuarioModal open={isCriarOpen} onClose={() => setIsCriarOpen(false)} />
    </>
  );
}
