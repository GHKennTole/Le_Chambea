const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfdlezraflnlffmfjkxa.supabase.co';
const supabaseKey = 'sb_publishable_LGNlucxZxrM0HMJmRP3frw__gAv8YYc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data: reviews } = await supabase.from('resenas').select('*').limit(1);
  console.log('Existing review sample:', reviews);

  if (reviews && reviews.length > 0) {
    const revId = reviews[0].id;
    const { data, error } = await supabase
      .from('resenas')
      .update({ respuesta_profesional: 'Test respuesta' })
      .eq('id', revId)
      .select();

    if (error) {
      console.log('Update error:', error);
    } else {
      console.log('✅ Update succeeded! Result:', data);
    }
  }
}

testUpdate();
