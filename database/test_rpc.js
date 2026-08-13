const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfdlezraflnlffmfjkxa.supabase.co';
const supabaseKey = 'sb_publishable_LGNlucxZxrM0HMJmRP3frw__gAv8YYc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE resenas ADD COLUMN IF NOT EXISTS respuesta_profesional TEXT;' });
  console.log('RPC exec_sql result:', { data, error });
}

testRpc();
