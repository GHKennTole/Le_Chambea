import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../../services/supabase';
import type { Review, ProfessionalProfile } from '../../perfil/models/profile.types';

export function useReviewsController(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<ProfessionalProfile[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      let targetUserId = userId;
      if (!targetUserId && user) {
        targetUserId = user.id;
      }

      if (!targetUserId) return;

      // Fetch profiles (services) for the user
      const { data: profilesData, error: profilesError } = await supabase
        .from('perfiles_profesionales')
        .select('*')
        .eq('usuario_id', targetUserId);

      if (profilesError) throw profilesError;

      const userProfiles = profilesData || [];
      setServices(userProfiles);

      if (userProfiles.length > 0) {
        // Fetch reviews matching any of these profiles
        const profileIds = userProfiles.map(p => p.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('resenas')
          .select('*, usuarios:cliente_id(nombre, apellidos, foto_perfil)')
          .in('perfil_profesional_id', profileIds)
          .order('fecha_creacion', { ascending: false });

        if (reviewsError) throw reviewsError;
        setReviews((reviewsData as Review[]) || []);
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveProfessionalReply = async (reviewId: string, replyText: string) => {
    if (!replyText.trim()) {
      Alert.alert('Respuesta vacía', 'Por favor escribe un mensaje de respuesta.');
      return false;
    }

    try {
      setSubmittingReply(true);
      const { error } = await supabase
        .from('resenas')
        .update({
          respuesta_profesional: replyText.trim(),
          fecha_respuesta: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      const msg = 'Tu respuesta ha sido guardada.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Éxito', msg);

      await fetchData();
      return true;
    } catch (e: any) {
      console.error('Error saving professional reply:', e);
      const err = 'No se pudo guardar la respuesta.';
      if (Platform.OS === 'web') window.alert(err);
      else Alert.alert('Error', err);
      return false;
    } finally {
      setSubmittingReply(false);
    }
  };

  // Derived calculations
  const filteredReviews = selectedServiceId 
    ? reviews.filter(r => r.perfil_profesional_id === selectedServiceId)
    : reviews;

  const calculateAverage = (revs: Review[]) => {
    if (revs.length === 0) return 0;
    const sum = revs.reduce((acc, curr) => acc + curr.calificacion, 0);
    return sum / revs.length;
  };

  const generalAverage = calculateAverage(reviews);
  const filteredAverage = calculateAverage(filteredReviews);

  return {
    loading,
    submittingReply,
    currentUserId,
    reviews: filteredReviews,
    allReviews: reviews,
    services,
    selectedServiceId,
    setSelectedServiceId,
    generalAverage,
    filteredAverage,
    saveProfessionalReply,
    refetch: fetchData
  };
}
