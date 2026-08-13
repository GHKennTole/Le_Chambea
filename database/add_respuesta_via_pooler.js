const { Client } = require('pg');

const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com'
];

async function run() {
  for (const host of hosts) {
    console.log(`Intentando conectar a ${host}...`);
    const client = new Client({
      connectionString: `postgresql://postgres.mfdlezraflnlffmfjkxa:<REDACTED>@${host}:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`✅ ¡CONECTADO CON ÉXITO A ${host}!`);
      
      console.log("Añadiendo columnas 'respuesta_profesional' y 'fecha_respuesta'...");
      await client.query(`
        ALTER TABLE public.resenas 
        ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT,
        ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ;

        DROP POLICY IF EXISTS "Professionals can update review responses" ON public.resenas;
        CREATE POLICY "Professionals can update review responses" ON public.resenas 
        FOR UPDATE USING (true);
      `);
      console.log("✅ Columnas creadas exitosamente en la DB!");
      await client.end();
      return;
    } catch (e) {
      console.log(`Falló ${host}:`, e.message);
    }
  }
}

run();
