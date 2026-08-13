const tls = require('tls');

const sniHost = 'db.mfdlezraflnlffmfjkxa.supabase.co';
const poolerHost = 'aws-0-sa-east-1.pooler.supabase.com';

const ports = [443, 80, 5432, 6543];

async function test() {
  for (const port of ports) {
    console.log(`Probando puerto ${port}...`);
    try {
      await new Promise((resolve, reject) => {
        const socket = tls.connect({
          host: '15.229.150.166',
          port: port,
          servername: poolerHost,
          rejectUnauthorized: false
        }, () => {
          console.log(`✅ ¡Puerto ${port} ABIERTO Y FUNCIONAL con TLS!`);
          socket.end();
          resolve(true);
        });
        socket.on('error', (e) => {
          console.log(`Puerto ${port} error:`, e.message);
          resolve(false);
        });
        socket.setTimeout(3000, () => {
          socket.destroy();
          console.log(`Puerto ${port} timeout`);
          resolve(false);
        });
      });
    } catch (e) {}
  }
}

test();
