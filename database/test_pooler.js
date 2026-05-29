const dns = require('dns').promises;

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'ap-southeast-1',
  'ap-northeast-1'
];

async function testRegions() {
  console.log("Resolviendo hostnames de Supabase Pooler...");
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    try {
      const addresses = await dns.resolve4(host);
      console.log(`✅ Región [${region}] resuelta con éxito:`, addresses);
      return region;
    } catch (e) {
      // Ignorar fallas
    }
  }
  console.log("❌ No se pudo resolver ninguna región.");
  return null;
}

testRegions();
