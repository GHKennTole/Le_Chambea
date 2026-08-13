import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function getPasswordStrength(pw: string) {
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
    label = "Buena";
    type = "success";
  } else if (score >= 5) {
    label = "Excelente";
    type = "success";
  }

  return { score, pct, label, type };
}

export function useSecurityController() {
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPasswordFocus, setNewPasswordFocus] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const canSubmit = useMemo(() => {
    if (!currentPassword.trim() || !newPassword || !confirmPassword) return false;
    if (currentPassword === newPassword) return false;
    if (newPassword.length < 6) return false;
    if (newPassword !== confirmPassword) return false;
    if (strength.score < 3) return false;
    return true;
  }, [currentPassword, newPassword, confirmPassword, strength.score]);

  const changePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Campo requerido', 'Ingresá tu contraseña actual.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Campos requeridos', 'Completá la nueva contraseña y su confirmación.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Misma contraseña', 'La nueva contraseña no puede ser igual a la contraseña actual.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Contraseña corta', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (strength.score < 3) {
      Alert.alert(
        'Contraseña débil',
        'Hacé tu contraseña al menos "Aceptable" agregando mayúsculas, números o caracteres especiales.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        Alert.alert('Error', 'No se encontró la sesión activa del usuario.');
        return;
      }

      // Validar contraseña actual intentando autenticar en Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Contraseña incorrecta', 'La contraseña actual no es correcta.');
        return;
      }

      // Actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        Alert.alert('Error', 'No se pudo actualizar la contraseña. Intentá nuevamente.');
        return;
      }

      Alert.alert('¡Éxito!', 'Tu contraseña ha sido actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      console.error('Change password error:', e);
      Alert.alert('Error', 'Ocurrió un error inesperado al cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showCurrentPassword, setShowCurrentPassword,
    showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    newPasswordFocus, setNewPasswordFocus,
    strength,
    canSubmit,
    changePassword,
  };
}
