const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function dropOldConstraint() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    
    // Attempt to drop the unique constraint from user_id 
    await client.query(`
      ALTER TABLE professional_profiles 
      DROP CONSTRAINT IF EXISTS professional_profiles_user_id_key;
    `);

    console.log("Constraint professional_profiles_user_id_key eliminado exitosamente.");

  } catch (error) {
    console.error("Error al eliminar constraint:", error);
  } finally {
    await client.end();
  }
}

dropOldConstraint();
