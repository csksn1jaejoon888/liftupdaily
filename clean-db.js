/**
 * clean-db.js
 * ══════════════════════════════════════════════════════════════════
 *  Bersihkan hashtag dari db-en.json dan db-id.json
 *  Jalankan: node clean-db.js
 *  Letakkan di folder yang sama dengan db-en.json dan db-id.json
 * ══════════════════════════════════════════════════════════════════
 */

'use strict';
const fs = require('fs');

function cleanSummary(text) {
  if (!text) return text;
  return text
    .replace(/#[\w-]+/g, '')     // hapus semua #hashtag
    .replace(/[ \t]{2,}/g, ' ') // bersihkan spasi ganda sisa hashtag
    .replace(/\n{3,}/g, '\n\n') // normalkan baris kosong berlebih
    .replace(/ \./g, '.')       // bersihkan spasi sebelum titik
    .replace(/ ,/g, ',')        // bersihkan spasi sebelum koma
    .trim();
}

function cleanDatabase(filename) {
  if (!fs.existsSync(filename)) {
    console.log(`⚠️  ${filename} tidak ditemukan, skip.`);
    return;
  }

  const raw  = fs.readFileSync(filename, 'utf-8');
  const data = JSON.parse(raw);

  let cleaned    = 0;
  let alreadyOk  = 0;

  const result = data.map(item => {
    const before = item.summary || '';
    const after  = cleanSummary(before);

    if (before !== after) {
      cleaned++;
    } else {
      alreadyOk++;
    }

    return { ...item, summary: after };
  });

  fs.writeFileSync(filename, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ ${filename} — ${cleaned} dibersihkan, ${alreadyOk} sudah bersih`);
}

console.log('══════════════════════════════════════');
console.log('  Clean DB — hapus hashtag dari JSON  ');
console.log('══════════════════════════════════════');

cleanDatabase('db-en.json');
cleanDatabase('db-id.json');

console.log('\n✅ Selesai!');
