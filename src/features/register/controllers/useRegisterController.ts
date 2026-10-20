import { useState, useMemo, useRef, useEffect } from 'react';
import { Animated, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../services/supabase';
import type { RegisterFormData } from '../models/register.types';

export const isValidEmail = (correo: string) => /^[^\s@]+@gmail\.com$/i.test(correo.trim());

export function getEmailValidationError(value: string): string | null {
  const v = (value || "").trim().toLowerCase();
  if (!v) {
    return "El correo electrónico es obligatorio.";
  }
  if (/\s/.test(value)) {
    return "El correo no puede contener espacios en blanco.";
  }
  if (!v.includes("@")) {
    return "El correo debe incluir un '@'.";
  }
  const parts = v.split("@");
  if (parts.length > 2 || !parts[0]) {
    return "Ingresa tu usuario antes de @gmail.com.";
  }
  if (parts[1] !== "gmail.com") {
    return "Solo se aceptan correos de Gmail (@gmail.com).";
  }
  const gmailRegex = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(v)) {
    return "Ingresa un formato de correo válido (ej. usuario@gmail.com).";
  }
  return null;
}

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;

export function getNameValidationError(
  value: string,
  field: "nombre" | "apellido" = "nombre",
  minLength: number = 3
): string | null {
  const v = (value || "").trim();
  const label = field === "nombre" ? "El nombre" : "El apellido";

  if (!v) {
    return `${label} es obligatorio.`;
  }
  if (/\d/.test(v)) {
    return `${label} no puede contener números.`;
  }
  if (/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/.test(v)) {
    return `${label} no puede contener símbolos ni caracteres especiales.`;
  }
  if (/^[-']/.test(v) || /[-']$/.test(v)) {
    return `${label} no puede iniciar ni terminar con guión o apóstrofe.`;
  }
  if (v.length < minLength) {
    return `${label} debe tener al menos ${minLength} letras.`;
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(v)) {
    return `${label} debe contener letras válidas.`;
  }
  return null;
}

export function isValidHumanName(value: string, minLength: number = 3): boolean {
  return getNameValidationError(value, "nombre", minLength) === null;
}

export function formatPhoneNumber(value: string): string {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function getPhoneValidationError(value: string): string | null {
  const v = (value || "").trim();
  if (!v) {
    return "El teléfono es obligatorio.";
  }
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 8) {
    return "El número de teléfono debe tener exactamente 8 dígitos.";
  }
  return null;
}

export function isValidPhoneNumber(value: string): boolean {
  return getPhoneValidationError(value) === null;
}

