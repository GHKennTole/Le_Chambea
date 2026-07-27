const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function extractPdf() {
  const pdfPath = 'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion\\CentralCoffee_Proyecto_de_graduacion.pdf';
  
  // Read file as Buffer and convert to ArrayBuffer
  const buf = fs.readFileSync(pdfPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  
  // Create parser with the ArrayBuffer as options (it will call Hs(options) which detects ArrayBuffer)
  const parser = new PDFParse(arrayBuffer);
  
  // Use getText() to get all text
  const result = await parser.getText({});
  
  console.log('=== PDF INFO ===');
  console.log('Total pages:', result.total);
  console.log('Total text length:', result.text.length);
  
  // Save full text  
  fs.writeFileSync(
    'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion\\centralcoffee_text.txt',
    result.text, 
    'utf8'
  );
  console.log('Full text saved!');
  
  // Print first 20000 chars
  console.log('\n=== FIRST 20000 CHARS ===');
  console.log(result.text.substring(0, 20000));
}

extractPdf().catch(e => {
  console.error('Fatal:', e.message);
  console.error(e.stack);
});
