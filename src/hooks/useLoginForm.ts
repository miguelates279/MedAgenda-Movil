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
        router.replace('/home' as any);
      }
    } catch (err: any) {
      setServerError(err.message || 'Credenciales incorrectas.');
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
