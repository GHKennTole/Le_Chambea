import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';
import { getPasswordStrength } from '../../settings/controllers/useSecurityController';

export type ForgotStep = 'email' | 'code' | 'password' | 'success';

function translateAuthError(error: any): string {
  const msg = (error?.message || '').toLowerCase();
  
  if (
    msg.includes('for security purposes') ||
    msg.includes('rate limit') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('too many requests') ||
    msg.includes('once every')
  ) {
    return 'Por favor espera un momento antes de volver a solicitar otro código.';
  }
  if (
    msg.includes('token has expired') ||
    msg.includes('invalid') ||
    msg.includes('otp expired') ||
    msg.includes('token is expired')
  ) {
    return 'El código ingresado es incorrecto.';
  }
  if (msg.includes('user not found') || msg.includes('user does not exist')) {
    return 'No encontramos ninguna cuenta con este correo.';
  }
  if (msg.includes('password should be at least') || msg.includes('password is too short')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('same password') || msg.includes('different from the old password')) {
    return 'La nueva contraseña no puede ser igual a la anterior.';
  }
  if (msg.includes('network request failed') || msg.includes('failed to fetch')) {
    return 'Error de conexión a internet.';
  }
  
  return 'Ocurrió un error. Inténtalo nuevamente.';
}

export function useForgotPasswordController() {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordFocus, setNewPasswordFocus] = useState(false);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start cooldown timer
  const startCooldown = useCallback((seconds: number = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Password strength
  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmitPassword = useMemo(() => {
    if (!newPassword || !confirmPassword) return false;
    if (newPassword.length < 6) return false;
    if (newPassword !== confirmPassword) return false;
    if (strength.score < 3) return false;
    return true;
  }, [newPassword, confirmPassword, strength.score]);

  // Mask email for display: u***@correo.com
  const maskedEmail = useMemo(() => {
    if (!email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}***@${domain}`;
  }, [email]);

  // Email validation
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // ─── Step 1: Send recovery code ───
  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showAlert('Campo requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      showAlert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);

      if (error) {
        showAlert('Aviso', translateAuthError(error));
      } else {
        showAlert('Código enviado', `Revisa tu correo ${maskedEmail} e ingresa el código.`);
        setStep('code');
        startCooldown(60);
      }
    } catch (err: any) {
      showAlert('Error', translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP code ───
  const handleVerifyCode = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 8) {
      showAlert('Código incompleto', 'Debes ingresar los 8 dígitos.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedCode,
        type: 'recovery',
      });

      if (error) {
        showAlert('Código incorrecto', 'El código ingresado es incorrecto.');
      } else {
        setStep('password');
      }
    } catch (err: any) {
      showAlert('Código incorrecto', 'El código ingresado es incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2b: Resend code ───
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        showAlert('Aviso', translateAuthError(error));
      } else {
        showAlert('Código reenviado', `Se envió un nuevo código a ${maskedEmail}.`);
        setCode('');
        startCooldown(60);
      }
    } catch (err: any) {
      showAlert('Error', translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Update password ───
  const handleUpdatePassword = async () => {
    if (!canSubmitPassword) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showAlert('Error', translateAuthError(error));
      } else {
        // Do NOT call signOut here so the success window can be displayed seamlessly!
        setStep('success');
      }
    } catch (err: any) {
      showAlert('Error', translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Clear code
  const clearCode = () => {
    setCode('');
  };

  // Go back to email step
  const goBackToEmail = () => {
    setCode('');
    setStep('email');
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
    setResendCooldown(0);
  };

  return {
    step,
    email, setEmail,
    code, setCode,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    loading,
    showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    newPasswordFocus, setNewPasswordFocus,
    resendCooldown,
    strength,
    passwordsMatch,
    canSubmitPassword,
    maskedEmail,
    handleSendCode,
    handleVerifyCode,
    handleResendCode,
    handleUpdatePassword,
    clearCode,
    goBackToEmail,
  };
}
