import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import type { UserProfile, ProfessionalProfile, Review } from '../../perfil/models/profile.types';
import { useNavigation } from '@react-navigation/native';
import { showAlert } from '../../../shared/utils/customAlert';

export type ServiceWithRating = ProfessionalProfile & {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
};

export function usePublicProfileController(professionalId: string, professionalProfileId?: string) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<ServiceWithRating[]>([]);
  const [generalAverage, setGeneralAverage] = useState(0);
  const navigation = useNavigation<any>();
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!professionalId || professionalId === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      
      // 1. Fetch User Info
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', professionalId)
        .single();
        
      if (userError) throw userError;
      setUser(userData);

      // 2. Fetch Professional Profiles (Services)
      const { data: profilesData, error: profilesError } = await supabase
        .from('perfiles_profesionales')
        .select('*')
        .eq('usuario_id', professionalId)
        .eq('esta_activo', true)
        .order('indice_servicio', { ascending: true });

      if (profilesError) throw profilesError;

      // 3. Fetch Ratings & Reviews for these profiles
      if (profilesData && profilesData.length > 0) {
        const profileIds = profilesData.map(p => p.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('resenas')
          .select('*, usuarios:cliente_id(nombre, apellidos, foto_perfil)')
          .in('perfil_profesional_id', profileIds)
          .order('fecha_creacion', { ascending: false });

        if (reviewsError) throw reviewsError;

        let totalSum = 0;
        let totalCount = 0;

        const servicesWithRatings = profilesData.map(profile => {
          const profileReviews = (reviewsData || []).filter(r => r.perfil_profesional_id === profile.id);
          const count = profileReviews.length;
          const sum = profileReviews.reduce((acc, curr) => acc + curr.calificacion, 0);
          
          totalCount += count;
          totalSum += sum;

          return {
            ...profile,
            averageRating: count > 0 ? sum / count : 0,
            totalReviews: count,
            reviews: profileReviews as Review[]
          };
        });

        // Filter services to show only the selected one if professionalProfileId is provided
        let finalServices = servicesWithRatings;
        if (professionalProfileId) {
          finalServices = servicesWithRatings.filter(svc => svc.id === professionalProfileId);
        }

        setServices(finalServices);
        setGeneralAverage(totalCount > 0 ? totalSum / totalCount : 0);
      } else {
        setServices([]);
        setGeneralAverage(0);
      }

    } catch (e) {
      console.error('Error fetching public profile:', e);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [professionalId, professionalProfileId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const initiateChat = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        showAlert('Error', 'Debes iniciar sesión para chatear.', undefined, 'danger');
        return;
      }
      
      if (currentUser.id === professionalId) {
        showAlert('Aviso', 'No puedes iniciar un chat contigo mismo.', undefined, 'warning');
        return;
      }

      // Check if chat already exists where currentUser is the client and professionalId is the professional
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select('id, cliente_id, profesional_id')
        .eq('cliente_id', currentUser.id)
        .eq('profesional_id', professionalId)
        .limit(1);

      if (chatError) throw chatError;

      let chatId = null;

      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id;
        // Si la conversación existía pero estaba oculta para el cliente, desocultarla
        await supabase
          .from('chats')
          .update({ oculto_cliente: false })
          .eq('id', chatId);
      } else {
        // Create new chat (currentUser = cliente, professionalId = profesional)
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            cliente_id: currentUser.id,
            profesional_id: professionalId,
            oculto_cliente: false,
            oculto_profesional: false
          })
          .select()
          .single();

        if (createError) throw createError;
        chatId = newChat.id;
      }

      // Navigate to chat
      navigation.navigate('Chat', { chatId, otherUserId: professionalId });
      
    } catch (error: any) {
      console.error('Error initiating chat:', error);
      showAlert('Error al iniciar chat', error.message || 'Ocurrió un error inesperado', undefined, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    user,
    services,
    generalAverage,
    initiateChat,
    refetch: fetchData
  };
}
