import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function useForgotPasswordController() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (onSuccess: () => void) => {
    if (!email) {
      Alert.alert("Error", "Por favor ingresa tu correo");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Correo enviado", "Revisa tu correo para restablecer tu contraseña");
        onSuccess();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    handleResetPassword,
  };
}
