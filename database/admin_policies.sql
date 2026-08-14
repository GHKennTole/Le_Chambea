-- ==============================================================================
-- POLÍTICAS DE ADMINISTRADOR TOTAL (LE CHAMBEA - SUPABASE)
-- ==============================================================================
-- Copia y pega este script completo en el SQL Editor de tu Dashboard de Supabase
-- para habilitar y activar todas las funciones del rol Administrador.
-- ==============================================================================

-- 1. POLÍTICAS: perfiles_profesionales (Suspender, activar y eliminar servicios)
DROP POLICY IF EXISTS "Professionals can manage own profile" ON public.perfiles_profesionales;
DROP POLICY IF EXISTS "Professionals and admins can update profiles" ON public.perfiles_profesionales;
DROP POLICY IF EXISTS "Professionals and admins can delete profiles" ON public.perfiles_profesionales;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON public.perfiles_profesionales;

CREATE POLICY "Professionals and admins can update profiles" ON public.perfiles_profesionales
  FOR UPDATE USING (
    auth.uid() = usuario_id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

CREATE POLICY "Professionals and admins can delete profiles" ON public.perfiles_profesionales
  FOR DELETE USING (
    auth.uid() = usuario_id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

CREATE POLICY "Professionals can insert own profile" ON public.perfiles_profesionales
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- 2. POLÍTICAS: usuarios (Suspender, reactivar y eliminar cuentas de usuario)
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users and admins can update user data" ON public.usuarios;
DROP POLICY IF EXISTS "Users and admins can delete user data" ON public.usuarios;

CREATE POLICY "Users and admins can update user data" ON public.usuarios
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

CREATE POLICY "Users and admins can delete user data" ON public.usuarios
  FOR DELETE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

-- 3. POLÍTICAS: resenas (Moderar y eliminar reseñas de cualquier usuario)
DROP POLICY IF EXISTS "Clients can delete own reviews" ON public.resenas;
DROP POLICY IF EXISTS "Clients and admins can delete reviews" ON public.resenas;

CREATE POLICY "Clients and admins can delete reviews" ON public.resenas
  FOR DELETE USING (
    auth.uid() = cliente_id OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

-- 4. POLÍTICAS: notificaciones (Ver reportes, resolver incidencias y emitir comunicados)
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users and admins can manage notifications" ON public.notificaciones;

CREATE POLICY "Users and admins can manage notifications" ON public.notificaciones
  FOR ALL USING (
    auth.uid() = usuario_id OR
    usuario_id IS NULL OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );

-- 5. POLÍTICAS: trabajos (Supervisar y visualizar el historial de todos los trabajos)
DROP POLICY IF EXISTS "Users can view relevant jobs" ON public.trabajos;
DROP POLICY IF EXISTS "Users and admins can view relevant jobs" ON public.trabajos;

CREATE POLICY "Users and admins can view relevant jobs" ON public.trabajos
  FOR SELECT USING (
    auth.uid() = cliente_id OR
    EXISTS (SELECT 1 FROM public.perfiles_profesionales p WHERE p.id = perfil_profesional_id AND p.usuario_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.cliente_id = auth.uid() OR c.profesional_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'administrador'))
  );
