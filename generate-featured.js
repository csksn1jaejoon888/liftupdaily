/**
 * generate-featured.js
 * ══════════════════════════════════════════════════════════════════
 *  Generate featured.json — 20 video pilihan dari db-en.json
 *  Dijalankan otomatis oleh GitHub Actions setelah clean-db.js
 *  Tujuan: first paint homepage cepat tanpa tunggu 1000+ video load
 * ══════════════════════════════════════════════════════════════════
 */
'use strict';
const fs = require('fs');

const FEATURED_COUNT = 20;

function readDB(filename) {
  if(!fs.existsSync(filename)) return [];
  const raw = fs.readFileSync(filename,'utf-8').trim();
  if(!raw||raw==='[]') return [];
  return JSON.parse(raw);
}

const dbEN = readDB('db-en.json');
const dbID = readDB('db-id.json');

if(!dbEN.length) {
  console.log('⚠️  db-en.json kosong, skip generate featured.');
  process.exit(0);
}

// Ambil 20 video acak dari db-en (SEO) — re-shuffle setiap push
// Ini yang tampil pertama saat homepage dibuka
const shuffledEN = [...dbEN].sort(()=>0.5-Math.random());
const featuredEN = shuffledEN.slice(0, Math.min(FEATURED_COUNT, shuffledEN.length));

// Tambah beberapa dari db-id juga agar mix
const shuffledID = [...dbID].sort(()=>0.5-Math.random());
const featuredID = shuffledID.slice(0, Math.min(4, shuffledID.length));

const featured = [...featuredEN, ...featuredID].sort(()=>0.5-Math.random());

fs.writeFileSync('featured.json', JSON.stringify(featured, null, 2), 'utf-8');
console.log(`✅ featured.json dibuat — ${featured.length} video (${featuredEN.length} EN + ${featuredID.length} ID)`);
