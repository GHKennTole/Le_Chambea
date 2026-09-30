import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';

export interface MyReviewItem {
  id: string;
  profesional_id: string;
  cliente_id: string;
  perfil_profesional_id: string;
  trabajo_id?: string;
  calificacion: number;
  comentario: string;
  fecha_creacion: string;
  respuesta_profesional?: string | null;
  fecha_respuesta?: string | null;
  perfiles_profesionales?: {
    id: string;
    profesion: string;
    categoria: string;
  } | null;
  usuarios?: {
    id: string;
    nombre: string;
    apellidos: string;
    foto_perfil: string;
  } | null;
}

export function useMyReviewsController() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<MyReviewItem[]>([]);
  const hasLoadedRef = useRef(false);

  const fetchMyReviews = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReviews([]);
        return;
      }

      const { data, error } = await supabase
        .from('resenas')
        .select(`
          *,
          perfiles_profesionales:perfil_profesional_id(id, profesion, categoria),
          usuarios:profesional_id(id, nombre, apellidos, foto_perfil)
        `)
        .eq('cliente_id', user.id)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setReviews((data as MyReviewItem[]) || []);
    } catch (e) {
      console.error('Error fetching my left reviews:', e);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, []);

  const deleteReview = async (reviewId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('resenas')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      showAlert('Éxito', 'La reseña ha sido eliminada.', undefined, 'success');
      await fetchMyReviews();
      return true;
    } catch (e) {
      console.error('Error deleting review:', e);
      showAlert('Error', 'No se pudo eliminar la reseña.', undefined, 'danger');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    reviews,
    fetchMyReviews,
    deleteReview
  };
}