export function calculateAge(isoDate: string): number | null {
  if (!isoDate) return null;
  const parts = isoDate.split('-');
  if (parts.length !== 3) return null;
  const birth = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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
    correo: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    ciudad: "",
    fecha_nacimiento: "",
    genero: "",
    foto_perfil: null,
  });

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  // Validaciones Paso 1: Credenciales
  const email = String(formData?.correo || "");
  const password = String(formData?.password || "");
  const confirmPassword = String(formData?.confirmPassword || "");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const canContinueAuth = useMemo(() => {
    if (!isValidEmail(email)) return false;
    if (!password || !confirmPassword) return false;
    if (password !== confirmPassword) return false;
    if (strength.score < 3) return false;
    return true;
  }, [email, password, confirmPassword, strength.score]);

  const helperText = useMemo(() => {
    if (!email && !password && !confirmPassword) return "";
    if (!password || !confirmPassword) return "Completa contraseña y confirmación.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    if (strength.score < 3) return "Haz tu contraseña al menos “Aceptable” (agrega números, mayúsculas o símbolos).";
    return "";
  }, [email, password, confirmPassword, strength.score]);

  // Selección de Foto de perfil
  const pickImage = async (onSelected?: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showNiceAlert("warning", "Permiso denegado", "Se necesita acceso a la galería para cambiar la foto.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      setFormData((prev) => ({ ...prev, foto_perfil: uri }));
      onSelected?.(uri);
    } catch (e) {
      console.error("Error picking image:", e);
      showNiceAlert("danger", "Error", "No se pudo seleccionar la imagen.");
    }
  };

  // Validaciones Paso 2: Datos de Usuario
  const validateProfileData = (data: RegisterFormData): { valid: boolean; message?: string } => {
    const nombreError = getNameValidationError(data.nombre, "nombre", 3);
    if (nombreError) {
      return { valid: false, message: nombreError };
    }
    const apellidoError = getNameValidationError(data.apellidos, "apellido", 3);
    if (apellidoError) {
      return { valid: false, message: apellidoError };
    }
    const phoneError = getPhoneValidationError(data.telefono);
    if (phoneError) {
      return { valid: false, message: phoneError };
    }
    if (!data.ciudad.trim()) {
      return { valid: false, message: "Debes seleccionar tu ubicación (departamento y municipio)." };
    }
    if (!data.fecha_nacimiento.trim()) {
      return { valid: false, message: "La fecha de nacimiento es obligatoria." };
    }
    const age = calculateAge(data.fecha_nacimiento);
    if (age === null || age < 18) {
      return { valid: false, message: "Debes tener al menos 18 años para registrarte." };
    }
    const gen = data.genero.trim().toLowerCase();
    if (!gen || (gen !== "hombre" && gen !== "mujer")) {
      return { valid: false, message: "Por favor seleccionar su genero" };
    }
    return { valid: true };
  };

  // Función auxiliar de timeout para evitar que la UI quede congelada
  const withTimeout = <T>(promise: Promise<T>, ms = 15000, errorMsg = "El servidor de Supabase tardó demasiado en responder (timeout). Revisa tu conexión o si el proyecto en Supabase está en pausa."): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
  };

  // Creación de Cuenta (Auth + Storage + Tabla Usuarios)
  const handleCreateAccount = async (currentData: RegisterFormData, onSuccess: () => void) => {
    const profileValidation = validateProfileData(currentData);
    if (!profileValidation.valid) {
      showNiceAlert("danger", "Campos incompletos", profileValidation.message || "Completa todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = String(currentData.correo || "").trim().toLowerCase();

      // 1. Supabase Auth signUp con timeout y metadata completa
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: cleanEmail,
          password: currentData.password,
          options: {
            data: {
              name: currentData.nombre.trim(),
              nombre: currentData.nombre.trim(),
              last_name: currentData.apellidos.trim(),
              apellidos: currentData.apellidos.trim(),
              birth_date: currentData.fecha_nacimiento,
              fecha_nacimiento: currentData.fecha_nacimiento,
              gender: currentData.genero.toLowerCase(),
              genero: currentData.genero.toLowerCase(),
              telefono: currentData.telefono.trim(),
              ciudad: currentData.ciudad.trim(),
            }
          }
        }),
        15000,
        "La conexión con el servidor de autenticación tardó demasiado. Si el proyecto de Supabase está pausado, actívalo en Supabase."
      );

      if (error) {
        if (error.message.includes("already registered")) {
          showNiceAlert("danger", "Correo ya registrado", "Este correo ya está asociado a una cuenta existente.");
        } else {
          showNiceAlert("danger", "Error al crear cuenta", error.message);
        }
        return;
      }

      if (data.user) {
        let publicPhotoUrl: string | null = null;

        // 2. Subir foto de perfil si seleccionó una
        if (currentData.foto_perfil) {
          try {
            setUploadingPhoto(true);
            const fileUri = currentData.foto_perfil;
            const fileExt = fileUri.split('.').pop()?.split('?')[0] ?? 'jpg';
            const fileName = `${data.user.id}/avatar.${fileExt}`;

            const response = await fetch(fileUri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: uploadError } = await withTimeout(
              supabase.storage
                .from('avatars')
                .upload(fileName, arrayBuffer, {
                  contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
                  upsert: true,
                }),
              10000,
              "Tiempo agotado al subir la foto de perfil."
            );

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              publicPhotoUrl = urlData.publicUrl + '?t=' + Date.now();
            } else {
              console.warn("Could not upload avatar during register:", uploadError);
            }
          } catch (uploadEx) {
            console.warn("Avatar upload exception:", uploadEx);
          } finally {
            setUploadingPhoto(false);
          }
        }

        // 3. Guardar datos en la tabla 'usuarios'
        try {
          const { error: upsertError } = (await withTimeout(
            Promise.resolve(
              supabase.from('usuarios').upsert({
                id: data.user.id,
                correo: cleanEmail,
                nombre: currentData.nombre.trim(),
                apellidos: currentData.apellidos.trim(),
                telefono: currentData.telefono.trim(),
                ciudad: currentData.ciudad.trim(),
                foto_perfil: publicPhotoUrl,
                fecha_nacimiento: currentData.fecha_nacimiento,
                genero: currentData.genero.toLowerCase(),
                onboarding_completado: false,
              })
            ),
            10000,
            "Tiempo agotado al guardar perfil en la base de datos."
          )) as any;

          if (upsertError) {
            console.error("Error upserting user data:", upsertError);
          }
        } catch (upsertEx: any) {
          console.warn("Upsert usuario error o timeout:", upsertEx);
        }

        onSuccess();
      }
    } catch (err: any) {
      console.error("handleCreateAccount error:", err);
      const msg = err?.message || "No se pudo crear la cuenta. Inténtalo de nuevo.";
      showNiceAlert("danger", "Aviso del servidor", msg);
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    uploadingPhoto,
    alertBox,
    alertAnim,
    showNiceAlert,
    closeAlertNow,
    strength,
    canContinueAuth,
    helperText,
    pickImage,
    validateProfileData,
    handleCreateAccount,
  };
}
