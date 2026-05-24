import { useState, useEffect } from 'react';
import { Keyboard, Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function useLoginController() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let message = "No se pudo iniciar sesión";
        if (error.message.includes("Invalid login credentials")) {
          message = "Correo o contraseña incorrectos. Verifica tus datos e inténtalo nuevamente.";
        }
        Alert.alert("Error al iniciar sesión", message);
      }
    } catch (err: unknown) {
      Alert.alert("Error al iniciar sesión", "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      Alert.alert("Inicio con Google", "Función en desarrollo", [
        { text: "OK", onPress: () => setGoogleLoading(false) },
      ]);
    } catch (_error: unknown) {
      Alert.alert("Error", "No se pudo iniciar sesión con Google");
      setGoogleLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    googleLoading,
    keyboardOpen,
    handleLogin,
    handleGoogleLogin,
  };
}
