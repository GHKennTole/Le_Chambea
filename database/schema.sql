-- ==============================================================================
-- ESQUEMA COMPLETO Y MIGRACIÓN DEFINITIVA: LE CHAMBEA (SUPABASE)
-- ==============================================================================
-- Este script es seguro e idempotente: crea tablas si no existen, añade columnas
-- faltantes, configura claves foráneas, índices únicos, políticas de seguridad RLS,
-- triggers automáticos, bucket de almacenamiento y soporte Realtime.
-- ==============================================================================

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellidos TEXT,
  fecha_nacimiento TEXT,
  genero TEXT,
  correo TEXT,
  telefono TEXT,
  ciudad TEXT,
  foto_perfil TEXT,
  onboarding_completado BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  total_trabajos_completados INTEGER DEFAULT 0,
  mostrar_telefono BOOLEAN DEFAULT true,
  mostrar_correo BOOLEAN DEFAULT true,
  perfil_publico BOOLEAN DEFAULT true,
  permitir_chat BOOLEAN DEFAULT true,
  mostrar_trabajos BOOLEAN DEFAULT true,
  mostrar_resenas BOOLEAN DEFAULT true,
  permitir_favoritos BOOLEAN DEFAULT true,
  rol VARCHAR(20) DEFAULT 'usuario'
);

-- Asegurar columnas en usuarios por si la tabla ya existía previamente
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS total_trabajos_completados INTEGER DEFAULT 0;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS mostrar_telefono BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS mostrar_correo BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS perfil_publico BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS permitir_chat BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS mostrar_trabajos BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS mostrar_resenas BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS permitir_favoritos BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'usuario';

-- 2. TABLA: perfiles_profesionales
CREATE TABLE IF NOT EXISTS public.perfiles_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  profesion TEXT NOT NULL,
  descripcion TEXT,
  rango_precio TEXT,
  zona TEXT,
  esta_activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  indice_servicio INTEGER DEFAULT 0,
  portafolio TEXT[] DEFAULT '{}'::text[]
);

-- Asegurar columnas e índices en perfiles_profesionales
ALTER TABLE public.perfiles_profesionales ADD COLUMN IF NOT EXISTS indice_servicio INTEGER DEFAULT 0;
ALTER TABLE public.perfiles_profesionales ADD COLUMN IF NOT EXISTS portafolio TEXT[] DEFAULT '{}'::text[];

-- Eliminar restricción antigua de 1 solo perfil si existía, y asegurar índice único por servicio
ALTER TABLE public.perfiles_profesionales DROP CONSTRAINT IF EXISTS perfiles_profesionales_usuario_id_key;
ALTER TABLE public.perfiles_profesionales DROP CONSTRAINT IF EXISTS uq_user_service;
ALTER TABLE public.perfiles_profesionales DROP CONSTRAINT IF EXISTS uq_usuario_indice;
ALTER TABLE public.perfiles_profesionales ADD CONSTRAINT uq_usuario_indice UNIQUE (usuario_id, indice_servicio);

-- 3. TABLA: chats
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  profesional_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- Evitar duplicados de chat entre un mismo cliente y profesional
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS uq_chat_cliente_profesional;
ALTER TABLE public.chats ADD CONSTRAINT uq_chat_cliente_profesional UNIQUE (cliente_id, profesional_id);

-- 4. TABLA: mensajes
CREATE TABLE IF NOT EXISTS public.mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  remitente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS leido BOOLEAN DEFAULT false;

