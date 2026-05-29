const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:KENN2000tole@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function checkDb() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Conectado a la base de datos de producción.");

    // 1. Ver qué tablas existen en public
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Tablas en esquema 'public':");
    tablesRes.rows.forEach(r => console.log(` - ${r.table_name}`));

    // 2. Ver triggers en auth.users
    const triggersRes = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' OR event_object_table = 'users';
    `);
    console.log("\nTriggers encontrados:");
    triggersRes.rows.forEach(r => {
      console.log(` - Trigger: ${r.trigger_name} | Event: ${r.event_manipulation} | Table: ${r.event_object_table}`);
    });

    // 3. Ver todas las funciones creadas en public
    const functionsRes = await client.query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public';
    `);
    console.log("\nFunciones en 'public':");
    functionsRes.rows.forEach(r => {
      console.log(` - Función: ${r.routine_name}`);
      if (r.routine_name.includes('user') || r.routine_name.includes('usuario')) {
        console.log(`   Definición: ${r.routine_definition.substring(0, 300)}...`);
      }
    });

  } catch (error) {
    console.error("Error al conectar o consultar:", error);
  } finally {
    await client.end();
  }
}

checkDb();
