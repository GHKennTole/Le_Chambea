const fs = require('fs');

const pdfPath = 'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion\\CentralCoffee_Proyecto_de_graduacion.pdf';
const buf = fs.readFileSync(pdfPath);

// Try to extract readable text from PDF bytes (latin1 approach)
const latin1 = buf.toString('latin1');

// Find readable ASCII text sequences >= 6 chars
const matches = latin1.match(/[\x20-\x7E]{6,}/g) || [];

// Filter out garbage (too many special chars, repetitive patterns)
const readable = matches.filter(m => {
  // Must contain at least some letters
  const letters = (m.match(/[a-zA-Z]/g) || []).length;
  return letters > m.length * 0.3;
});

console.log('Total readable segments:', readable.length);
console.log('\n--- First 200 segments ---');
readable.slice(0, 200).forEach((seg, i) => {
  console.log(`[${i}] ${seg}`);
});
