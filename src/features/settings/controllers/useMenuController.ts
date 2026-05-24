import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';
import type { UserProfile } from '../../perfil/models/profile.types';

export function useMenuController() {
  const [user, setUser] = useState<UserProfile>({
    id: '',
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    ciudad: '',
    foto_perfil: null,
    fecha_nacimiento: '',
    genero: '',
  });
  const [hasProProfile, setHasProProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser({
          id: authUser.id,
          nombre: userData.nombre ?? '',
          apellidos: userData.apellidos ?? '',
          correo: userData.correo ?? authUser.email ?? '',
          telefono: userData.telefono ?? '',
          ciudad: userData.ciudad ?? '',
          foto_perfil: userData.foto_perfil ?? null,
          fecha_nacimiento: userData.fecha_nacimiento ?? '',
          genero: userData.genero ?? '',
        });
      } else {
        setUser(prev => ({
          ...prev,
          id: authUser.id,
          correo: authUser.email ?? '',
        }));
      }

      const { data: proData } = await supabase
        .from('perfiles_profesionales')
        .select('id')
        .eq('usuario_id', authUser.id)
        .limit(1);

      setHasProProfile(proData && proData.length > 0);
    } catch (e) {
      console.error('Error loading menu data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      Alert.alert("Sesión cerrada", "Has cerrado sesión exitosamente");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  const goToPrivacy = (navigation: any) => {
    navigation.navigate("Privacy");
  };

  const goToSecurity = (navigation: any) => {
    navigation.navigate("Security");
  };

  const goToSupport = (navigation: any) => {
    navigation.navigate("Support");
  };

  const goToTerms = (navigation: any) => {
    navigation.navigate("Terms");
  };

  return {
    user,
    hasProProfile,
    loading,
    handleLogout,
    goToPrivacy,
    goToSecurity,
    goToSupport,
    goToTerms,
    refetch: fetchData,
  };
}
