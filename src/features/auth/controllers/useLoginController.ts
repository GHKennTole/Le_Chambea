import { useState, useEffect, useRef } from 'react';
import { Keyboard, Animated, Platform } from 'react-native';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';

export function useLoginController() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [alertBox, setAlertBox] = useState<{
    visible: boolean;
    type: "success" | "danger" | "warning";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "danger",
    title: "",
    message: "",
  });

  const alertAnim = useRef(new Animated.Value(0)).current;
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateAlertIn = () => {
    alertAnim.setValue(0);
    Animated.timing(alertAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const animateAlertOut = (onDone?: () => void) => {
    Animated.timing(alertAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  useEffect(() => {
    if (!alertBox.visible) return;
    animateAlertIn();

    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);

    alertTimerRef.current = setTimeout(() => {
      animateAlertOut(() => setAlertBox((p) => ({ ...p, visible: false })));
    }, 5000);

    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [alertBox.visible]);

  const showNiceAlert = (type: "success" | "danger" | "warning", title: string, message: string) => {
    setAlertBox({ visible: true, type, title, message });
  };

  const closeAlertNow = () => {
    if (!alertBox.visible) return;
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    animateAlertOut(() => {
      setAlertBox((p) => ({ ...p, visible: false }));
    });
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showAlert("Campos incompletos", "Por favor ingresa tu correo electrónico.", undefined, "danger");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showAlert("Correo inválido", "Ingresa un formato de correo electrónico válido (ej. usuario@gmail.com).", undefined, "warning");
      return;
    }

    if (!password) {
      showAlert("Campos incompletos", "Por favor ingresa tu contraseña.", undefined, "danger");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let message = "No se pudo iniciar sesión. Inténtalo nuevamente.";
        if (error.message.includes("Invalid login credentials")) {
          message = "Correo o contraseña incorrectos. Verifica tus datos e inténtalo nuevamente.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Debes confirmar tu correo electrónico antes de poder iniciar sesión.";
        } else if (error.message.includes("rate limit") || error.message.includes("Too many requests")) {
          message = "Demasiados intentos fallidos. Por favor espera unos minutos e inténtalo de nuevo.";
        }
        showAlert("Error al iniciar sesión", message, undefined, "danger");
      }
    } catch (err: unknown) {
      showAlert("Error de conexión", "Ocurrió un error inesperado. Verifica tu conexión a internet.", undefined, "danger");
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    keyboardOpen,
    alertBox,
    alertAnim,
    closeAlertNow,
    handleLogin,
  };
}

