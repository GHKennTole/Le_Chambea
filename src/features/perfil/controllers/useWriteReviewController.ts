import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function useWriteReviewController(
  professionalProfileId?: string,
  jobId?: string,
  reviewId?: string,
  professionalId?: string
) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [existingReviewId, setExistingReviewId] = useState<string | null>(reviewId || null);
  const [isEditing, setIsEditing] = useState(false);
  const [proProfileId, setProProfileId] = useState<string | undefined>(professionalProfileId);
  const [proId, setProId] = useState<string | undefined>(professionalId);

  const loadExistingReview = useCallback(async () => {
    try {
      setFetching(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (reviewId) {
        const { data: rev, error } = await supabase
          .from('resenas')
          .select('*')
          .eq('id', reviewId)
          .maybeSingle();

        if (!error && rev) {
          setRating(rev.calificacion || 0);
          setComment(rev.comentario || '');
          setExistingReviewId(rev.id);
          setIsEditing(true);
          setProProfileId(rev.perfil_profesional_id);
          setProId(rev.profesional_id);
        }
      } else if (professionalProfileId) {
        const { data: rev, error } = await supabase
          .from('resenas')
          .select('*')
          .eq('cliente_id', user.id)
          .eq('perfil_profesional_id', professionalProfileId)
          .maybeSingle();

        if (!error && rev) {
          setRating(rev.calificacion || 0);
          setComment(rev.comentario || '');
          setExistingReviewId(rev.id);
          setIsEditing(true);
          setProProfileId(rev.perfil_profesional_id);
          setProId(rev.profesional_id);
        }
      }
    } catch (e) {
      console.error('Error loading review:', e);
    } finally {
      setFetching(false);
    }
  }, [reviewId, professionalProfileId]);

  useEffect(() => {
    loadExistingReview();
  }, [loadExistingReview]);

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

      if (existingReviewId || isEditing) {
        // Update existing review
        const { error } = await supabase
          .from('resenas')
          .update({
            calificacion: rating,
            comentario: comment,
            fecha_creacion: new Date().toISOString()
          })
          .eq('id', existingReviewId);

        if (error) throw error;

        Alert.alert('Éxito', '¡Reseña actualizada correctamente!');
        onSuccess();
      } else {
        // Create new review
        let finalProId = proId;
        const targetProfileId = proProfileId || professionalProfileId;

        if (!targetProfileId) {
          Alert.alert('Error', 'No se especificó el servicio profesional.');
          return;
        }

        if (!finalProId) {
          const { data: profile } = await supabase
            .from('perfiles_profesionales')
            .select('usuario_id')
            .eq('id', targetProfileId)
            .maybeSingle();

          if (profile) {
            finalProId = profile.usuario_id;
          }
        }

        // Double check existing to prevent race condition duplicates
        const { data: existing } = await supabase
          .from('resenas')
          .select('id')
          .eq('cliente_id', user.id)
          .eq('perfil_profesional_id', targetProfileId)
          .maybeSingle();

        if (existing) {
          // Update instead
          const { error } = await supabase
            .from('resenas')
            .update({
              calificacion: rating,
              comentario: comment,
              fecha_creacion: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) throw error;
          Alert.alert('Éxito', '¡Reseña actualizada correctamente!');
          onSuccess();
          return;
        }

        const { error } = await supabase.from('resenas').insert({
          perfil_profesional_id: targetProfileId,
          profesional_id: finalProId,
          cliente_id: user.id,
          trabajo_id: jobId || null,
          calificacion: rating,
          comentario: comment
        });

        if (error) throw error;

        Alert.alert('Éxito', '¡Gracias por tu reseña!');
        onSuccess();
      }
    } catch (e: any) {
      console.error('Error submitting review:', e);
      Alert.alert('Error', 'No se pudo guardar la reseña.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetching,
    rating,
    setRating,
    comment,
    setComment,
    isEditing,
    submitReview
  };
}
