import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import type { UserProfile, ProfessionalProfile } from '../../perfil/models/profile.types';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

export type ServiceWithRating = ProfessionalProfile & {
  averageRating: number;
  totalReviews: number;
};

export function usePublicProfileController(professionalId: string, professionalProfileId?: string) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<ServiceWithRating[]>([]);
  const [generalAverage, setGeneralAverage] = useState(0);
  const navigation = useNavigation<any>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
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

      // 3. Fetch Ratings for these profiles
      if (profilesData && profilesData.length > 0) {
        const profileIds = profilesData.map(p => p.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('resenas')
          .select('perfil_profesional_id, calificacion')
          .in('perfil_profesional_id', profileIds);

        if (reviewsError) throw reviewsError;

        let totalSum = 0;
        let totalCount = 0;

        const servicesWithRatings = profilesData.map(profile => {
          const profileReviews = reviewsData?.filter(r => r.perfil_profesional_id === profile.id) || [];
          const count = profileReviews.length;
          const sum = profileReviews.reduce((acc, curr) => acc + curr.calificacion, 0);
          
          totalCount += count;
          totalSum += sum;

          return {
            ...profile,
            averageRating: count > 0 ? sum / count : 0,
            totalReviews: count
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
        Alert.alert('Error', 'Debes iniciar sesión para chatear.');
        return;
      }
      
      if (currentUser.id === professionalId) {
        Alert.alert('Aviso', 'No puedes iniciar un chat contigo mismo.');
        return;
      }

      // Check if chat already exists (yo como cliente, el otro como profesional)
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('cliente_id', currentUser.id)
        .eq('profesional_id', professionalId)
        .limit(1);

      if (chatError) throw chatError;

      let chatId = null;

      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id;
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            cliente_id: currentUser.id,
            profesional_id: professionalId
          })
          .select()
          .single();

        if (createError) throw createError;
        chatId = newChat.id;
      }

      // Automatically create a job request if one does not exist for this professionalProfileId
      let profileIdToUse = professionalProfileId;
      if (!profileIdToUse && services.length > 0) {
        profileIdToUse = services[0].id;
      }

      if (profileIdToUse) {
        const { data: existingJobs } = await supabase
          .from('trabajos')
          .select('*')
          .eq('chat_id', chatId)
          .in('estado', ['pending', 'accepted'])
          .order('fecha_creacion', { ascending: false })
          .limit(1);

        const hasActiveJob = existingJobs && existingJobs.length > 0;

        if (!hasActiveJob) {
          await supabase.from('trabajos').insert({
            chat_id: chatId,
            cliente_id: currentUser.id,
            perfil_profesional_id: profileIdToUse,
            estado: 'pending'
          });
        }

        // Send a notification to the professional
        const selectedSvc = services.find(s => s.id === profileIdToUse);
        const professionName = selectedSvc ? selectedSvc.profesion : 'tu servicio';
        
        const { data: clientProfile } = await supabase
          .from('usuarios')
          .select('nombre, apellidos')
          .eq('id', currentUser.id)
          .single();
        
        const clientFullName = clientProfile ? `${clientProfile.nombre} ${clientProfile.apellidos}`.trim() : 'Un cliente';

        await supabase.from('notificaciones').insert({
          usuario_id: professionalId,
          titulo: 'Nueva solicitud de chat 💬',
          cuerpo: `${clientFullName} quiere chatear contigo para el servicio de ${professionName}.`,
          leido: false
        });
      }

      // Navigate to chat
      navigation.navigate('Chat', { chatId, otherUserId: professionalId });
      
    } catch (error: any) {
      console.error('Error initiating chat:', error);
      Alert.alert('Error al iniciar chat', error.message || 'Ocurrió un error inesperado');
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
