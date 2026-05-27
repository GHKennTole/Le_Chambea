const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:KENN2000tole@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    // 1. Crear tabla notificaciones
    console.log("Creando tabla 'notificaciones'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notificaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        cuerpo TEXT,
        leido BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Tabla 'notificaciones' creada exitosamente.");

    // 2. Activar RLS
    console.log("Activando RLS...");
    await client.query(`
      ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
    `);

    // 3. Crear políticas RLS
    console.log("Creando políticas de seguridad RLS...");
    await client.query(`
      DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notificaciones;
      CREATE POLICY "Users can manage own notifications" ON public.notificaciones 
        FOR ALL USING (auth.uid() = usuario_id);

      DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notificaciones;
      CREATE POLICY "Anyone can insert notifications" ON public.notificaciones 
        FOR INSERT WITH CHECK (true);
    `);
    console.log("Políticas RLS aplicadas.");

    console.log("Migración finalizada con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
