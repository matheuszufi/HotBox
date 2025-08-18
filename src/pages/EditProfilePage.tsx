import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components';
import type { User } from '../types';

export function EditProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<User>>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  const onSubmit = async (data: Partial<User>) => {
    setIsSubmitting(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      await updateProfile(data);
      setUpdateSuccess(true);
    } catch (error: any) {
      setUpdateError(error.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Perfil</h1>
        <p className="text-gray-600">Atualize suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {updateError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                Perfil atualizado com sucesso!
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Nome completo"
                type="text"
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

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O e-mail não pode ser alterado
                </p>
              </div>
            </div>

            <Input
              label="Telefone"
              type="tel"
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
              label="Endereço"
              type="text"
              placeholder="Rua, número, bairro, cidade"
              error={errors.address?.message}
              {...register('address')}
            />

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Informações da Conta</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Tipo de conta:</strong> {user.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
                <p><strong>E-mail verificado:</strong> {user.emailVerified ? 'Sim' : 'Não'}</p>
                <p><strong>Membro desde:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
