import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { CreateUserDto } from '../api/types';
import { appAlerts } from '../utils/appAlerts';

export interface UseRegisterFormOptions {
  onSuccess?: () => void;
  /** Se llama si la cuenta se creó pero el inicio de sesión automático falló. */
  onLoginRequired?: () => void;
}

export type RegisterFormData = CreateUserDto & {
  confirm_password: string;
  data_consent: boolean;
};

export const useRegisterForm = (options?: UseRegisterFormOptions) => {
  const { signUp, signIn } = useAuth();
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
      data_consent: false,
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);
    try {
      if (!data.data_consent) {
        setServerError(
          'Debes autorizar el tratamiento de tus datos personales para crear la cuenta.',
        );
        return;
      }
      const { confirm_password, data_consent, ...dto } = data;
      await signUp(dto);

      // La cuenta ya existe: iniciar sesión con las mismas credenciales para
      // entrar directo a la app. Un fallo aquí no es un error de registro.
      try {
        await signIn({
          email: dto.user_email_address,
          password: dto.password,
        });
      } catch {
        appAlerts.alert(
          'Cuenta creada',
          'Tu cuenta se creó correctamente, pero no pudimos iniciar sesión automáticamente. Inicia sesión con tu correo y contraseña.',
          undefined,
          { variant: 'warning' },
        );
        options?.onLoginRequired?.();
        return;
      }

      if (options?.onSuccess) {
        options.onSuccess();
      } else {
        router.replace('/' as any);
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
