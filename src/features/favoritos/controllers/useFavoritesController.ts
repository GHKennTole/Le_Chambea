import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';

export type FavoriteItem = {
  favoritoId: string;        // favoritos table id
  profesionalId: string;     // the professional's user id
  nombre: string;
  apellidos: string;
  foto_perfil: string | null;
  profesiones: string[];     // all active professions
  calificacion: number;      // average rating across all services
  ciudad: string | null;
};

export function useFavoritesController() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all favorites for this user
      const { data: favoritosData, error: favError } = await supabase
        .from('favoritos')
        .select('id, profesional_id')
        .eq('cliente_id', user.id)
        .order('fecha_creacion', { ascending: false });

      if (favError) throw favError;
      if (!favoritosData || favoritosData.length === 0) {
        setFavorites([]);
        return;
      }

      const professionalIds = favoritosData.map((f: any) => f.profesional_id);

      // Fetch user data for all favorited professionals
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellidos, foto_perfil, ciudad')
        .in('id', professionalIds);

      if (usersError) throw usersError;

      // Fetch active professional profiles for these users
      const { data: profilesData } = await supabase
        .from('perfiles_profesionales')
        .select('id, usuario_id, profesion')
        .in('usuario_id', professionalIds)
        .eq('esta_activo', true);

      // Fetch ratings for these profiles
      const profileIds = (profilesData || []).map((p: any) => p.id);
      let reviewsByProfile = new Map<string, number[]>();

      if (profileIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('resenas')
          .select('perfil_profesional_id, calificacion')
          .in('perfil_profesional_id', profileIds);

        (reviewsData || []).forEach((r: any) => {
          const arr = reviewsByProfile.get(r.perfil_profesional_id) || [];
          arr.push(r.calificacion);
          reviewsByProfile.set(r.perfil_profesional_id, arr);
        });
      }

      // Build a map: usuario_id -> { profesiones, avgRating }
      const proDataByUser = new Map<string, { profesiones: string[], avgRating: number }>();
      (profilesData || []).forEach((p: any) => {
        const existing = proDataByUser.get(p.usuario_id) || { profesiones: [], ratings: [] as number[] };
        if (!existing.profesiones.includes(p.profesion)) {
          existing.profesiones.push(p.profesion);
        }
        const profileRatings = reviewsByProfile.get(p.id) || [];
        (existing as any).ratings = [...((existing as any).ratings || []), ...profileRatings];
        proDataByUser.set(p.usuario_id, existing as any);
      });

      // Build the final list
      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));

      const mappedFavorites: FavoriteItem[] = favoritosData
        .map((fav: any) => {
          const user = usersMap.get(fav.profesional_id) as any;
          if (!user) return null;

          const proData = proDataByUser.get(fav.profesional_id) as any;
          const ratings: number[] = proData?.ratings || [];
          const sum = ratings.reduce((a: number, b: number) => a + b, 0);
          const avg = ratings.length > 0 ? sum / ratings.length : 0;

          return {
            favoritoId: fav.id,
            profesionalId: fav.profesional_id,
            nombre: user.nombre || 'Usuario',
            apellidos: user.apellidos || '',
            foto_perfil: user.foto_perfil,
            profesiones: proData?.profesiones || [],
            calificacion: avg,
            ciudad: user.ciudad,
          };
        })
        .filter(Boolean) as FavoriteItem[];

      setFavorites(mappedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFavorite = useCallback(async (favoritoId: string) => {
    try {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('id', favoritoId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.favoritoId !== favoritoId));
      setToastMessage('⭐ Quitado de favoritos');

      setTimeout(() => setToastMessage(null), 2000);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    loading,
    favorites,
    toastMessage,
    removeFavorite,
    refetch: fetchFavorites,
  };
}
