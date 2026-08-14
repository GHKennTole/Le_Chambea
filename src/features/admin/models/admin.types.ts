import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface AdminMetrics {
  totalUsers: number;
  totalClients: number;
  totalProfessionals: number;
  activeProfessionals: number;
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalReviews: number;
  averageRating: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  totalChats: number;
  totalMessages: number;
  aiQueriesCount: number;
}

export interface AdminUser {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  ciudad: string;
  foto_perfil: string | null;
  rol: 'usuario' | 'profesional' | 'admin' | 'administrador' | 'suspendido' | string;
  onboarding_completado: boolean;
  fecha_creacion: string;
  total_trabajos_completados?: number;
  mostrar_telefono?: boolean;
  mostrar_correo?: boolean;
  perfil_publico?: boolean;
  permitir_chat?: boolean;
  esta_activo?: boolean;
  perfiles_profesionales?: AdminProfessionalService[];
}

export interface AdminProfessionalService {
  id: string;
  usuario_id: string;
  categoria: string;
  profesion: string;
  descripcion: string;
  rango_precio: string;
  zona: string;
  esta_activo: boolean;
  portafolio?: string[];
  fecha_creacion?: string;
  usuario?: {
    nombre: string;
    apellidos: string;
    foto_perfil: string | null;
    correo: string;
    telefono: string;
  };
}

export interface AdminReview {
  id: string;
  calificacion: number;
  comentario: string;
  respuesta_profesional: string | null;
  fecha_creacion: string;
  fecha_respuesta: string | null;
  perfil_profesional_id: string;
  profesional_id: string;
  cliente_id: string;
  trabajo_id?: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
    foto_perfil: string | null;
    correo: string;
  };
  profesional?: {
    id: string;
    nombre: string;
    apellidos: string;
    foto_perfil: string | null;
    correo: string;
  };
  perfil_profesional?: {
    id: string;
    profesion: string;
    categoria: string;
  };
}

export interface AdminReport {
  id: string;
  usuario_id: string | null;
  titulo: string;
  cuerpo: string;
  leido: boolean;
  fecha_creacion: string;
  usuario?: {
    id: string;
    nombre: string;
    apellidos: string;
    correo: string;
    foto_perfil: string | null;
  };
}

export interface AdminJob {
  id: string;
  chat_id: string;
  cliente_id: string;
  perfil_profesional_id: string;
  estado: 'pending' | 'accepted' | 'rejected' | 'completed' | string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
    correo: string;
    foto_perfil: string | null;
  };
  profesional?: {
    id: string;
    nombre: string;
    apellidos: string;
    correo: string;
    foto_perfil: string | null;
    profesion?: string;
    categoria?: string;
  };
}

export interface TableDiagnostic {
  tableName: string;
  displayName: string;
  count: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  status: 'healthy' | 'warning' | 'empty';
}

export interface DirectNoticePayload {
  userId: string;
  userName?: string;
  title: string;
  body: string;
  type: 'gratitude' | 'warning' | 'sanction' | 'general';
}

export interface AdminWorkflowModule {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
  badges: string[];
  subActions: {
    id: string;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    badgeCount?: number;
  }[];
}
