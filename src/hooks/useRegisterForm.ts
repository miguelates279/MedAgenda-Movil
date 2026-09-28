import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { CreateUserDto } from '../api/types';

export interface UseRegisterFormOptions {
  onSuccess?: () => void;
}

export type RegisterFormData = CreateUserDto & { confirm_password: string };

export const useRegisterForm = (options?: UseRegisterFormOptions) => {
  const { signUp } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch } = useForm<RegisterFormData>({
    defaultValues: {
      first_name: '',
      second_name: '',
      first_last_name: '',
      second_last_name: '',
      legal_id: '',
      user_phone_number: '',
      user_email_address: '',
      password: '',
      confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);
    try {
      const { confirm_password, ...dto } = data;
      await signUp(dto);
      if (options?.onSuccess) {
        options.onSuccess();
      } else {
        router.replace('/clinics' as any);
      }
    } catch (err: any) {
      setServerError(err.message || 'Error al registrar. Intenta de nuevo.');
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
    passwordValue,
    clearError: () => setServerError(''),
  };
};

export default useRegisterForm;
