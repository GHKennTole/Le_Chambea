-- ESQUEMA FANTASMA (AUTO-GENERADO)

CREATE TABLE perfiles_profesionales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid  ,
  categoria text NOT NULL ,
  profesion text NOT NULL ,
  descripcion text  ,
  rango_precio text  ,
  zona text  ,
  esta_activo boolean  DEFAULT true,
  fecha_creacion timestamp with time zone  DEFAULT now(),
  indice_servicio integer  DEFAULT 0
);

CREATE TABLE chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid  ,
  profesional_id uuid  ,
  fecha_creacion timestamp with time zone  DEFAULT now()
);

CREATE TABLE mensajes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid  ,
  remitente_id uuid  ,
  contenido text NOT NULL ,
  leido boolean DEFAULT false,
  fecha_creacion timestamp with time zone  DEFAULT now()
);

CREATE TABLE resenas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profesional_id uuid  ,
  cliente_id uuid  ,
  calificacion integer  ,
  comentario text  ,
  fecha_creacion timestamp with time zone  DEFAULT now(),
  perfil_profesional_id uuid  ,
  trabajo_id uuid  
);

CREATE TABLE favoritos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid  ,
  profesional_id uuid  ,
  fecha_creacion timestamp with time zone  DEFAULT now()
);

CREATE TABLE trabajos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid  ,
  cliente_id uuid  ,
  perfil_profesional_id uuid  ,
  estado text  DEFAULT 'pending'::text,
  fecha_creacion timestamp with time zone  DEFAULT now(),
  fecha_actualizacion timestamp with time zone  DEFAULT now()
);

CREATE TABLE usuarios (
  id uuid NOT NULL ,
  nombre text  ,
  apellidos text  ,
  fecha_nacimiento text  ,
  genero text  ,
  correo text  ,
  telefono text  ,
  ciudad text  ,
  foto_perfil text  ,
  onboarding_completado boolean  DEFAULT false,
  fecha_creacion timestamp with time zone  DEFAULT now(),
  total_trabajos_completados integer  DEFAULT 0,
  pin_seguridad text  ,
  pregunta_seguridad text  ,
  respuesta_seguridad text  ,
  mostrar_telefono boolean  DEFAULT true,
  mostrar_correo boolean  DEFAULT true,
  perfil_publico boolean  DEFAULT true,
  rol text  DEFAULT 'usuario'::text
);

CREATE TABLE notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  titulo text NOT NULL,
  cuerpo text,
  leido boolean DEFAULT false,
  fecha_creacion timestamp with time zone DEFAULT now()
);

-- POLICIES

-- Table: perfiles_profesionales | Policy: Professionals can manage own profile | Cmd: ALL
-- USING: (auth.uid() = usuario_id)

-- Table: perfiles_profesionales | Policy: Public read access for professional profiles | Cmd: SELECT
-- USING: true

-- Table: chats | Policy: Users can access their chats | Cmd: ALL
-- USING: ((auth.uid() = cliente_id) OR (auth.uid() = profesional_id))

-- Table: mensajes | Policy: Users can insert messages in their chats | Cmd: INSERT
-- WITH CHECK: ((auth.uid() = remitente_id) AND (EXISTS ( SELECT 1
   FROM chats c
  WHERE ((c.id = mensajes.chat_id) AND ((c.cliente_id = auth.uid()) OR (c.profesional_id = auth.uid()))))))

-- Table: mensajes | Policy: Users can read messages in their chats | Cmd: SELECT
-- USING: (EXISTS ( SELECT 1
   FROM chats c
  WHERE ((c.id = mensajes.chat_id) AND ((c.cliente_id = auth.uid()) OR (c.profesional_id = auth.uid())))))

-- Table: mensajes | Policy: Users can update messages in their chats | Cmd: UPDATE
-- USING: (EXISTS ( SELECT 1
   FROM chats c
  WHERE ((c.id = mensajes.chat_id) AND ((c.cliente_id = auth.uid()) OR (c.profesional_id = auth.uid())))))

-- Table: resenas | Policy: Clients can write reviews | Cmd: INSERT
-- WITH CHECK: (auth.uid() = cliente_id)

-- Table: resenas | Policy: Public read access for reviews | Cmd: SELECT
-- USING: true

-- Table: favoritos | Policy: Clients can manage their favorites | Cmd: ALL
-- USING: (auth.uid() = cliente_id)

-- Table: usuarios | Policy: Public read access for users | Cmd: SELECT
-- USING: true

-- Table: usuarios | Policy: Users can update own data | Cmd: UPDATE
-- USING: (auth.uid() = id)

-- Table: usuarios | Policy: Users can insert own data | Cmd: INSERT
-- WITH CHECK: (auth.uid() = id)

-- Table: usuarios | Policy: Users can read own data | Cmd: SELECT
-- USING: (auth.uid() = id)

-- Table: notificaciones | Policy: Users can manage own notifications | Cmd: ALL
-- USING: (auth.uid() = usuario_id)

-- Table: notificaciones | Policy: Anyone can insert notifications | Cmd: INSERT
-- WITH CHECK: true


