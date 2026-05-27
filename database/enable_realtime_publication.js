const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:<REDACTED>@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    console.log("Añadiendo tablas a la publicación 'supabase_realtime' para habilitar tiempo real...");
    
    // In Supabase, we can check if the publication exists and add the tables to it.
    // If the table is already in the publication, "ADD TABLE" might throw, so we can do it safely by running:
    await client.query(`
      -- Asegurarnos de que existe la publicación
      CREATE PUBLICATION supabase_realtime;
    `).catch(err => {
      // Si la publicación ya existe, no pasa nada
      console.log("La publicación 'supabase_realtime' ya existe o se gestiona automáticamente.");
    });

    // Agregar las tablas de forma segura
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
    `).catch(err => console.log("mensajes ya está en supabase_realtime o: " + err.message));

    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
    `).catch(err => console.log("notificaciones ya está en supabase_realtime o: " + err.message));

    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.trabajos;
    `).catch(err => console.log("trabajos ya está en supabase_realtime o: " + err.message));

    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    `).catch(err => console.log("chats ya está en supabase_realtime o: " + err.message));

    console.log("Migración finalizada con éxito.");

  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await client.end();
  }
}

runMigration();
