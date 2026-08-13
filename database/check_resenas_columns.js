const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfdlezraflnlffmfjkxa.supabase.co';
const supabaseKey = 'sb_publishable_LGNlucxZxrM0HMJmRP3frw__gAv8YYc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('resenas')
      .select('id, calificacion, comentario, respuesta_profesional, fecha_respuesta')
      .limit(1);

    if (error) {
      console.log('Error selecting columns from resenas:', error.message);
    } else {
      console.log('✅ Columns exist on resenas table! Sample:', data);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

checkColumns();
