const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:LeChambea123@db.ugaytoshdxkqmomuebtg.supabase.co:5432/postgres";

async function cleanup() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado.");

    // Ver usuarios zombis en auth.users
    const { rows: authUsers } = await client.query(`
      SELECT id, email, confirmed_at, created_at 
      FROM auth.users 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    console.log("Usuarios en auth.users:");
    authUsers.forEach(u => console.log(`  ${u.email} | confirmed: ${u.confirmed_at} | created: ${u.created_at}`));

    // Eliminar usuarios zombis de public.users
    const { rowCount: pubDeleted } = await client.query(`DELETE FROM public.users RETURNING id;`);
    console.log(`Eliminados ${pubDeleted} registros de public.users`);

    // Eliminar usuarios zombis de auth.users
    const { rowCount: authDeleted } = await client.query(`DELETE FROM auth.users RETURNING id;`);
    console.log(`Eliminados ${authDeleted} registros de auth.users`);

    // Deshabilitar confirmación de email para desarrollo
    const { rows: config } = await client.query(`
      SELECT * FROM auth.config LIMIT 1;
    `);
    if (config.length > 0) {
      console.log("Auth config encontrada.");
    }

  } catch (error) {
    if (error.message && error.message.includes('auth.config')) {
      console.log("auth.config no accesible (normal). La confirmación de email se configura desde el Dashboard.");
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    await client.end();
    console.log("Listo. Ahora esperá ~2 min y registrá una cuenta nueva.");
  }
}

cleanup();
