const dns = require('dns').promises;

async function test() {
  try {
    const res = await dns.resolve6('db.mfdlezraflnlffmfjkxa.supabase.co');
    console.log('IPv6 address for db.mfdlezraflnlffmfjkxa.supabase.co:', res);
  } catch (e) {
    console.log('IPv6 resolve error:', e.message);
  }
}

test();
