import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../../services/supabase';

export type JobStatus = 'all' | 'completed' | 'accepted' | 'pending' | 'rejected' | 'cancelled';

export interface JobItem {
  id: string;
  chat_id: string;
  cliente_id: string;
  perfil_profesional_id: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  perfiles_profesionales?: {
    id: string;
    profesion: string;
    categoria: string;
  } | null;
  usuarios?: {
    id: string;
    nombre: string;
    apellidos: string;
    foto_perfil?: string | null;
    telefono?: string | null;
    ciudad?: string | null;
  } | null;
}

export function useJobHistoryController() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{ id: string; profesion: string }>>([]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setJobs([]);
        return;
      }

      // 1. Get professional profiles of this user
      const { data: userProfiles, error: profileErr } = await supabase
        .from('perfiles_profesionales')
        .select('id, profesion')
        .eq('usuario_id', user.id);

      if (profileErr) throw profileErr;

      const profileList = userProfiles || [];
      setServices(profileList);

      if (profileList.length === 0) {
        setJobs([]);
        return;
      }

      const profileIds = profileList.map((p) => p.id);

      // 2. Fetch jobs associated with these professional profiles
      const { data: jobsData, error: jobsErr } = await supabase
        .from('trabajos')
        .select(`
          id,
          chat_id,
          cliente_id,
          perfil_profesional_id,
          estado,
          fecha_creacion,
          fecha_actualizacion,
          perfiles_profesionales:perfil_profesional_id(id, profesion, categoria),
          usuarios:cliente_id(id, nombre, apellidos, foto_perfil, telefono, ciudad)
        `)
        .in('perfil_profesional_id', profileIds)
        .order('fecha_creacion', { ascending: false });

      if (jobsErr) throw jobsErr;

      setJobs((jobsData as unknown as JobItem[]) || []);
    } catch (e) {
      console.error('Error fetching jobs history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJobStatus = async (jobId: string, nuevoEstado: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('trabajos')
        .update({
          estado: nuevoEstado,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      const msg = `El trabajo ha sido marcado como ${
        nuevoEstado === 'completed'
          ? 'completado'
          : nuevoEstado === 'accepted'
          ? 'aceptado'
          : nuevoEstado
      }.`;

      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Éxito', msg);
      }

      await fetchJobs();
    } catch (e) {
      console.error('Error updating job status:', e);
      const err = 'No se pudo actualizar el estado del trabajo.';
      if (Platform.OS === 'web') window.alert(err);
      else Alert.alert('Error', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'cancelled') {
        if (job.estado !== 'cancelled' && job.estado !== 'rejected') return false;
      } else if (job.estado !== selectedStatus) {
        return false;
      }
    }
    if (selectedServiceId && job.perfil_profesional_id !== selectedServiceId) {
      return false;
    }
    return true;
  });

  // Metrics
  const totalCompleted = jobs.filter((j) => j.estado === 'completed').length;
  const totalInProgress = jobs.filter((j) => j.estado === 'accepted').length;
  const totalPending = jobs.filter((j) => j.estado === 'pending').length;

  return {
    loading,
    jobs: filteredJobs,
    allJobs: jobs,
    services,
    selectedStatus,
    setSelectedStatus,
    selectedServiceId,
    setSelectedServiceId,
    totalCompleted,
    totalInProgress,
    totalPending,
    fetchJobs,
    updateJobStatus,
  };
}
