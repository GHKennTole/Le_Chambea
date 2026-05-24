import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function usePrivacyController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [mostrarTelefono, setMostrarTelefono] = useState(true);
  const [mostrarCorreo, setMostrarCorreo] = useState(true);
  const [perfilPublico, setPerfilPublico] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('usuarios')
        .select('mostrar_telefono, mostrar_correo, perfil_publico')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setMostrarTelefono(data.mostrar_telefono ?? true);
        setMostrarCorreo(data.mostrar_correo ?? true);
        setPerfilPublico(data.perfil_publico ?? true);
      }
    } catch (error) {
      console.error('Error fetching privacy:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const savePrivacy = async (key: 'mostrar_telefono' | 'mostrar_correo' | 'perfil_publico', value: boolean) => {
    if (!userId) return;
    try {
      setSaving(true);
      
      const updateData = { [key]: value };

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      if (key === 'mostrar_telefono') setMostrarTelefono(value);
      if (key === 'mostrar_correo') setMostrarCorreo(value);
      if (key === 'perfil_publico') setPerfilPublico(value);

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron guardar tus preferencias de privacidad.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    mostrarTelefono,
    mostrarCorreo,
    perfilPublico,
    toggleMostrarTelefono: (val: boolean) => savePrivacy('mostrar_telefono', val),
    toggleMostrarCorreo: (val: boolean) => savePrivacy('mostrar_correo', val),
    togglePerfilPublico: (val: boolean) => savePrivacy('perfil_publico', val),
  };
}
