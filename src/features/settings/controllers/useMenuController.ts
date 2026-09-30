import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';
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
  const [hasActiveService, setHasActiveService] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
        const role = userData.rol?.toLowerCase();
        setIsAdmin(role === 'admin' || role === 'administrador');
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
        .select('id, esta_activo')
        .eq('usuario_id', authUser.id);

      const hasProfile = !!(proData && proData.length > 0);
      const hasActive = !!(proData && proData.some(p => p.esta_activo === true));

      setHasProProfile(hasProfile);
      setHasActiveService(hasActive);
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
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      showAlert("Error", "No se pudo cerrar sesión", undefined, "danger");
    }
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
    hasActiveService,
    isAdmin,
    loading,
    handleLogout,
    goToSecurity,
    goToSupport,
    goToTerms,
    refetch: fetchData,
  };
}
