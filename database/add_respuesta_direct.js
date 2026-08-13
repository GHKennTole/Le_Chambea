const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:<REDACTED>@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Conectado directamente a Supabase DB!");

    console.log("Añadiendo columnas 'respuesta_profesional' y 'fecha_respuesta'...");
    await client.query(`
      ALTER TABLE public.resenas 
      ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT,
      ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ;

      DROP POLICY IF EXISTS "Professionals can update review responses" ON public.resenas;
      CREATE POLICY "Professionals can update review responses" ON public.resenas 
      FOR UPDATE USING (true);
    `);
    console.log("✅ Columnas respuesta_profesional y fecha_respuesta creadas exitosamente!");
    await client.end();
  } catch (e) {
    console.error("Error direct PG connection:", e);
  }
}

run();
