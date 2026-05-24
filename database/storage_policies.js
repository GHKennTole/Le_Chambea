const { Client } = require('pg');
const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function addPolicies() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();

    const policies = [
      `CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'AVATARS');`,
      `CREATE POLICY "Avatar auth insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'AVATARS' AND auth.role() = 'authenticated');`,
      `CREATE POLICY "Avatar owner update" ON storage.objects FOR UPDATE USING (bucket_id = 'AVATARS' AND auth.uid()::text = (storage.foldername(name))[1]);`,
      `CREATE POLICY "Avatar owner delete" ON storage.objects FOR DELETE USING (bucket_id = 'AVATARS' AND auth.uid()::text = (storage.foldername(name))[1]);`,
    ];

    for (const p of policies) {
      try {
        await client.query(p);
        console.log("OK:", p.substring(0, 50));
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log("Ya existe:", p.substring(0, 50));
        } else {
          console.error("Error:", e.message);
        }
      }
    }

    console.log("Políticas configuradas para bucket AVATARS.");
  } catch (e) {
    console.error(e.message);
  } finally {
    await client.end();
  }
}
addPolicies();
