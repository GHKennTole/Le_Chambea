import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function usePrivacyController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [perfilPublico, setPerfilPublico] = useState(true);
  const [permitirChat, setPermitirChat] = useState(true);
  const [mostrarTrabajos, setMostrarTrabajos] = useState(true);
  const [mostrarResenas, setMostrarResenas] = useState(true);
  const [permitirFavoritos, setPermitirFavoritos] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('usuarios')
        .select('perfil_publico, permitir_chat, mostrar_trabajos, mostrar_resenas, permitir_favoritos')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setPerfilPublico(data.perfil_publico ?? true);
        setPermitirChat(data.permitir_chat ?? true);
        setMostrarTrabajos(data.mostrar_trabajos ?? true);
        setMostrarResenas(data.mostrar_resenas ?? true);
        setPermitirFavoritos((data as any).permitir_favoritos ?? true);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const savePrivacyKey = async (key: string, value: boolean) => {
    if (!userId) return;
    try {
      setSaving(true);

      const { error } = await supabase
        .from('usuarios')
        .update({ [key]: value })
        .eq('id', userId);

      if (error) {
        console.error(`Privacy update error for ${key}:`, error);
      }

      if (key === 'perfil_publico') setPerfilPublico(value);
      if (key === 'permitir_chat') setPermitirChat(value);
      if (key === 'mostrar_trabajos') setMostrarTrabajos(value);
      if (key === 'mostrar_resenas') setMostrarResenas(value);
      if (key === 'permitir_favoritos') setPermitirFavoritos(value);

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron actualizar tus ajustes de privacidad.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    perfilPublico,
    permitirChat,
    mostrarTrabajos,
    mostrarResenas,
    permitirFavoritos,
    togglePerfilPublico: (val: boolean) => savePrivacyKey('perfil_publico', val),
    togglePermitirChat: (val: boolean) => savePrivacyKey('permitir_chat', val),
    toggleMostrarTrabajos: (val: boolean) => savePrivacyKey('mostrar_trabajos', val),
    toggleMostrarResenas: (val: boolean) => savePrivacyKey('mostrar_resenas', val),
    togglePermitirFavoritos: (val: boolean) => savePrivacyKey('permitir_favoritos', val),
  };
}
