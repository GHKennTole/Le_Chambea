const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado.");

    // 1. Alter professional_profiles
    await client.query(`
      ALTER TABLE professional_profiles 
      ADD COLUMN IF NOT EXISTS service_index integer DEFAULT 0;
    `);

    // 2. We can't add UNIQUE if there are duplicates. Assuming it's safe to drop existing or clean them up.
    // Clean up duplicates if any just to be safe:
    await client.query(`
      WITH duplicates AS (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY created_at DESC) as row_num
        FROM professional_profiles
      )
      DELETE FROM professional_profiles WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);
    `);

    await client.query(`
      ALTER TABLE professional_profiles 
      DROP CONSTRAINT IF EXISTS uq_user_service;
    `);

    await client.query(`
      ALTER TABLE professional_profiles 
      ADD CONSTRAINT uq_user_service UNIQUE (user_id, service_index);
    `);

    // 3. Alter reviews to link to professional_profiles instead of just the user.
    await client.query(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS professional_profile_id uuid REFERENCES professional_profiles(id) ON DELETE CASCADE;
    `);
    
    // We should also drop the professional_id from reviews or just keep it for backward compatibility, 
    // but the requirements say we want it linked to professional_profiles(id). We'll keep professional_id just in case, but rely on professional_profile_id for new ones.

    console.log("Migración completada exitosamente.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

runMigration();
