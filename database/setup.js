const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = "postgresql://postgres:<REDACTED>@db.mfdlezraflnlffmfjkxa.supabase.co:5432/postgres";

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    // DDL commands
    const query = `
      -- 1. Tabla users (Base)
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT,
        last_name TEXT,
        birth_date TEXT,
        gender TEXT,
        email TEXT,
        phone TEXT,
        city TEXT,
        avatar_url TEXT,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read own data" ON public.users;
      CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
      DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
      CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
      DROP POLICY IF EXISTS "Users can update own data" ON public.users;
      CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

      -- Permitir lectura pública de perfiles básicos para que los clientes vean profesionales
      DROP POLICY IF EXISTS "Public read access for users" ON public.users;
      CREATE POLICY "Public read access for users" ON public.users FOR SELECT USING (true);

      -- 2. Tabla professional_profiles
      CREATE TABLE IF NOT EXISTS public.professional_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
        category TEXT NOT NULL,
        profession TEXT NOT NULL,
        description TEXT,
        price_range TEXT,
        zone TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public read access for professional profiles" ON public.professional_profiles;
      CREATE POLICY "Public read access for professional profiles" ON public.professional_profiles FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Professionals can manage own profile" ON public.professional_profiles;
      CREATE POLICY "Professionals can manage own profile" ON public.professional_profiles FOR ALL USING (auth.uid() = user_id);

      -- 3. Tabla chats (Conversaciones entre un cliente y un profesional)
      CREATE TABLE IF NOT EXISTS public.chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(client_id, professional_id)
      );

      ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can access their chats" ON public.chats;
      CREATE POLICY "Users can access their chats" ON public.chats FOR ALL USING (auth.uid() = client_id OR auth.uid() = professional_id);

      -- 4. Tabla messages
      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read messages in their chats" ON public.messages;
      CREATE POLICY "Users can read messages in their chats" ON public.messages FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.client_id = auth.uid() OR c.professional_id = auth.uid()))
      );
      DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
      CREATE POLICY "Users can insert messages in their chats" ON public.messages FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (c.client_id = auth.uid() OR c.professional_id = auth.uid()))
      );

      -- 5. Tabla reviews
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public read access for reviews" ON public.reviews;
      CREATE POLICY "Public read access for reviews" ON public.reviews FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Clients can write reviews" ON public.reviews;
      CREATE POLICY "Clients can write reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

      -- 6. Tabla favorites
      CREATE TABLE IF NOT EXISTS public.favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(client_id, professional_id)
      );

      ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Clients can manage their favorites" ON public.favorites;
      CREATE POLICY "Clients can manage their favorites" ON public.favorites FOR ALL USING (auth.uid() = client_id);

      -- CREAR BUCKETS PARA IMÁGENES (Ejecutando SQL, aunque idealmente se hace desde el panel, es posible via DDL si se tiene permisos)
      -- Insert into storage.buckets if exists
      INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
      
      -- Policies para el bucket
      DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
      CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
      DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
      CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    `;

    console.log("Ejecutando DDL...");
    await client.query(query);
    console.log("Tablas creadas y políticas RLS aplicadas.");

    // EXTRAER ESQUEMA FANTASMA
    console.log("Extrayendo esquema para sincronizar archivo local...");
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tablesRes = await client.query(tablesQuery);
    
    let schemaDump = "-- ESQUEMA FANTASMA (AUTO-GENERADO)\n\n";

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      
      const colsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const colsRes = await client.query(colsQuery, [tableName]);
      
      schemaDump += `CREATE TABLE ${tableName} (\n`;
      schemaDump += colsRes.rows.map(c => `  ${c.column_name} ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? 'DEFAULT ' + c.column_default : ''}`).join(',\n');
      schemaDump += `\n);\n\n`;
    }

    const policiesQuery = `
      SELECT tablename, policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `;
    const policiesRes = await client.query(policiesQuery);
    
    schemaDump += "-- POLICIES\n\n";
    policiesRes.rows.forEach(p => {
      schemaDump += `-- Table: ${p.tablename} | Policy: ${p.policyname} | Cmd: ${p.cmd}\n`;
      if (p.qual) schemaDump += `-- USING: ${p.qual}\n`;
      if (p.with_check) schemaDump += `-- WITH CHECK: ${p.with_check}\n`;
      schemaDump += '\n';
    });

    if (!fs.existsSync('database')) {
      fs.mkdirSync('database');
    }
    fs.writeFileSync('database/schema.sql', schemaDump);
    console.log("database/schema.sql guardado localmente.");

  } catch (error) {
    console.error("Error en BD:", error);
  } finally {
    await client.end();
  }
}

setupDatabase();
