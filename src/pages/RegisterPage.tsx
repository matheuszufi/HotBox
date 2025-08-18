import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components';
import type { RegisterData } from '../types';
import HotBoxLogo from '../assets/images/hotbox2.png';

export function RegisterPage() {
  const { register: registerUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterData & { confirmPassword: string }>();

  const password = watch('password');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    setIsSubmitting(true);
    setRegisterError('');

    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      // Handle Firebase Auth errors
      if (error?.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este e-mail já está sendo usado por outra conta.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'E-mail inválido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Cadastro com e-mail/senha não está habilitado.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setRegisterError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center mb-6">
            <img 
              src={HotBoxLogo} 
              alt="HotBox" 
              className="h-16" 
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              entre na sua conta existente
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {registerError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {registerError}
                </div>
              )}

              <Input
                label="Nome completo"
                type="text"
                autoComplete="name"
                placeholder="Seu nome completo"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 2,
                    message: 'Nome deve ter pelo menos 2 caracteres',
                  },
                })}
              />

              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'E-mail inválido',
                  },
                })}
              />

              <Input
                label="Telefone (opcional)"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                error={errors.phone?.message}
                {...register('phone', {
                  pattern: {
                    value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                    message: 'Formato: (11) 99999-9999',
                  },
                })}
              />

              <Input
                label="Endereço (opcional)"
                type="text"
                autoComplete="address-line1"
                placeholder="Rua, número, bairro"
                error={errors.address?.message}
                {...register('address')}
              />

              <Input
                label="Senha"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter pelo menos 6 caracteres',
                  },
                })}
              />

              <Input
                label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value =>
                    value === password || 'Senhas não coincidem',
                })}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Entre aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
