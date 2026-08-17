'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { criarUsuario } from '@/app/services/usuarios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { irParaDestinoPosLogin } from '@/lib/auth-redirect';
import { useAuth } from '@/store/hooks';

const criarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome'),
  email: z.email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

type CriarUsuarioFormData = z.infer<typeof criarUsuarioSchema>;

interface CriarUsuarioModalProps {
  open: boolean;
  onClose: () => void;
}

export function CriarUsuarioModal({ open, onClose }: Readonly<CriarUsuarioModalProps>) {
  const { login } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CriarUsuarioFormData>({
    resolver: zodResolver(criarUsuarioSchema),
    defaultValues: { nome: '', email: '', senha: '' },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      reset();
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, reset]);

  async function onSubmit(data: CriarUsuarioFormData) {
    setIsSubmitting(true);
    setError(null);

    const result = await criarUsuario(data);

    if (!result.success) {
      setIsSubmitting(false);
      setError(result.message ?? 'Não foi possível criar a conta');
      return;
    }

    const loginResult = await login(data.email, data.senha);
    setIsSubmitting(false);

    if (!loginResult.success) {
      setError('Conta criada, mas não foi possível entrar. Tente fazer login.');
      return;
    }

    onClose();
    irParaDestinoPosLogin();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onClose={onClose}
      aria-labelledby="criar-usuario-title"
    >
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="fixed top-[50%] left-[50%] z-50 w-[calc(100%-1rem)] max-h-[min(92dvh,calc(100dvh-1rem))] max-w-sm translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border bg-card p-4 shadow-2xl sm:w-[calc(100%-2rem)] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-black/10 p-2 transition-colors hover:bg-black/20"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="criar-usuario-title" className="text-xl font-bold text-gray-900">
          Criar conta
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Preencha os dados para começar a usar o Fin Control</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="novo-nome">Nome</Label>
            <Input
              id="novo-nome"
              autoComplete="name"
              placeholder="Seu nome"
              {...register('nome')}
              aria-invalid={!!errors.nome}
            />
            {errors.nome && <p className="text-destructive text-sm">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="novo-email">E-mail</Label>
            <Input
              id="novo-email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-senha">Senha</Label>
            <Input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 6 caracteres"
              {...register('senha')}
              aria-invalid={!!errors.senha}
            />
            {errors.senha && <p className="text-destructive text-sm">{errors.senha.message}</p>}
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>
      </div>
    </dialog>
  );
}
