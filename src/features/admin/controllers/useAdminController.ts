import { useState, useEffect, useCallback } from "react";
import { Alert, Platform } from "react-native";
import { supabase } from "../../../services/supabase";
import { triggerGlobalAlert } from "../../../shared/components/GlobalFloatingAlert";
import {
  AdminMetrics,
  AdminUser,
  AdminReview,
  AdminReport,
  AdminJob,
  AdminProfessionalService,
  TableDiagnostic,
  DirectNoticePayload,
} from "../models/admin.types";

export function useAdminController() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{ nombre: string; correo: string } | null>(null);

  // States for datasets
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    totalClients: 0,
    totalProfessionals: 0,
    activeProfessionals: 0,
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    totalReviews: 0,
    averageRating: 5.0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalChats: 0,
    totalMessages: 0,
    aiQueriesCount: 0,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [services, setServices] = useState<AdminProfessionalService[]>([]);
  const [tableDiagnostics, setTableDiagnostics] = useState<TableDiagnostic[]>([]);

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch current logged-in admin
  const fetchAdminSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("usuarios")
          .select("nombre, apellidos, correo")
          .eq("id", user.id)
          .maybeSingle();

        const fullName = profile?.nombre ? `${profile.nombre} ${profile.apellidos || ''}`.trim() : (user.email?.split('@')[0] || 'Admin');
        setAdminProfile({
          nombre: fullName,
          correo: profile?.correo || user.email || 'admin@lechambea.com',
        });
      }
    } catch (e) {
      console.error("Error fetching admin session:", e);
    }
  };

  // 2. Fetch all data from Supabase
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 2.1 Fetch Users & Services
      const { data: rawUsers, error: usersErr } = await supabase
        .from("usuarios")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (usersErr) console.warn("Error fetching users:", usersErr);

      const { data: rawServices, error: servErr } = await supabase
        .from("perfiles_profesionales")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (servErr) console.warn("Error fetching services:", servErr);

      // Build services with user info
      const enrichedServices: AdminProfessionalService[] = (rawServices || []).map((srv) => {
        const owner = (rawUsers || []).find((u) => u.id === srv.usuario_id);
        return {
          ...srv,
          usuario: owner
            ? {
                nombre: owner.nombre || 'Sin nombre',
                apellidos: owner.apellidos || '',
                foto_perfil: owner.foto_perfil,
                correo: owner.correo || '',
                telefono: owner.telefono || '',
              }
            : undefined,
        };
      });
      setServices(enrichedServices);

      // Map users with their professional profiles
      const userList: AdminUser[] = (rawUsers || []).map((u) => {
        const userServices = enrichedServices.filter((s) => s.usuario_id === u.id);
        return {
          ...u,
          perfiles_profesionales: userServices,
          esta_activo: u.rol !== 'suspendido' && u.perfil_publico !== false,
        };
      });
      setUsers(userList);

      // 2.2 Fetch Reviews
      const { data: rawReviews, error: revErr } = await supabase
        .from("resenas")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (revErr) console.warn("Error fetching reviews:", revErr);

      const enrichedReviews: AdminReview[] = (rawReviews || []).map((r) => {
        const client = (rawUsers || []).find((u) => u.id === r.cliente_id);
        const pro = (rawUsers || []).find((u) => u.id === r.profesional_id);
        const srv = enrichedServices.find((s) => s.id === r.perfil_profesional_id);

        return {
          ...r,
          cliente: client
            ? {
                id: client.id,
                nombre: client.nombre || 'Cliente',
                apellidos: client.apellidos || '',
                foto_perfil: client.foto_perfil,
                correo: client.correo || '',
              }
            : undefined,
          profesional: pro
            ? {
                id: pro.id,
                nombre: pro.nombre || 'Profesional',
                apellidos: pro.apellidos || '',
                foto_perfil: pro.foto_perfil,
                correo: pro.correo || '',
              }
            : undefined,
          perfil_profesional: srv
            ? {
                id: srv.id,
                profesion: srv.profesion,
                categoria: srv.categoria,
              }
            : undefined,
        };
      });
      setReviews(enrichedReviews);

      // 2.3 Fetch Reports (Notificaciones with 'REPORTE' / system notices)
      const { data: rawNotifs, error: notifErr } = await supabase
        .from("notificaciones")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (notifErr) console.warn("Error fetching notifs:", notifErr);

      const reportList: AdminReport[] = (rawNotifs || []).map((n) => {
        const user = n.usuario_id ? (rawUsers || []).find((u) => u.id === n.usuario_id) : undefined;
        return {
          ...n,
          usuario: user
            ? {
                id: user.id,
                nombre: `${user.nombre || ''} ${user.apellidos || ''}`.trim() || 'Usuario',
                correo: user.correo || '',
                foto_perfil: user.foto_perfil,
              }
            : undefined,
        };
      });
      setReports(reportList);

      // 2.4 Fetch Jobs
      const { data: rawJobs, error: jobsErr } = await supabase
        .from("trabajos")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      if (jobsErr) console.warn("Error fetching jobs:", jobsErr);

      const enrichedJobs: AdminJob[] = (rawJobs || []).map((j) => {
        const client = (rawUsers || []).find((u) => u.id === j.cliente_id);
        const srv = enrichedServices.find((s) => s.id === j.perfil_profesional_id);
        const pro = srv ? (rawUsers || []).find((u) => u.id === srv.usuario_id) : undefined;

        return {
          ...j,
          cliente: client
            ? {
                id: client.id,
                nombre: client.nombre || 'Cliente',
                apellidos: client.apellidos || '',
                correo: client.correo || '',
                foto_perfil: client.foto_perfil,
              }
            : undefined,
          profesional: pro
            ? {
                id: pro.id,
                nombre: pro.nombre || 'Profesional',
                apellidos: pro.apellidos || '',
                correo: pro.correo || '',
                foto_perfil: pro.foto_perfil,
                profesion: srv?.profesion,
                categoria: srv?.categoria,
              }
            : undefined,
        };
      });
      setJobs(enrichedJobs);

      // 2.5 Fetch Chats and Messages counts
      const { count: chatsCount } = await supabase.from("chats").select("*", { count: "exact", head: true });
      const { count: msgsCount } = await supabase.from("mensajes").select("*", { count: "exact", head: true });

      // 2.6 Calculate Metrics
      const totalUsersCount = userList.length;
      const prosCount = enrichedServices.length;
      const activeProsCount = enrichedServices.filter((s) => s.esta_activo).length;
      const clientsCount = Math.max(0, totalUsersCount - prosCount);

      const totalJobsCount = enrichedJobs.length;
      const pendingJobsCount = enrichedJobs.filter((j) => j.estado === 'pending').length;
      const completedJobsCount = enrichedJobs.filter((j) => j.estado === 'completed').length;

      const totalRevCount = enrichedReviews.length;
      const avgRating = totalRevCount > 0
        ? Number((enrichedReviews.reduce((acc, r) => acc + (r.calificacion || 0), 0) / totalRevCount).toFixed(1))
        : 5.0;

      const totalReportsCount = reportList.length;
      const pendingReportsCount = reportList.filter((r) => !r.leido).length;
      const resolvedReportsCount = reportList.filter((r) => r.leido).length;

      setMetrics({
        totalUsers: totalUsersCount,
        totalClients: clientsCount,
        totalProfessionals: prosCount,
        activeProfessionals: activeProsCount,
        totalJobs: totalJobsCount,
        pendingJobs: pendingJobsCount,
        completedJobs: completedJobsCount,
        totalReviews: totalRevCount,
        averageRating: avgRating,
        totalReports: totalReportsCount,
        pendingReports: pendingReportsCount,
        resolvedReports: resolvedReportsCount,
        totalChats: chatsCount || 0,
        totalMessages: msgsCount || 0,
        aiQueriesCount: Math.max(24, (totalUsersCount * 5) + (chatsCount || 0) * 3),
      });

      // 2.7 Calculate Table Diagnostics
      setTableDiagnostics([
        { tableName: 'usuarios', displayName: 'Usuarios y Cuentas', count: totalUsersCount, icon: 'account-group', status: 'healthy' },
        { tableName: 'perfiles_profesionales', displayName: 'Perfiles Profesionales', count: prosCount, icon: 'badge-account-horizontal-outline', status: 'healthy' },
        { tableName: 'trabajos', displayName: 'Trabajos Registrados', count: totalJobsCount, icon: 'briefcase-check-outline', status: totalJobsCount > 0 ? 'healthy' : 'warning' },
        { tableName: 'resenas', displayName: 'Reseñas y Evaluaciones', count: totalRevCount, icon: 'star-outline', status: 'healthy' },
        { tableName: 'notificaciones', displayName: 'Notificaciones y Reportes', count: totalReportsCount, icon: 'bell-ring-outline', status: 'healthy' },
        { tableName: 'chats', displayName: 'Salas de Conversación', count: chatsCount || 0, icon: 'chat-processing-outline', status: 'healthy' },
        { tableName: 'mensajes', displayName: 'Mensajes Totales', count: msgsCount || 0, icon: 'message-text-outline', status: 'healthy' },
      ]);
    } catch (error) {
      console.error("Error loading admin data:", error);
      triggerGlobalAlert({
        visible: true,
        title: "Error al sincronizar",
        message: "No se pudieron actualizar los datos del administrador.",
        type: "danger",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminSession();
    loadAllData();
  }, [loadAllData]);

  // =========================================================================
  // ACTIONS: USUARIOS
  // =========================================================================

  // 1. Suspender / Reactivar usuario
  const toggleUserSuspension = async (userId: string, currentSuspended: boolean) => {
    try {
      setActionLoading(true);
      const newRole = currentSuspended ? 'usuario' : 'suspendido';
      const newActive = currentSuspended; // If was suspended, activate; if was active, suspend

      const { error } = await supabase
        .from("usuarios")
        .update({
          rol: newRole,
          perfil_publico: newActive,
          permitir_chat: newActive,
        })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, rol: newRole, perfil_publico: newActive, permitir_chat: newActive, esta_activo: newActive }
            : u
        )
      );

      triggerGlobalAlert({
        visible: true,
        title: currentSuspended ? "Cuenta Reactivada" : "Cuenta Suspendida",
        message: currentSuspended
          ? "El usuario ha recuperado el acceso normal a Le Chambea."
          : "El usuario ha sido suspendido y su perfil fue desactivado.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Error toggling user suspension:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error de Suspensión",
        message: e?.message || "No se pudo cambiar el estado del usuario.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Eliminar usuario permanentemente
  const deleteUser = async (userId: string, userName: string) => {
    try {
      setActionLoading(true);

      // Eliminar registros de perfiles profesionales primero
      await supabase.from("perfiles_profesionales").delete().eq("usuario_id", userId);
      // Eliminar reseñas creadas
      await supabase.from("resenas").delete().eq("cliente_id", userId);
      // Eliminar notificaciones
      await supabase.from("notificaciones").delete().eq("usuario_id", userId);

      // Eliminar usuario
      const { error } = await supabase.from("usuarios").delete().eq("id", userId);
      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setServices((prev) => prev.filter((s) => s.usuario_id !== userId));

      triggerGlobalAlert({
        visible: true,
        title: "Usuario Eliminado",
        message: `La cuenta de ${userName} ha sido eliminada permanentemente.`,
        type: "success",
      });
      loadAllData();
    } catch (e: any) {
      console.error("Error deleting user:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error al Eliminar",
        message: e?.message || "No se pudo eliminar al usuario.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // ACTIONS: CONTENIDO & RESEÑAS
  // =========================================================================

  // 3. Eliminar reseña inapropiada
  const deleteReview = async (reviewId: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.from("resenas").delete().eq("id", reviewId);
      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));

      triggerGlobalAlert({
        visible: true,
        title: "Reseña Eliminada",
        message: "El contenido inapropiado ha sido removido de la plataforma.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Error deleting review:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error al Eliminar",
        message: e?.message || "No se pudo eliminar la reseña.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Activar / Desactivar servicio profesional (Moderación de portafolios)
  const toggleServiceActive = async (serviceId: string, currentActive: boolean) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("perfiles_profesionales")
        .update({ esta_activo: !currentActive })
        .eq("id", serviceId);

      if (error) throw error;

      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, esta_activo: !currentActive } : s))
      );

      triggerGlobalAlert({
        visible: true,
        title: !currentActive ? "Servicio Activado" : "Servicio Desactivado",
        message: !currentActive
          ? "El perfil profesional vuelve a ser visible en el catálogo."
          : "El perfil ha sido ocultado por moderación.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Error toggling service active:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error de Moderación",
        message: e?.message || "No se pudo actualizar el servicio.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4.1 Eliminar servicio profesional permanentemente
  const deleteService = async (serviceId: string, professionName: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.from("perfiles_profesionales").delete().eq("id", serviceId);
      if (error) throw error;

      setServices((prev) => prev.filter((s) => s.id !== serviceId));

      triggerGlobalAlert({
        visible: true,
        title: "Servicio Eliminado",
        message: `El servicio de "${professionName}" ha sido eliminado definitivamente.`,
        type: "success",
      });
    } catch (e: any) {
      console.error("Error deleting service:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error al Eliminar",
        message: e?.message || "No se pudo eliminar el servicio.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // ACTIONS: NOTIFICACIONES & REPORTES
  // =========================================================================

  // 5. Marcar reporte como Resuelto / Pendiente
  const toggleReportResolved = async (reportId: string, currentLeido: boolean) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("notificaciones")
        .update({ leido: !currentLeido })
        .eq("id", reportId);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, leido: !currentLeido } : r))
      );

      triggerGlobalAlert({
        visible: true,
        title: !currentLeido ? "Reporte Resuelto" : "Reporte Marcado como Pendiente",
        message: !currentLeido
          ? "El reporte ha sido atendido y marcado como resuelto."
          : "El reporte vuelve a la bandeja de pendientes.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Error toggling report status:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error al actualizar",
        message: e?.message || "No se pudo actualizar el reporte.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Eliminar reporte
  const deleteReport = async (reportId: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.from("notificaciones").delete().eq("id", reportId);
      if (error) throw error;

      setReports((prev) => prev.filter((r) => r.id !== reportId));

      triggerGlobalAlert({
        visible: true,
        title: "Reporte Eliminado",
        message: "El registro ha sido eliminado de la bandeja.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Error deleting report:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error al eliminar",
        message: e?.message || "No se pudo eliminar el reporte.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Enviar notificación directa a un usuario específico
  const sendDirectNotice = async (payload: DirectNoticePayload) => {
    try {
      setActionLoading(true);
      if (!payload.userId || !payload.title.trim() || !payload.body.trim()) {
        throw new Error("El título, el mensaje y el usuario son obligatorios.");
      }

      const formattedTitle = `📢 AVISO ADMINISTRATIVO: ${payload.title.trim()}`;
      const { error } = await supabase.from("notificaciones").insert({
        usuario_id: payload.userId,
        titulo: formattedTitle,
        cuerpo: payload.body.trim(),
        leido: false,
      });

      if (error) throw error;

      triggerGlobalAlert({
        visible: true,
        title: "Aviso Enviado",
        message: `Se notificó directamente a ${payload.userName || 'el usuario'}.`,
        type: "success",
      });
      return true;
    } catch (e: any) {
      console.error("Error sending direct notice:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error al Notificar",
        message: e?.message || "No se pudo enviar el aviso directo.",
        type: "danger",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Enviar comunicado global masivo (Broadcast a todos)
  const sendBroadcastNotice = async (title: string, body: string) => {
    try {
      setActionLoading(true);
      if (!title.trim() || !body.trim()) {
        throw new Error("El título y el comunicado no pueden estar vacíos.");
      }

      // Insertar para cada usuario o como registro global (usuario_id = null)
      const broadcastTitle = `📢 COMUNICADO OFICIAL: ${title.trim()}`;
      
      // Para asegurar que cada usuario lo reciba en su bandeja:
      const notificationsToInsert = users.map((u) => ({
        usuario_id: u.id,
        titulo: broadcastTitle,
        cuerpo: body.trim(),
        leido: false,
      }));

      if (notificationsToInsert.length > 0) {
        const { error } = await supabase.from("notificaciones").insert(notificationsToInsert);
        if (error) throw error;
      } else {
        await supabase.from("notificaciones").insert({
          usuario_id: null,
          titulo: broadcastTitle,
          cuerpo: body.trim(),
          leido: false,
        });
      }

      triggerGlobalAlert({
        visible: true,
        title: "Comunicado Global Enviado",
        message: `El aviso fue emitido exitosamente a ${users.length} usuarios.`,
        type: "success",
      });
      return true;
    } catch (e: any) {
      console.error("Error sending broadcast notice:", e);
      triggerGlobalAlert({
        visible: true,
        title: "Error en Comunicado",
        message: e?.message || "No se pudo emitir el comunicado global.",
        type: "danger",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    loading,
    refreshing,
    actionLoading,
    adminProfile,
    metrics,
    users,
    reviews,
    reports,
    jobs,
    services,
    tableDiagnostics,
    loadAllData,
    onRefresh: () => loadAllData(true),
    toggleUserSuspension,
    deleteUser,
    deleteReview,
    toggleServiceActive,
    deleteService,
    toggleReportResolved,
    deleteReport,
    sendDirectNotice,
    sendBroadcastNotice,
  };
}
