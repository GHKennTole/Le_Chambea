import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';

export type HomeProCard = {
  id: string; // professional_profile id
  usuario_id: string; // user id
  nombre: string;
  profesion: string;
  categoria: string;
  foto: string;
  calificacion: number;
};

export function useHomeController() {
  const [loading, setLoading] = useState(true);
  const [masSolicitados, setMasSolicitados] = useState<HomeProCard[]>([]);
  const [novedades, setNovedades] = useState<HomeProCard[]>([]);
  
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Estado para el usuario actual
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener ID del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch professional profiles with user data
      const { data: profilesData, error: profilesError } = await supabase
        .from('perfiles_profesionales')
        .select(`
          id, 
          usuario_id,
          profesion, 
          categoria,
          fecha_creacion,
          usuarios:usuario_id(nombre, apellidos, foto_perfil)
        `)
        .eq('esta_activo', true)
        .order('fecha_creacion', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setMasSolicitados([]);
        setNovedades([]);
        return;
      }

      // Fetch reviews to calculate ratings
      const { data: reviewsData } = await supabase
        .from('resenas')
        .select('perfil_profesional_id, calificacion');

      // Map data
      const mappedProfiles: HomeProCard[] = profilesData.map((p: any) => {
        const profileReviews = reviewsData?.filter((r: any) => r.perfil_profesional_id === p.id) || [];
        const sum = profileReviews.reduce((acc: number, curr: any) => acc + curr.calificacion, 0);
        const avgRating = profileReviews.length > 0 ? sum / profileReviews.length : 0;

        return {
          id: p.id,
          usuario_id: p.usuario_id,
          nombre: `${p.usuarios?.nombre || 'Usuario'} ${p.usuarios?.apellidos || ''}`.trim(),
          profesion: p.profesion || p.categoria,
          categoria: p.categoria || '',
          foto: p.usuarios?.foto_perfil || 'https://via.placeholder.com/150',
          calificacion: avgRating
        };
      });

      // Split into lists (for now, we'll just sort differently)
      // Novedades = newest
      const nuevas = [...mappedProfiles].sort((a, b) => {
        const dateA = new Date(profilesData.find(p => p.id === a.id)?.fecha_creacion || 0).getTime();
        const dateB = new Date(profilesData.find(p => p.id === b.id)?.fecha_creacion || 0).getTime();
        return dateB - dateA;
      });

      // Más solicitados = highest rated or most reviews (we'll just sort by rating)
      const top = [...mappedProfiles].sort((a, b) => b.calificacion - a.calificacion);

      setNovedades(nuevas.slice(0, 10));
      setMasSolicitados(top.slice(0, 10));

    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Aplicar filtros locales
  const applyFilters = (data: HomeProCard[]) => {
    let filtered = data;

    // Excluir al propio usuario
    if (currentUserId) {
      filtered = filtered.filter(p => p.usuario_id !== currentUserId);
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(p => 
        p.categoria.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filtrar por búsqueda (nombre o profesión)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(q) || 
        p.profesion.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  return {
    loading,
    masSolicitados: applyFilters(masSolicitados),
    novedades: applyFilters(novedades),
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    refetch: fetchHomeData
  };
}
