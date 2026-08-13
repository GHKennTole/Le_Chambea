import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [todosLosPerfiles, setTodosLosPerfiles] = useState<HomeProCard[]>([]);
  
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Estado para el usuario actual
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener ID del usuario actual y perfiles en paralelo
      const [{ data: { user } }, { data: profilesData, error: profilesError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
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
          .order('fecha_creacion', { ascending: false })
          .limit(50)
      ]);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setCurrentUserId(user?.id ?? null);
        setMasSolicitados([]);
        setNovedades([]);
        setTodosLosPerfiles([]);
        return;
      }

      // Fetch reviews to calculate ratings — filtered by fetched profile IDs
      const profileIds = profilesData.map((p: any) => p.id);
      const { data: reviewsData } = await supabase
        .from('resenas')
        .select('perfil_profesional_id, calificacion')
        .in('perfil_profesional_id', profileIds);

      // Pre-build a Map for O(1) rating lookups instead of O(n²) filtering
      const reviewsByProfile = new Map<string, number[]>();
      (reviewsData || []).forEach((r: any) => {
        const arr = reviewsByProfile.get(r.perfil_profesional_id) || [];
        arr.push(r.calificacion);
        reviewsByProfile.set(r.perfil_profesional_id, arr);
      });

      // Map data
      const mappedProfiles: HomeProCard[] = profilesData.map((p: any) => {
        const profileReviews = reviewsByProfile.get(p.id) || [];
        const sum = profileReviews.reduce((acc: number, curr: number) => acc + curr, 0);
        const avgRating = profileReviews.length > 0 ? sum / profileReviews.length : 0;

        return {
          id: p.id,
          usuario_id: p.usuario_id,
          nombre: `${p.usuarios?.nombre || 'Usuario'} ${p.usuarios?.apellidos || ''}`.trim(),
          profesion: p.profesion || p.categoria,
          categoria: p.categoria || '',
          foto: p.usuarios?.foto_perfil || '',
          calificacion: avgRating
        };
      });

      // Split into lists (for now, we'll just sort differently)
      // Novedades = newest — mappedProfiles already preserves the query's fecha_creacion desc order
      const nuevas = mappedProfiles;

      // Más solicitados = highest rated or most reviews (we'll just sort by rating)
      const top = [...mappedProfiles].sort((a, b) => b.calificacion - a.calificacion);

      // Batch state updates together to minimize re-renders
      setCurrentUserId(user?.id ?? null);
      setTodosLosPerfiles(mappedProfiles);
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
  const applyFilters = useCallback((data: HomeProCard[]) => {
    let filtered = data;

    // Excluir al propio usuario
    if (currentUserId) {
      filtered = filtered.filter(p => p.usuario_id !== currentUserId);
    }

    // Filtrar por categoría
    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase();
      if (catLower === 'salud') {
        const healthKeywords = ['salud', 'enfermer', 'doctor', 'médic', 'medic', 'dentista', 'pediatra', 'nutricio', 'terapeuta', 'paramédic', 'paramedic'];
        filtered = filtered.filter(p => 
          healthKeywords.some(kw => 
            p.categoria.toLowerCase().includes(kw) || 
            p.profesion.toLowerCase().includes(kw)
          )
        );
      } else if (catLower === 'niñera' || catLower === 'cuidado' || catLower === 'cuidado infantil') {
        const childcareKeywords = ['niñer', 'babysitter', 'nana', 'cuidador', 'infantil', 'tutor', 'guarder', 'nanny', 'bebé', 'bebe'];
        filtered = filtered.filter(p => 
          childcareKeywords.some(kw => 
            p.categoria.toLowerCase().includes(kw) || 
            p.profesion.toLowerCase().includes(kw)
          )
        );
      } else {
        filtered = filtered.filter(p => 
          p.categoria.toLowerCase() === catLower ||
          p.profesion.toLowerCase().includes(catLower)
        );
      }
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
  }, [currentUserId, selectedCategory, searchQuery]);

  const filteredMasSolicitados = useMemo(() => applyFilters(masSolicitados), [masSolicitados, applyFilters]);
  const filteredNovedades = useMemo(() => applyFilters(novedades), [novedades, applyFilters]);
  const searchResults = useMemo(() => applyFilters(todosLosPerfiles), [todosLosPerfiles, applyFilters]);

  const isSearching = searchQuery.trim() !== '' || selectedCategory !== null;

  return {
    loading,
    masSolicitados: filteredMasSolicitados,
    novedades: filteredNovedades,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    refetch: fetchHomeData
  };
}
