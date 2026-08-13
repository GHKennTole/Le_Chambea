const dns = require('dns').promises;

async function run() {
  try {
    const res = await dns.lookup('mfdlezraflnlffmfjkxa.supabase.co', { all: true });
    console.log('Lookup mfdlezraflnlffmfjkxa.supabase.co:', res);
  } catch (e) {
    console.error('Lookup error:', e);
  }
}
run();
