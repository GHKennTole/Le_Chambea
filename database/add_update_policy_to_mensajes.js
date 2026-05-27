const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:KENN2000tole@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    console.log("Añadiendo política UPDATE a la tabla 'mensajes'...");
    await client.query(`
      DROP POLICY IF EXISTS "Users can update messages in their chats" ON public.mensajes;
      CREATE POLICY "Users can update messages in their chats" ON public.mensajes 
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.chats c 
            WHERE c.id = chat_id AND (c.cliente_id = auth.uid() OR c.profesional_id = auth.uid())
          )
        );
    `);
    console.log("Política UPDATE añadida exitosamente.");

    console.log("Migración finalizada con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
