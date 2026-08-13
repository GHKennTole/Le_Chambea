const https = require('https');

function queryDns(name) {
  return new Promise((resolve, reject) => {
    https.get(`https://1.1.1.1/dns-query?name=${name}&type=A`, { headers: { 'accept': 'application/dns-json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const resA = await queryDns('db.mfdlezraflnlffmfjkxa.supabase.co');
    console.log('DNS A for db.mfdlezraflnlffmfjkxa.supabase.co:', resA);

    const resPooler = await queryDns('aws-0-sa-east-1.pooler.supabase.com');
    console.log('DNS A for pooler:', resPooler);
  } catch (e) {
    console.error('DNS error:', e);
  }
}

run();
