// Convierte los 4 diagramas HTML a PNG de alta calidad
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const DOCDIR = 'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion';
const OUTDIR = 'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion\\propuestas';

const diagrams = [
  { html: 'diag_nav_web.html',  png: 'DIAGRAMA_Navegacion_Web.png',       w: 900,  h: 720  },
  { html: 'diag_nivel0.html',   png: 'DIAGRAMA_Arquitectura_Nivel0.png',  w: 900,  h: 380  },
  { html: 'diag_nivel1.html',   png: 'DIAGRAMA_Arquitectura_Nivel1.png',  w: 1000, h: 580  },
  { html: 'diag_nivel2.html',   png: 'DIAGRAMA_Arquitectura_Nivel2.png',  w: 1000, h: 470  },
];

(async () => {
  console.log('\n🖼️  Convirtiendo diagramas HTML → PNG...');
  console.log('───────────────────────────────────────────');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const d of diagrams) {
    const htmlPath = path.join(DOCDIR, d.html);
    const pngPath  = path.join(OUTDIR, d.png);

    if (!fs.existsSync(htmlPath)) {
      console.log('⚠️  No encontrado:', d.html);
      continue;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: 2 }); // 2x para alta resolución
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    // Fit to content
    const body = await page.$('body');
    const box  = await body.boundingBox();
    await page.setViewport({
      width:  Math.ceil(box.width)  + 20,
      height: Math.ceil(box.height) + 20,
      deviceScaleFactor: 2
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.screenshot({
      path: pngPath,
      fullPage: true,
      omitBackground: false,
      type: 'png'
    });

    await page.close();

    const size = Math.round(fs.statSync(pngPath).size / 1024);
    console.log(`✅  ${d.png}  (${size} KB)`);
  }

  await browser.close();
  console.log('───────────────────────────────────────────');
  console.log('✅  ¡Todos los diagramas generados en propuestas/');
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
