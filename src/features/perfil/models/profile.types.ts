export interface UserProfile {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  ciudad: string;
  foto_perfil: string | null;
  fecha_nacimiento: string;
  genero: string;
  total_trabajos_completados?: number;
  mostrar_telefono?: boolean;
  mostrar_correo?: boolean;
  perfil_publico?: boolean;
}

export interface ProfessionalProfile {
  id: string;
  usuario_id: string;
  indice_servicio: number;
  categoria: string;
  profesion: string;
  descripcion: string;
  rango_precio: string;
  zona: string;
  esta_activo: boolean;
  portafolio?: string[];
}

export interface Review {
  id: string;
  perfil_profesional_id: string;
  profesional_id?: string;
  cliente_id: string;
  trabajo_id?: string;
  calificacion: number;
  comentario: string;
  fecha_creacion: string;
  respuesta_profesional?: string | null;
  fecha_respuesta?: string | null;
  usuarios?: {
    nombre: string;
    apellidos: string;
    foto_perfil: string;
  };
}

export interface Job {
  id: string;
  chat_id: string;
  cliente_id: string;
  perfil_profesional_id: string;
  estado: 'pending' | 'accepted' | 'rejected' | 'completed';
  fecha_creacion: string;
  fecha_actualizacion: string;
  perfiles_profesionales?: {
    profesion: string;
    categoria: string;
  };
}
