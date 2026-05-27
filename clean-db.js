/**
 * clean-db.js
 * ══════════════════════════════════════════════════════════════════
 *  1. Hapus duplikat youtubeId — cek lintas db-en.json & db-id.json
 *  2. Bersihkan hashtag dari summary
 *  Jalankan: node clean-db.js
 * ══════════════════════════════════════════════════════════════════
 */

'use strict';
const fs = require('fs');

// ── Bersihkan hashtag dari summary ───────────────────────────────
function cleanSummary(text) {
  if (!text) return text;
  return text
    .replace(/#[\w-]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ \./g, '.')
    .replace(/ ,/g, ',')
    .trim();
}

// ── Baca JSON file ────────────────────────────────────────────────
function readDB(filename) {
  if (!fs.existsSync(filename)) return [];
  const raw = fs.readFileSync(filename, 'utf-8').trim();
  if (!raw || raw === '[]') return [];
  return JSON.parse(raw);
}

// ── Proses utama ──────────────────────────────────────────────────
console.log('══════════════════════════════════════════════════');
console.log('  Clean DB — hapus duplikat + bersihkan hashtag  ');
console.log('══════════════════════════════════════════════════\n');

let dbEN = readDB('db-en.json');
let dbID = readDB('db-id.json');

const totalBefore = { en: dbEN.length, id: dbID.length };

// ── STEP 1: Hapus duplikat DALAM db-en.json sendiri ──────────────
const seenEN = new Set();
dbEN = dbEN.filter(item => {
  if (!item.youtubeId || seenEN.has(item.youtubeId)) return false;
  seenEN.add(item.youtubeId);
  return true;
});

// ── STEP 2: Hapus duplikat DALAM db-id.json sendiri ──────────────
const seenID = new Set();
dbID = dbID.filter(item => {
  if (!item.youtubeId || seenID.has(item.youtubeId)) return false;
  seenID.add(item.youtubeId);
  return true;
});

// ── STEP 3: Hapus dari db-id jika youtubeId sudah ada di db-en ───
// db-en adalah prioritas utama (SEO) — db-id yang dibuang
const dupLintas = [];
dbID = dbID.filter(item => {
  if (seenEN.has(item.youtubeId)) {
    dupLintas.push(item.youtubeId);
    return false;
  }
  return true;
});

// ── STEP 4: Bersihkan hashtag dari summary ───────────────────────
let cleanedEN = 0, cleanedID = 0;

dbEN = dbEN.map(item => {
  const before = item.summary || '';
  const after  = cleanSummary(before);
  if (before !== after) cleanedEN++;
  return { ...item, summary: after };
});

dbID = dbID.map(item => {
  const before = item.summary || '';
  const after  = cleanSummary(before);
  if (before !== after) cleanedID++;
  return { ...item, summary: after };
});

// ── Simpan hasil ──────────────────────────────────────────────────
fs.writeFileSync('db-en.json', JSON.stringify(dbEN, null, 2), 'utf-8');
fs.writeFileSync('db-id.json', JSON.stringify(dbID, null, 2), 'utf-8');

// ── Laporan ───────────────────────────────────────────────────────
console.log('📁 db-en.json');
console.log(`   Sebelum : ${totalBefore.en} video`);
console.log(`   Sesudah : ${dbEN.length} video`);
console.log(`   Duplikat dihapus : ${totalBefore.en - dbEN.length}`);
console.log(`   Hashtag dibersihkan : ${cleanedEN}`);

console.log('\n📁 db-id.json');
console.log(`   Sebelum : ${totalBefore.id} video`);
console.log(`   Sesudah : ${dbID.length} video`);
console.log(`   Duplikat dihapus (dalam file) : ${totalBefore.id - dbID.length - dupLintas.length}`);
console.log(`   Duplikat dihapus (ada di EN)  : ${dupLintas.length}`);
console.log(`   Hashtag dibersihkan : ${cleanedID}`);

console.log('\n══════════════════════════════════════════════════');
console.log(`  Total duplikat dihapus : ${(totalBefore.en - dbEN.length) + (totalBefore.id - dbID.length)}`);
console.log(`  Total video tersisa    : ${dbEN.length + dbID.length}`);
console.log('══════════════════════════════════════════════════\n');
