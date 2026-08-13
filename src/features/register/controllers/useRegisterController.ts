import { useState, useMemo, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../../services/supabase';
import type { RegisterFormData } from '../models/register.types';
import { showAlert } from '../../../shared/utils/customAlert';

import { Platform } from 'react-native';

const isValidEmail = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

function getPasswordStrength(pw: string) {
  const p = String(pw || "");
  let score = 0;

  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  const pct = Math.min(100, Math.round((score / 5) * 100));

  let label = "Muy débil";
  let type: "danger" | "warning" | "success" = "danger";

  if (score <= 1) {
    label = "Muy débil";
    type = "danger";
  } else if (score === 2) {
    label = "Débil";
    type = "danger";
  } else if (score === 3) {
    label = "Aceptable";
    type = "warning";
  } else if (score === 4) {
    label = "Fuerte";
    type = "success";
  } else {
    label = "Muy fuerte";
    type = "success";
  }

  return { score, pct, label, type };
}

export function useRegisterController() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    lastName: "",
    birthDate: "",
    genero: "",
    correo: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [alertBox, setAlertBox] = useState<{
    visible: boolean;
    type: "success" | "danger" | "warning";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
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

  const email = String(formData?.correo || "");
  const password = String(formData?.password || "");
  const confirmPassword = String(formData?.confirmPassword || "");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const canContinue = useMemo(() => {
    if (!isValidEmail(email)) return false;
    if (!password || !confirmPassword) return false;
    if (password !== confirmPassword) return false;
    if (strength.score < 3) return false;
    return true;
  }, [email, password, confirmPassword, strength.score]);

  const helperText = useMemo(() => {
    if (!email && !password && !confirmPassword) return "";
    if (!isValidEmail(email)) return "Revisa el correo (formato inválido).";
    if (!password || !confirmPassword) return "Completa contraseña y confirmación.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    if (strength.score < 3) return "Haz tu contraseña al menos “Aceptable” (agrega números, mayúsculas o símbolos).";
    return "";
  }, [email, password, confirmPassword, strength.score]);

  const handleCreateAccount = async (onSuccess: () => void) => {
    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      // Supabase signUp
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.includes("already registered")) {
          showNiceAlert("danger", "Correo ya registrado", "Este correo ya está asociado a una cuenta.");
        } else {
          showNiceAlert("danger", "Error", error.message);
        }
        return;
      }

      if (data.user) {
        // Guardar datos directamente en la tabla usuarios (no depender solo del trigger)
        await supabase.from('usuarios').upsert({
          id: data.user.id,
          correo: cleanEmail,
          nombre: formData.name,
          apellidos: formData.lastName,
          fecha_nacimiento: formData.birthDate,
          genero: formData.genero,
          onboarding_completado: false,
        });

        onSuccess();
      }
    } catch (err: unknown) {
      showNiceAlert("danger", "Error", "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      showAlert("Registro con Google", "La función de registro con Google está en desarrollo.", undefined, "warning");
    } catch (_error: unknown) {
      showAlert("Error", "No se pudo registrar con Google.", undefined, "danger");
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    googleLoading,
    alertBox,
    alertAnim,
    showNiceAlert,
    closeAlertNow,
    strength,
    canContinue,
    helperText,
    handleCreateAccount,
    handleGoogleRegister,
    setGoogleLoading,
  };
}
