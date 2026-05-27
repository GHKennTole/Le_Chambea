const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:<REDACTED>@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    console.log("Estableciendo REPLICA IDENTITY FULL en 'mensajes' y 'trabajos'...");
    await client.query(`
      ALTER TABLE public.mensajes REPLICA IDENTITY FULL;
      ALTER TABLE public.trabajos REPLICA IDENTITY FULL;
    `);
    console.log("REPLICA IDENTITY FULL establecido exitosamente.");

    console.log("Migración finalizada con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
