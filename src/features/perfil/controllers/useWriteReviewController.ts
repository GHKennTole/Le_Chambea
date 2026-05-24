import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function useWriteReviewController(professionalProfileId: string, jobId: string) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitReview = async (onSuccess: () => void) => {
    if (rating === 0) {
      Alert.alert('Faltan estrellas', 'Por favor selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Debes estar autenticado para dejar una reseña.');
        return;
      }

      // Check if job is already reviewed
      const { data: existing } = await supabase
        .from('resenas')
        .select('id')
        .eq('trabajo_id', jobId)
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        Alert.alert('Aviso', 'Ya has dejado una reseña para este trabajo.');
        onSuccess();
        return;
      }

      // Find the professional_id linked to the professional_profile_id just in case
      const { data: profile } = await supabase
        .from('perfiles_profesionales')
        .select('usuario_id')
        .eq('id', professionalProfileId)
        .limit(1)
        .maybeSingle();

      if (!profile) {
        Alert.alert('Error', 'No se encontró el servicio profesional.');
        return;
      }

      const { error } = await supabase.from('resenas').insert({
        perfil_profesional_id: professionalProfileId,
        profesional_id: profile.usuario_id,
        cliente_id: user.id,
        trabajo_id: jobId,
        calificacion: rating,
        comentario: comment
      });

      if (error) throw error;

      Alert.alert('Éxito', '¡Gracias por tu reseña!');
      onSuccess();
    } catch (e: any) {
      console.error('Error submitting review:', e);
      Alert.alert('Error', 'No se pudo enviar la reseña.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    rating,
    setRating,
    comment,
    setComment,
    submitReview
  };
}
