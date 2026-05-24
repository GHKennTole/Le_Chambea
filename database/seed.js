require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');

async function seed() {
  // Read env manually since dotenv might not be in root or we can just parse it
  const envFile = fs.readFileSync('.env.local', 'utf8');
  let supabaseUrl = '';
  let supabaseKey = '';
  let dbUrl = '';

  envFile.split('\n').forEach(line => {
    if (line.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
    if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(line.indexOf('=') + 1).replace(/"/g, '').trim();
  });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const pgClient = new Client({ connectionString: dbUrl });
  
  await pgClient.connect();

  const perfiles = [
    { nombre: 'Carlos', apellido: 'Gómez', email: 'carlos.plomero@test.com', pass: 'Prueba123', prof: 'Plomería general', cat: 'Hogar', precio: '$15 - $30 / hr', zona: 'Norte' },
    { nombre: 'Ana', apellido: 'Martínez', email: 'ana.limpieza@test.com', pass: 'Prueba123', prof: 'Limpieza profunda', cat: 'Limpieza', precio: '$10 - $20 / hr', zona: 'Centro' },
    { nombre: 'Luis', apellido: 'Herrera', email: 'luis.electricista@test.com', pass: 'Prueba123', prof: 'Electricista residencial', cat: 'Hogar', precio: '$20 - $40 / hr', zona: 'Sur' },
    { nombre: 'María', apellido: 'Fernández', email: 'maria.tutora@test.com', pass: 'Prueba123', prof: 'Tutora de Matemáticas', cat: 'Educación', precio: '$12 - $25 / hr', zona: 'Este' },
    { nombre: 'Jorge', apellido: 'Ramírez', email: 'jorge.jardinero@test.com', pass: 'Prueba123', prof: 'Diseño de jardines', cat: 'Jardinería', precio: '$15 - $35 / hr', zona: 'Oeste' },
    { nombre: 'Sofía', apellido: 'Torres', email: 'sofia.diseno@test.com', pass: 'Prueba123', prof: 'Diseño Gráfico', cat: 'Digital', precio: '$25 - $50 / hr', zona: 'Remoto' },
    { nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro.mecanico@test.com', pass: 'Prueba123', prof: 'Mecánico a domicilio', cat: 'Automotriz', precio: '$30 - $60 / hr', zona: 'Norte' },
    { nombre: 'Laura', apellido: 'Díaz', email: 'laura.masajes@test.com', pass: 'Prueba123', prof: 'Masajista terapéutica', cat: 'Salud y Bienestar', precio: '$40 - $80 / hr', zona: 'Centro' },
    { nombre: 'Diego', apellido: 'Castro', email: 'diego.pintor@test.com', pass: 'Prueba123', prof: 'Pintura de interiores', cat: 'Hogar', precio: '$18 - $30 / hr', zona: 'Sur' },
    { nombre: 'Carmen', apellido: 'Ruiz', email: 'carmen.eventos@test.com', pass: 'Prueba123', prof: 'Planificadora de eventos', cat: 'Eventos', precio: '$50 - $100 / hr', zona: 'Todas' }
  ];

  console.log('Iniciando la creación de 10 perfiles...');

  for (const p of perfiles) {
    console.log(`\nCreando usuario: ${p.email}`);
    
    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: p.email,
      password: p.pass,
    });

    if (authError) {
      console.error(`Error en auth para ${p.email}:`, authError.message);
      continue;
    }

    const userId = authData.user.id;

    // 2. Insertar en public.users
    try {
      await pgClient.query(
        `INSERT INTO public.users (id, name, last_name, email, city, onboarding_completed) 
         VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT (id) DO NOTHING`,
        [userId, p.nombre, p.apellido, p.email, p.zona]
      );
      
      // 3. Insertar en public.professional_profiles
      await pgClient.query(
        `INSERT INTO public.professional_profiles (user_id, category, profession, price_range, zone, is_active) 
         VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT (user_id) DO NOTHING`,
        [userId, p.cat, p.prof, p.precio, p.zona]
      );
      console.log(`✅ Perfil creado exitosamente para ${p.nombre} ${p.apellido}`);
    } catch (dbErr) {
      console.error(`Error en BD para ${p.email}:`, dbErr.message);
    }
  }

  console.log('\nProceso de seeding finalizado.');
  await pgClient.end();
}

seed();
