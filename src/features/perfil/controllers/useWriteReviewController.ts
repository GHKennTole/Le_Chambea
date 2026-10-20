import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';

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
  const [assignedJobId, setAssignedJobId] = useState<string | undefined>(jobId);

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
          if (rev.trabajo_id) setAssignedJobId(rev.trabajo_id);
        }
      } else if (jobId) {
        // Cargar reseña asociada a esta contratación específica
        const { data: rev, error } = await supabase
          .from('resenas')
          .select('*')
          .eq('trabajo_id', jobId)
          .eq('cliente_id', user.id)
          .maybeSingle();

        if (!error && rev) {
          setRating(rev.calificacion || 0);
          setComment(rev.comentario || '');
          setExistingReviewId(rev.id);
          setIsEditing(true);
          setProProfileId(rev.perfil_profesional_id);
          setProId(rev.profesional_id);
          if (rev.trabajo_id) setAssignedJobId(rev.trabajo_id);
        }
      } else if (professionalProfileId) {
        const { data: rev, error } = await supabase
          .from('resenas')
          .select('*')
          .eq('cliente_id', user.id)
          .eq('perfil_profesional_id', professionalProfileId)
          .is('trabajo_id', null)
          .maybeSingle();

        if (!error && rev) {
          setRating(rev.calificacion || 0);
          setComment(rev.comentario || '');
          setExistingReviewId(rev.id);
          setIsEditing(true);
          setProProfileId(rev.perfil_profesional_id);
          setProId(rev.profesional_id);
          if (rev.trabajo_id) setAssignedJobId(rev.trabajo_id);
        }
      }
    } catch (e) {
      console.error('Error loading review:', e);
    } finally {
      setFetching(false);
    }
  }, [reviewId, jobId, professionalProfileId]);

  useEffect(() => {
    loadExistingReview();
  }, [loadExistingReview]);

  const submitReview = async (onSuccess: () => void) => {
    if (rating === 0) {
      showAlert('Faltan estrellas', 'Por favor selecciona una calificación de 1 a 5 estrellas.', undefined, 'warning');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showAlert('Error', 'Debes estar autenticado para dejar una reseña.', undefined, 'danger');
        return;
      }

      const broadcastReviewChange = async (targetJobId?: string) => {
        if (!targetJobId) return;
        try {
          const { data: jobRow } = await supabase
            .from('trabajos')
            .select('chat_id')
            .eq('id', targetJobId)
            .maybeSingle();

          if (jobRow?.chat_id) {
            const ch = supabase.channel(`chat-room:${jobRow.chat_id}`);
            await ch.send({
              type: 'broadcast',
              event: 'job_updated',
              payload: { jobId: targetJobId, action: 'review_created' },
            });
            supabase.removeChannel(ch);
          }
        } catch {
          // Quietly handle non-critical broadcast failure
        }
      };

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

        await broadcastReviewChange(jobId || assignedJobId);
        showAlert('Éxito', '¡Reseña actualizada correctamente!', undefined, 'success');
        onSuccess();
      } else {
        // Create new review
        let finalProId = proId;
        const targetProfileId = proProfileId || professionalProfileId;

        if (!targetProfileId) {
          showAlert('Error', 'No se especificó el servicio profesional.', undefined, 'danger');
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

        const targetJobId = jobId || assignedJobId;

        // Verificar si ya existe una reseña para esta contratación específica
        if (targetJobId) {
          const { data: existing } = await supabase
            .from('resenas')
            .select('id, trabajo_id')
            .eq('trabajo_id', targetJobId)
            .eq('cliente_id', user.id)
            .maybeSingle();

          if (existing) {
            // Actualizar la reseña existente de esta contratación
            const { error } = await supabase
              .from('resenas')
              .update({
                calificacion: rating,
                comentario: comment,
                fecha_creacion: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (error) throw error;
            await broadcastReviewChange(targetJobId);
            showAlert('Éxito', '¡Reseña actualizada correctamente!', undefined, 'success');
            onSuccess();
            return;
          }
        } else {
          // Solo si no hay trabajo asociado, verificar si hay reseña directa previa sin trabajo
          const { data: existing } = await supabase
            .from('resenas')
            .select('id, trabajo_id')
            .eq('cliente_id', user.id)
            .eq('perfil_profesional_id', targetProfileId)
            .is('trabajo_id', null)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from('resenas')
              .update({
                calificacion: rating,
                comentario: comment,
                fecha_creacion: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (error) throw error;
            await broadcastReviewChange(undefined);
            showAlert('Éxito', '¡Reseña actualizada correctamente!', undefined, 'success');
            onSuccess();
            return;
          }
        }

        const { error } = await supabase.from('resenas').insert({
          perfil_profesional_id: targetProfileId,
          profesional_id: finalProId,
          cliente_id: user.id,
          trabajo_id: targetJobId || null,
          calificacion: rating,
          comentario: comment
        });

        if (error) throw error;

        await broadcastReviewChange(targetJobId);
        showAlert('Éxito', '¡Gracias por tu reseña!', undefined, 'success');
        onSuccess();
      }
    } catch (e: any) {
      console.error('Error submitting review:', e);
      showAlert('Error', 'No se pudo guardar la reseña.', undefined, 'danger');
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