-- 5. TABLA: trabajos
CREATE TABLE IF NOT EXISTS public.trabajos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  perfil_profesional_id UUID REFERENCES public.perfiles_profesionales(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'pending',
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trabajos ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ DEFAULT now();

-- 6. TABLA: resenas
CREATE TABLE IF NOT EXISTS public.resenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_profesional_id UUID REFERENCES public.perfiles_profesionales(id) ON DELETE CASCADE,
  profesional_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL,
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  respuesta_profesional TEXT,
  fecha_respuesta TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resenas ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT;
ALTER TABLE public.resenas ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ;
ALTER TABLE public.resenas ADD COLUMN IF NOT EXISTS perfil_profesional_id UUID REFERENCES public.perfiles_profesionales(id) ON DELETE CASCADE;
ALTER TABLE public.resenas ADD COLUMN IF NOT EXISTS trabajo_id UUID REFERENCES public.trabajos(id) ON DELETE SET NULL;

-- 7. TABLA: favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  profesional_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.favoritos DROP CONSTRAINT IF EXISTS uq_favorito_cliente_profesional;
ALTER TABLE public.favoritos ADD CONSTRAINT uq_favorito_cliente_profesional UNIQUE (cliente_id, profesional_id);

-- 8. TABLA: notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  cuerpo TEXT,
  leido BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios
DROP POLICY IF EXISTS "Public read access for users" ON public.usuarios;
CREATE POLICY "Public read access for users" ON public.usuarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own data" ON public.usuarios;
CREATE POLICY "Users can insert own data" ON public.usuarios FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users and admins can update user data" ON public.usuarios;
CREATE POLICY "Users and admins can update user data" ON public.usuarios FOR UPDATE USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
);

DROP POLICY IF EXISTS "Users and admins can delete user data" ON public.usuarios;
CREATE POLICY "Users and admins can delete user data" ON public.usuarios FOR DELETE USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
);

-- Políticas: perfiles_profesionales
DROP POLICY IF EXISTS "Public read access for professional profiles" ON public.perfiles_profesionales;
CREATE POLICY "Public read access for professional profiles" ON public.perfiles_profesionales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professionals can manage own profile" ON public.perfiles_profesionales;
DROP POLICY IF EXISTS "Professionals and admins can update profiles" ON public.perfiles_profesionales;
CREATE POLICY "Professionals and admins can update profiles" ON public.perfiles_profesionales
  FOR UPDATE USING (
    auth.uid() = usuario_id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

DROP POLICY IF EXISTS "Professionals and admins can delete profiles" ON public.perfiles_profesionales;
CREATE POLICY "Professionals and admins can delete profiles" ON public.perfiles_profesionales
  FOR DELETE USING (
    auth.uid() = usuario_id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

DROP POLICY IF EXISTS "Professionals can insert own profile" ON public.perfiles_profesionales;
CREATE POLICY "Professionals can insert own profile" ON public.perfiles_profesionales
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas: chats
DROP POLICY IF EXISTS "Users can access their chats" ON public.chats;
CREATE POLICY "Users can access their chats" ON public.chats FOR ALL USING (auth.uid() = cliente_id OR auth.uid() = profesional_id);

-- Políticas: mensajes
DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.mensajes;
CREATE POLICY "Users can read messages in their chats" ON public.mensajes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.cliente_id = auth.uid() OR c.profesional_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.mensajes;
CREATE POLICY "Users can insert messages in their chats" ON public.mensajes FOR INSERT WITH CHECK (
  auth.uid() = remitente_id AND
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.cliente_id = auth.uid() OR c.profesional_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can update messages in their chats" ON public.mensajes;
CREATE POLICY "Users can update messages in their chats" ON public.mensajes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.cliente_id = auth.uid() OR c.profesional_id = auth.uid()))
);

