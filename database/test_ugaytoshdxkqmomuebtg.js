const { Client } = require('pg');

const DATABASE_URL1 = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";
const DATABASE_URL2 = "postgresql://postgres:<REDACTED>@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function run() {
  for (const url of [DATABASE_URL1, DATABASE_URL2]) {
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      console.log("✅ Conectado a db.ugaytoshdxkqmomuebtg.supabase.co!");
      await client.query(`
        ALTER TABLE public.resenas 
        ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT,
        ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ;
      `);
      console.log("✅ Columnas respuesta_profesional y fecha_respuesta creadas!");
      await client.end();
      return;
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}

run();
