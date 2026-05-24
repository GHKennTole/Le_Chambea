const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function updateTrigger() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado.");

    const query = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.users (id, email, name, last_name, birth_date, gender, onboarding_completed)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'birth_date', ''),
          COALESCE(NEW.raw_user_meta_data->>'gender', ''),
          FALSE
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          last_name = EXCLUDED.last_name,
          birth_date = EXCLUDED.birth_date,
          gender = EXCLUDED.gender;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await client.query(query);
    console.log("Trigger actualizado: ahora lee raw_user_meta_data.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

updateTrigger();
