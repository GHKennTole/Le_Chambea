import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';

export function useFavoriteToggle(profesionalId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const checkFavorite = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favoritos')
        .select('id')
        .eq('cliente_id', user.id)
        .eq('profesional_id', profesionalId)
        .maybeSingle();

      if (!error) {
        setIsFavorite(!!data);
      }
    } catch (e) {
      console.error('Error checking favorite:', e);
    } finally {
      setLoading(false);
    }
  }, [profesionalId]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  const toggleFavorite = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('cliente_id', user.id)
          .eq('profesional_id', profesionalId);

        if (error) throw error;
        setIsFavorite(false);
        setToastMessage('Quitado de favoritos');
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favoritos')
          .insert({
            cliente_id: user.id,
            profesional_id: profesionalId,
          });

        if (error) throw error;
        setIsFavorite(true);
        setToastMessage('¡Añadido a favoritos!');
      }

      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [isFavorite, profesionalId]);

  return {
    isFavorite,
    loading,
    toastMessage,
    toggleFavorite,
  };
}
