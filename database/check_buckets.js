const { Client } = require('pg');
const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function checkBuckets() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query(`SELECT id, name, public FROM storage.buckets;`);
    console.log("Buckets existentes:");
    rows.forEach(b => console.log(`  id: ${b.id} | name: ${b.name} | public: ${b.public}`));

    if (!rows.find(b => b.id === 'AVATARS')) {
      console.log("\nCreando bucket AVATARS...");
      await client.query(`
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('AVATARS', 'AVATARS', true);
      `);
      console.log("Bucket AVATARS creado (público).");
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}
checkBuckets();
