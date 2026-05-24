const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function runJobsMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado. Ejecutando migración de Jobs...");

    // 1. Añadir contador de trabajos a users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS total_jobs_completed integer DEFAULT 0;
    `);
    console.log("Columna total_jobs_completed añadida a users.");

    // 2. Crear tabla jobs
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
        client_id uuid REFERENCES users(id),
        professional_profile_id uuid REFERENCES professional_profiles(id),
        status text DEFAULT 'pending',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
    `);
    console.log("Tabla jobs creada.");

    // 3. Modificar reviews para enlazarse obligatoriamente a un job_id único
    // Solo si no existe
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='reviews' and column_name='job_id';
    `);

    if (res.rows.length === 0) {
      await client.query(`
        ALTER TABLE reviews 
        ADD COLUMN job_id uuid REFERENCES jobs(id) UNIQUE;
      `);
      console.log("Columna job_id añadida a reviews.");
    } else {
      console.log("La columna job_id ya existe en reviews.");
    }

    // 4. Crear un trigger para incrementar total_jobs_completed cuando el status pase a 'completed'
    await client.query(`
      CREATE OR REPLACE FUNCTION update_total_jobs_completed()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
          UPDATE users 
          SET total_jobs_completed = total_jobs_completed + 1 
          WHERE id = (
            SELECT user_id FROM professional_profiles WHERE id = NEW.professional_profile_id
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_jobs_completed ON jobs;
      
      CREATE TRIGGER trigger_jobs_completed
      AFTER UPDATE ON jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_total_jobs_completed();
    `);
    console.log("Trigger de actualización de total_jobs_completed creado.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

runJobsMigration();
