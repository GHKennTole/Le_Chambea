import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';
import type { ProfessionalProfile } from '../../perfil/models/profile.types';
import { CATEGORIES } from '../../../shared/constants/categories';

const MAX_SERVICES = 3;

export function useProfessionalProfileController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [uploadingPortafolio, setUploadingPortafolio] = useState(false);
  const [services, setServices] = useState<ProfessionalProfile[]>([]);
  const [initialServices, setInitialServices] = useState<ProfessionalProfile[]>([]);
  const [userLocation, setUserLocation] = useState('');
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const hasLoadedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('usuarios')
        .select('ciudad')
        .eq('id', user.id)
        .maybeSingle();

      const userCity = userData?.ciudad || '';
      setUserLocation(userCity);

      const { data, error } = await supabase
        .from('perfiles_profesionales')
        .select('*')
        .eq('usuario_id', user.id)
        .order('indice_servicio', { ascending: true });

      if (error) {
        console.error('Error fetching pro profile:', error);
        return;
      }

      let parsedData: ProfessionalProfile[] = [];

      if (data && data.length > 0) {
        parsedData = data.map(item => ({
          ...item,
          zona: item.zona || userCity,
          portafolio: Array.isArray(item.portafolio) ? item.portafolio : [],
        }));
      } else {
        // Init first service
        parsedData = [{
          id: '',
          usuario_id: user.id,
          indice_servicio: 0,
          categoria: '',
          profesion: '',
          descripcion: '',
          rango_precio: '',
          zona: userCity,
          esta_activo: true,
          portafolio: [],
        }];
      }

      setServices(parsedData);
      setInitialServices(JSON.parse(JSON.stringify(parsedData)));
      setActiveServiceIndex(0);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const activeService = services[activeServiceIndex] || null;

  const hasChanges = useMemo(() => {
    if (!activeService) return false;
    if (!activeService.id) return true; // Brand new service
    const initial = initialServices[activeServiceIndex];
    if (!initial) return true;

    return (
      (activeService.categoria || '') !== (initial.categoria || '') ||
      (activeService.profesion || '') !== (initial.profesion || '') ||
      (activeService.descripcion || '') !== (initial.descripcion || '') ||
      (activeService.rango_precio || '') !== (initial.rango_precio || '') ||
      (activeService.zona || '') !== (initial.zona || '') ||
      JSON.stringify(activeService.portafolio || []) !== JSON.stringify(initial.portafolio || [])
    );
  }, [activeService, initialServices, activeServiceIndex]);

  const updateField = (field: keyof ProfessionalProfile, value: any) => {
    setServices(prev => {
      const newServices = [...prev];
      if (newServices[activeServiceIndex]) {
        newServices[activeServiceIndex] = { ...newServices[activeServiceIndex], [field]: value };
      }
      return newServices;
    });
  };

  const addPortfolioImage = async () => {
    try {
      if (!activeService) return;
      const currentList = activeService.portafolio || [];
      const remainingSlots = 10 - currentList.length;
      if (remainingSlots <= 0) {
        showAlert("Límite alcanzado", "Puedes subir hasta un máximo de 10 fotos a tu portafolio.", undefined, "warning");
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permiso denegado', 'Se necesita acceso a la galería para agregar fotos.', undefined, 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setUploadingPortafolio(true);
      const newUrls: string[] = [];

      for (const asset of result.assets) {
        const fileExt = asset.uri.split('.').pop() ?? 'jpg';
        const fileName = `${activeService.usuario_id}/portafolio_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            contentType: asset.mimeType ?? 'image/jpeg',
            cacheControl: '3600000',
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          newUrls.push(urlData.publicUrl + '?t=' + Date.now());
        }
      }

      if (newUrls.length > 0) {
        updateField('portafolio', [...currentList, ...newUrls]);
      } else {
        showAlert('Error', 'No se pudieron subir las imágenes seleccionadas.', undefined, 'danger');
      }
    } catch (e) {
      console.error('Portfolio image error:', e);
      showAlert('Error', 'Ocurrió un error al seleccionar las imágenes.', undefined, 'danger');
    } finally {
      setUploadingPortafolio(false);
    }
  };

  const removePortfolioImage = (urlToRemove: string) => {
    if (!activeService) return;
    const currentList = activeService.portafolio || [];
    const updatedList = currentList.filter(url => url !== urlToRemove);
    updateField('portafolio', updatedList);
  };

  const saveProfile = async () => {
    if (!activeService) return;
    const effectiveZona = userLocation || activeService.zona || '';
    
    if (
      !activeService.categoria?.trim() ||
      !activeService.profesion?.trim() ||
      !activeService.descripcion?.trim() ||
      !activeService.rango_precio?.trim() ||
      !effectiveZona?.trim()
    ) {
      showAlert(
        'Campos incompletos',
        'Por favor completa todos los campos para guardar tu servicio profesional.',
        undefined,
        'warning'
      );
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
            zona: effectiveZona,
            esta_activo: activeService.esta_activo,
            portafolio: activeService.portafolio || [],
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          showAlert('Error', 'No se pudo crear el perfil profesional.', undefined, 'danger');
          return;
        }

        setServices(prev => {
          const newServices = [...prev];
          newServices[activeServiceIndex] = data;
          setInitialServices(JSON.parse(JSON.stringify(newServices)));
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
            zona: effectiveZona,
            esta_activo: activeService.esta_activo,
            portafolio: activeService.portafolio || [],
          })
          .eq('id', activeService.id);

        if (error) {
          console.error('Update error:', error);
          showAlert('Error', 'No se pudo actualizar el perfil profesional.', undefined, 'danger');
          return;
        }

        setInitialServices(JSON.parse(JSON.stringify(services)));
      }

      showAlert('Éxito', isNew ? 'Perfil profesional creado.' : 'Perfil profesional actualizado.', undefined, 'success');
    } catch (e) {
      console.error('Save error:', e);
      showAlert('Error', 'Ocurrió un error inesperado.', undefined, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!activeService || togglingActive) return;
    const nextVal = !activeService.esta_activo;

    // Optimistically update local state
    setServices(prev => {
      const copy = [...prev];
      if (copy[activeServiceIndex]) {
        copy[activeServiceIndex] = { ...copy[activeServiceIndex], esta_activo: nextVal };
      }
      return copy;
    });

    if (activeService.id) {
      try {
        setTogglingActive(true);
        const { error } = await supabase
          .from('perfiles_profesionales')
          .update({ esta_activo: nextVal })
          .eq('id', activeService.id);

        if (error) {
          console.error('Error toggling service status:', error);
          showAlert('Error', 'No se pudo cambiar el estado del servicio.', undefined, 'danger');
          // Revert local state
          setServices(prev => {
            const copy = [...prev];
            if (copy[activeServiceIndex]) {
              copy[activeServiceIndex] = { ...copy[activeServiceIndex], esta_activo: !nextVal };
            }
            return copy;
          });
          return;
        }

        // Keep initialServices synchronized so hasChanges won't be triggered
        setInitialServices(prev => {
          const copy = [...prev];
          if (copy[activeServiceIndex]) {
            copy[activeServiceIndex] = { ...copy[activeServiceIndex], esta_activo: nextVal };
          }
          return copy;
        });
      } catch (e) {
        console.error('Error toggling service status:', e);
        showAlert('Error', 'Ocurrió un error al cambiar el estado del servicio.', undefined, 'danger');
        setServices(prev => {
          const copy = [...prev];
          if (copy[activeServiceIndex]) {
            copy[activeServiceIndex] = { ...copy[activeServiceIndex], esta_activo: !nextVal };
          }
          return copy;
        });
      } finally {
        setTogglingActive(false);
      }
    }
  };

  const addService = async () => {
    if (services.length >= MAX_SERVICES) {
      showAlert('Límite alcanzado', 'No puedes tener más de 3 servicios profesionales.', undefined, 'warning');
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

  const removeService = async (indexToRemove: number): Promise<boolean> => {
    const serviceToRemove = services[indexToRemove];
    if (!serviceToRemove || deleting) return false;

    const isPersisted = !!serviceToRemove.id;

    try {
      setDeleting(true);

      if (isPersisted) {
        const { error } = await supabase
          .from('perfiles_profesionales')
          .delete()
          .eq('id', serviceToRemove.id);

        if (error) {
          console.error("Delete error:", error);
          showAlert("Error", "No se pudo eliminar el servicio.", undefined, "danger");
          return false;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || serviceToRemove.usuario_id || '';

      const emptyFallback: ProfessionalProfile = {
        id: '',
        usuario_id: userId,
        indice_servicio: 0,
        categoria: '',
        profesion: '',
        descripcion: '',
        rango_precio: '',
        zona: userLocation,
        esta_activo: true,
        portafolio: [],
      };

      setServices(prev => {
        const newArr = prev.filter((_, i) => i !== indexToRemove);
        if (newArr.length === 0) {
          return [emptyFallback];
        }
        return newArr;
      });

      setInitialServices(prev => {
        const newArr = prev.filter((_, i) => i !== indexToRemove);
        if (newArr.length === 0) {
          return [JSON.parse(JSON.stringify(emptyFallback))];
        }
        return newArr;
      });

      setActiveServiceIndex(0);

      if (isPersisted) {
        showAlert("Éxito", "El servicio ha sido eliminado correctamente.", undefined, "success");
      }
      return true;
    } catch (e) {
      console.error("Error removing service:", e);
      showAlert("Error", "Ocurrió un error inesperado al eliminar el servicio.", undefined, "danger");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    services,
    activeServiceIndex,
    setActiveServiceIndex,
    activeService,
    loading,
    saving,
    deleting,
    togglingActive,
    hasChanges,
    userLocation,
    uploadingPortafolio,
    categories: CATEGORIES,
    updateField,
    addPortfolioImage,
    removePortfolioImage,
    saveProfile,
    toggleActive,
    addService,
    removeService,
    refetch: fetchProfile,
  };
}
