const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:KENN2000tole@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    // 1. Agregar columna rol a la tabla usuarios
    console.log("Agregando columna 'rol' a la tabla 'usuarios'...");
    await client.query(`
      ALTER TABLE public.usuarios 
      ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'usuario';
    `);
    console.log("Columna 'rol' agregada exitosamente o ya existía.");

    console.log("Migración finalizada con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