-- Políticas: trabajos
DROP POLICY IF EXISTS "Users can view relevant jobs" ON public.trabajos;
DROP POLICY IF EXISTS "Users and admins can view relevant jobs" ON public.trabajos;
CREATE POLICY "Users and admins can view relevant jobs" ON public.trabajos FOR SELECT USING (
  auth.uid() = cliente_id OR
  EXISTS (SELECT 1 FROM public.perfiles_profesionales p WHERE p.id = perfil_profesional_id AND p.usuario_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.cliente_id = auth.uid() OR c.profesional_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
);

DROP POLICY IF EXISTS "Users can create jobs" ON public.trabajos;
CREATE POLICY "Users can create jobs" ON public.trabajos FOR INSERT WITH CHECK (
  auth.uid() = cliente_id OR
  EXISTS (SELECT 1 FROM public.perfiles_profesionales p WHERE p.id = perfil_profesional_id AND p.usuario_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update jobs" ON public.trabajos;
CREATE POLICY "Users can update jobs" ON public.trabajos FOR UPDATE USING (
  auth.uid() = cliente_id OR
  EXISTS (SELECT 1 FROM public.perfiles_profesionales p WHERE p.id = perfil_profesional_id AND p.usuario_id = auth.uid())
);

-- Políticas: resenas
DROP POLICY IF EXISTS "Public read access for reviews" ON public.resenas;
CREATE POLICY "Public read access for reviews" ON public.resenas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can write reviews" ON public.resenas;
CREATE POLICY "Clients can write reviews" ON public.resenas FOR INSERT WITH CHECK (auth.uid() = cliente_id);

DROP POLICY IF EXISTS "Users and professionals can update reviews" ON public.resenas;
CREATE POLICY "Users and professionals can update reviews" ON public.resenas FOR UPDATE USING (
  auth.uid() = cliente_id OR 
  auth.uid() = profesional_id OR
  EXISTS (SELECT 1 FROM public.perfiles_profesionales p WHERE p.id = perfil_profesional_id AND p.usuario_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
);

DROP POLICY IF EXISTS "Clients can delete own reviews" ON public.resenas;
DROP POLICY IF EXISTS "Clients and admins can delete reviews" ON public.resenas;
CREATE POLICY "Clients and admins can delete reviews" ON public.resenas FOR DELETE USING (
  auth.uid() = cliente_id OR
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
);

-- Políticas: favoritos
DROP POLICY IF EXISTS "Clients can manage their favorites" ON public.favoritos;
CREATE POLICY "Clients can manage their favorites" ON public.favoritos FOR ALL USING (auth.uid() = cliente_id);

-- Políticas: notificaciones
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users and admins can manage notifications" ON public.notificaciones;
CREATE POLICY "Users and admins can manage notifications" ON public.notificaciones FOR ALL USING (
  auth.uid() = usuario_id OR
  usuario_id IS NULL OR
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notificaciones;
CREATE POLICY "Anyone can insert notifications" ON public.notificaciones FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ==============================================================================

-- 1. Trigger para registrar automáticamente usuarios nuevos desde auth.users (Google Auth o Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (
    id,
    correo,
    nombre,
    apellidos,
    fecha_nacimiento,
    genero,
    onboarding_completado
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'apellidos', ''),
    COALESCE(NEW.raw_user_meta_data->>'birth_date', NEW.raw_user_meta_data->>'fecha_nacimiento', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', NEW.raw_user_meta_data->>'genero', ''),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    correo = EXCLUDED.correo,
    nombre = CASE WHEN public.usuarios.nombre IS NULL OR public.usuarios.nombre = '' THEN EXCLUDED.nombre ELSE public.usuarios.nombre END,
    apellidos = CASE WHEN public.usuarios.apellidos IS NULL OR public.usuarios.apellidos = '' THEN EXCLUDED.apellidos ELSE public.usuarios.apellidos END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger para incrementar total_trabajos_completados cuando un trabajo cambia a 'completed'
CREATE OR REPLACE FUNCTION public.update_total_jobs_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completed' AND (OLD.estado IS NULL OR OLD.estado != 'completed') THEN
    UPDATE public.usuarios 
    SET total_trabajos_completados = COALESCE(total_trabajos_completados, 0) + 1 
    WHERE id = (
      SELECT usuario_id FROM public.perfiles_profesionales WHERE id = NEW.perfil_profesional_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_trabajos_completed ON public.trabajos;
CREATE TRIGGER trigger_trabajos_completed
AFTER UPDATE ON public.trabajos
FOR EACH ROW
EXECUTE FUNCTION public.update_total_jobs_completed();

-- ==============================================================================
-- STORAGE BUCKETS Y POLÍTICAS DE IMÁGENES
-- ==============================================================================

-- Crear el bucket de avatares y fotos de portafolio si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;
CREATE POLICY "Anyone can update an avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can delete an avatar" ON storage.objects;
CREATE POLICY "Anyone can delete an avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ==============================================================================
-- PUBLICACIÓN EN TIEMPO REAL (REALTIME)
-- ==============================================================================

DO $$
BEGIN
  -- Crear la publicación supabase_realtime si aún no existe
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Añadir tablas a Realtime de forma segura
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trabajos;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Configurar REPLICA IDENTITY FULL para capturar cambios completos en tiempo real
ALTER TABLE public.mensajes REPLICA IDENTITY FULL;
ALTER TABLE public.trabajos REPLICA IDENTITY FULL;
ALTER TABLE public.notificaciones REPLICA IDENTITY FULL;
