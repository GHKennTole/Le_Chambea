import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import type { Review, ProfessionalProfile } from '../../perfil/models/profile.types';

export function useReviewsController(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<ProfessionalProfile[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) targetUserId = user.id;
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
        setReviews(reviewsData || []);
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
    reviews: filteredReviews,
    allReviews: reviews,
    services,
    selectedServiceId,
    setSelectedServiceId,
    generalAverage,
    filteredAverage,
    refetch: fetchData
  };
}
