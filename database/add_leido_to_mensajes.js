const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:<REDACTED>@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    console.log("Añadiendo columna 'leido' a la tabla 'mensajes'...");
    await client.query(`
      ALTER TABLE public.mensajes 
      ADD COLUMN IF NOT EXISTS leido BOOLEAN DEFAULT FALSE;
    `);
    console.log("Columna 'leido' añadida exitosamente.");

    console.log("Migración finalizada con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
