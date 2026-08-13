const { Client } = require('pg');

async function run() {
  const url = "postgresql://postgres:<REDACTED>@15.229.150.166:5432/postgres?options=project%3Dmfdlezraflnlffmfjkxa";
  console.log("Probando URL con options=project=mfdlezraflnlffmfjkxa...");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ ¡CONECTADO CON ÉXITO A SUPABASE DATABASE!");

    await client.query(`
      ALTER TABLE public.resenas 
      ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT,
      ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ;

      DROP POLICY IF EXISTS "Professionals can update review responses" ON public.resenas;
      CREATE POLICY "Professionals can update review responses" ON public.resenas 
      FOR UPDATE USING (true);
    `);
    console.log("🎉 ¡COLUMNAS 'respuesta_profesional' Y 'fecha_respuesta' CREADAS EXITOSAMENTE!");
    await client.end();
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
