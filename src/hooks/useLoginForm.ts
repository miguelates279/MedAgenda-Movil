import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { LoginDto } from '../api/types';

export interface UseLoginFormOptions {
  onSuccess?: () => void;
}

export const useLoginForm = (options?: UseLoginFormOptions) => {
  const { signIn } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginDto>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginDto) => {
    setServerError('');
    setLoading(true);
    try {
      await signIn(data);
      if (options?.onSuccess) {
        options.onSuccess();
      } else {
        // Enrutador central '/' dirigirá a la vista de inicio del modo activo verificado
        router.replace('/' as any);
      }
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (
        msg.includes('network') ||
        msg.includes('internet') ||
        msg.includes('conexion') ||
        msg.includes('conexión')
      ) {
        setServerError('Error de conexión. Revisa tu acceso a internet.');
      } else if (
        msg.includes('match') ||
        msg.includes('password') ||
        msg.includes('contraseña') ||
        msg.includes('invalid') ||
        msg.includes('unauthorized') ||
        msg.includes('not found') ||
        msg.includes('user') ||
        msg.includes('credential') ||
        err?.status === 400 ||
        err?.status === 401
      ) {
        setServerError('Usuario o contraseña incorrecta.');
      } else {
        setServerError(err?.message || 'Usuario o contraseña incorrecta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    control,
    handleSubmit,
    onSubmit,
    loading,
    serverError,
    clearError: () => setServerError(''),
  };
};

export default useLoginForm;
