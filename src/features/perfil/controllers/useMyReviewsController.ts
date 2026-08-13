import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../../services/supabase';

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

  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
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
    }
  }, []);

  const deleteReview = (reviewId: string) => {
    const confirmDelete = async () => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('resenas')
          .delete()
          .eq('id', reviewId);

        if (error) throw error;

        const successMsg = 'La reseña ha sido eliminada.';
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert('Éxito', successMsg);
        }
        await fetchMyReviews();
      } catch (e) {
        console.error('Error deleting review:', e);
        const errorMsg = 'No se pudo eliminar la reseña.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que deseas eliminar esta reseña?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Eliminar Reseña',
        '¿Seguro que deseas eliminar esta reseña?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  return {
    loading,
    reviews,
    fetchMyReviews,
    deleteReview
  };
}
