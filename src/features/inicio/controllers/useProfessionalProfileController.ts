import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';
import type { ProfessionalProfile } from '../../perfil/models/profile.types';

const CATEGORIES = [
  'Electricista', 'Carpintero', 'Mecánico', 'Mandadito',
  'Dentista', 'Plomero', 'Jardinería', 'Limpieza',
  'Enfermería', 'Soldador', 'Pintor', 'Albañil', 'Otro',
];

const MAX_SERVICES = 3;

export function useProfessionalProfileController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ProfessionalProfile[]>([]);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('perfiles_profesionales')
        .select('*')
        .eq('usuario_id', user.id)
        .order('indice_servicio', { ascending: true });

      if (error) {
        console.error('Error fetching pro profile:', error);
        return;
      }

      if (data && data.length > 0) {
        setServices(data);
      } else {
        // Init first service
        setServices([{
          id: '',
          usuario_id: user.id,
          indice_servicio: 0,
          categoria: '',
          profesion: '',
          descripcion: '',
          rango_precio: '',
          zona: '',
          esta_activo: true,
        }]);
      }
      setActiveServiceIndex(0);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const activeService = services[activeServiceIndex] || null;

  const updateField = (field: keyof ProfessionalProfile, value: string | boolean) => {
    setServices(prev => {
      const newServices = [...prev];
      if (newServices[activeServiceIndex]) {
        newServices[activeServiceIndex] = { ...newServices[activeServiceIndex], [field]: value };
      }
      return newServices;
    });
  };

  const saveProfile = async () => {
    if (!activeService) return;
    if (!activeService.categoria || !activeService.profesion) {
      Alert.alert('Campos requeridos', 'Selecciona una categoría y escribe tu profesión.');
      return;
    }

    try {
      setSaving(true);
      const isNew = !activeService.id;

      if (isNew) {
        const { data, error } = await supabase
          .from('perfiles_profesionales')
          .insert({
            usuario_id: activeService.usuario_id,
            indice_servicio: activeService.indice_servicio,
            categoria: activeService.categoria,
            profesion: activeService.profesion,
            descripcion: activeService.descripcion,
            rango_precio: activeService.rango_precio,
            zona: activeService.zona,
            esta_activo: activeService.esta_activo,
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          Alert.alert('Error', 'No se pudo crear el perfil profesional.');
          return;
        }

        setServices(prev => {
          const newServices = [...prev];
          newServices[activeServiceIndex] = data;
          return newServices;
        });

      } else {
        const { error } = await supabase
          .from('perfiles_profesionales')
          .update({
            categoria: activeService.categoria,
            profesion: activeService.profesion,
            descripcion: activeService.descripcion,
            rango_precio: activeService.rango_precio,
            zona: activeService.zona,
            esta_activo: activeService.esta_activo,
          })
          .eq('id', activeService.id);

        if (error) {
          console.error('Update error:', error);
          Alert.alert('Error', 'No se pudo actualizar el perfil profesional.');
          return;
        }
      }

      Alert.alert('Éxito', isNew ? 'Perfil profesional creado.' : 'Perfil profesional actualizado.');
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = () => {
    if (!activeService) return;
    updateField('esta_activo', !activeService.esta_activo);
  };

  const addService = async () => {
    if (services.length >= MAX_SERVICES) {
      Alert.alert('Límite', 'No puedes tener más de 3 servicios profesionales.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find first missing index (0, 1, 2)
    const existingIndices = services.map(s => s.indice_servicio);
    let nextIndex = 0;
    for (let i = 0; i < MAX_SERVICES; i++) {
      if (!existingIndices.includes(i)) {
        nextIndex = i;
        break;
      }
    }

    setServices(prev => [
      ...prev,
      {
        id: '',
        usuario_id: user.id,
        indice_servicio: nextIndex,
        categoria: '',
        profesion: '',
        descripcion: '',
        rango_precio: '',
        zona: '',
        esta_activo: true,
      }
    ]);
    setActiveServiceIndex(services.length);
  };

  const removeService = async (indexToRemove: number) => {
    const serviceToRemove = services[indexToRemove];
    if (!serviceToRemove) return;

    Alert.alert(
      "Eliminar servicio",
      "¿Estás seguro de que deseas eliminar este servicio? También se eliminarán las reseñas asociadas.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            if (serviceToRemove.id) {
              setSaving(true);
              const { error } = await supabase
                .from('perfiles_profesionales')
                .delete()
                .eq('id', serviceToRemove.id);
              
              setSaving(false);

              if (error) {
                console.error("Delete error:", error);
                Alert.alert("Error", "No se pudo eliminar el servicio.");
                return;
              }
            }

            setServices(prev => {
              const newArr = prev.filter((_, i) => i !== indexToRemove);
              if (newArr.length === 0 && activeService?.usuario_id) {
                 return [{
                   id: '',
                   usuario_id: activeService.usuario_id,
                   indice_servicio: 0,
                   categoria: '',
                   profesion: '',
                   descripcion: '',
                   rango_precio: '',
                   zona: '',
                   esta_activo: true,
                 }];
              }
              return newArr;
            });
            setActiveServiceIndex(0);
          }
        }
      ]
    );
  };

  return {
    services,
    activeServiceIndex,
    setActiveServiceIndex,
    activeService,
    loading,
    saving,
    categories: CATEGORIES,
    updateField,
    saveProfile,
    toggleActive,
    addService,
    removeService,
    refetch: fetchProfile,
  };
}
