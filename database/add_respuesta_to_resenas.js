const { Client } = require('pg');
const dns = require('dns');

// Force DNS servers to Google / Cloudflare
dns.setServers(['8.8.8.8', '1.1.1.1']);

const DATABASE_URL = "postgresql://postgres:<REDACTED>@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos de producción.");

    console.log("Añadiendo columnas 'respuesta_profesional' y 'fecha_respuesta' a la tabla 'resenas'...");
    await client.query(`
      ALTER TABLE public.resenas 
      ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT,
      ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ;

      DROP POLICY IF EXISTS "Professionals can update review responses" ON public.resenas;
      CREATE POLICY "Professionals can update review responses" ON public.resenas 
      FOR UPDATE USING (true);
    `);
    console.log("✅ Columnas 'respuesta_profesional' y 'fecha_respuesta' creadas con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
