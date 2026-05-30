/**
 * clean-db.js
 * ══════════════════════════════════════════════════════════════════
 *  1. Hapus video mati dari YouTube (private/dihapus/age-restricted)
 *  2. Hapus duplikat youtubeId lintas db-en dan db-id
 *  3. Bersihkan hashtag dari summary
 *  4. [BARU] Generate static-grid.json → 40 slug acak untuk homepage
 *     Tujuan: halaman home hanya eager-load 4 thumbnail pertama,
 *     sisanya lazy. static-grid.json di-random tiap deploy agar
 *     tampilan tidak monoton meski tidak ada video baru.
 *
 *  Jalankan: node clean-db.js
 *  Butuh: YOUTUBE_API_KEY di environment atau langsung di bawah
 * ══════════════════════════════════════════════════════════════════
 */

'use strict';
const fs    = require('fs');
const https = require('https');

// ── API Key YouTube ───────────────────────────────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'MASUKKAN_API_KEY_DISINI';

const BATCH_SIZE      = 50;
const DELAY_MS        = 500;

// ── Jumlah slug yang disimpan di static-grid.json ────────────────
// Index.html akan tampilkan slug-slug ini DULUAN di home grid.
// Diambil secara acak dari gabungan db-en + db-id setiap kali clean-db berjalan.
// Dengan begitu tampilan home selalu segar walau isi DB sama.
const STATIC_GRID_COUNT = 40;

// ── Helper ────────────────────────────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function readDB(filename) {
  if (!fs.existsSync(filename)) return [];
  const raw = fs.readFileSync(filename, 'utf-8').trim();
  if (!raw || raw === '[]') return [];
  return JSON.parse(raw);
}

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

// ── Fisher-Yates shuffle ─────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Cek status video via YouTube API ─────────────────────────────
async function checkVideosAlive(youtubeIds) {
  const aliveSet = new Set();

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'MASUKKAN_API_KEY_DISINI') {
    console.log('  ⚠️  YOUTUBE_API_KEY tidak ada — skip cek video mati');
    youtubeIds.forEach(id => aliveSet.add(id));
    return aliveSet;
  }

  for (let i = 0; i < youtubeIds.length; i += BATCH_SIZE) {
    const batch      = youtubeIds.slice(i, i + BATCH_SIZE);
    const ids        = batch.join(',');
    const url        = `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
    const batchNum   = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatch = Math.ceil(youtubeIds.length / BATCH_SIZE);

    process.stdout.write(`   Cek batch ${batchNum}/${totalBatch} (${batch.length} video)... `);

    try {
      const data = await httpsGet(url);
      if (data.items) {
        for (const item of data.items) {
          const status = item.status;
          if (status.privacyStatus === 'public' && status.embeddable === true) {
            aliveSet.add(item.id);
          }
        }
      }
      console.log(`✅ ${data.items ? data.items.length : 0} aktif dari ${batch.length}`);
    } catch(e) {
      console.log(`❌ Error: ${e.message} — batch ini di-skip`);
      batch.forEach(id => aliveSet.add(id));
    }

    if (i + BATCH_SIZE < youtubeIds.length) await delay(DELAY_MS);
  }

  return aliveSet;
}

// ── Generate static-grid.json ─────────────────────────────────────
// Pilih STATIC_GRID_COUNT slug secara acak dari gabungan kedua DB.
// Prioritas: db-en (SEO) → ambil sebagian besar dari sana.
// Hasilnya ditulis ke static-grid.json dan di-commit oleh GitHub Actions.
// Index.html membaca file ini dan menampilkan video-video ini DULUAN
// di halaman home, sehingga tidak perlu eager-load seluruh database.
function generateStaticGrid(dbEN, dbID) {
  const enSlugs = dbEN.map(v => v.slug).filter(Boolean);
  const idSlugs = dbID.map(v => v.slug).filter(Boolean);

  // Ambil 70% dari EN (SEO-friendly), 30% dari ID
  const enCount = Math.min(Math.ceil(STATIC_GRID_COUNT * 0.7), enSlugs.length);
  const idCount = Math.min(STATIC_GRID_COUNT - enCount, idSlugs.length);

  const pickedEN = shuffle(enSlugs).slice(0, enCount);
  const pickedID = shuffle(idSlugs).slice(0, idCount);

  // Gabung & shuffle lagi supaya campur
  const finalSlugs = shuffle([...pickedEN, ...pickedID]);

  fs.writeFileSync('static-grid.json', JSON.stringify(finalSlugs, null, 2), 'utf-8');
  console.log(`\n🎲 static-grid.json → ${finalSlugs.length} slug acak digenerate`);
  return finalSlugs;
}

// ── Proses utama ──────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  Clean DB — cek video mati + dedup + hashtag + grid ');
  console.log('══════════════════════════════════════════════════════\n');

  let dbEN = readDB('db-en.json');
  let dbID = readDB('db-id.json');

  const totalBefore = { en: dbEN.length, id: dbID.length };

  // ── STEP 1: Hapus duplikat dalam masing-masing DB ────────────────
  const seenEN = new Set();
  dbEN = dbEN.filter(item => {
    if (!item.youtubeId || seenEN.has(item.youtubeId)) return false;
    seenEN.add(item.youtubeId);
    return true;
  });

  const seenID = new Set();
  dbID = dbID.filter(item => {
    if (!item.youtubeId || seenID.has(item.youtubeId)) return false;
    seenID.add(item.youtubeId);
    return true;
  });

  // ── STEP 2: Hapus dari db-id kalau sudah ada di db-en ────────────
  const dupLintas = [];
  dbID = dbID.filter(item => {
    if (seenEN.has(item.youtubeId)) { dupLintas.push(item.youtubeId); return false; }
    return true;
  });

  // ── STEP 3: Cek video mati via YouTube API ───────────────────────
  console.log('📡 Mengecek status video di YouTube...\n');

  console.log(`📁 db-en.json (${dbEN.length} video):`);
  const enIds   = dbEN.map(v => v.youtubeId);
  const enAlive = await checkVideosAlive(enIds);
  const enDead  = dbEN.filter(v => !enAlive.has(v.youtubeId));
  dbEN = dbEN.filter(v => enAlive.has(v.youtubeId));

  console.log(`\n📁 db-id.json (${dbID.length} video):`);
  const idIds   = dbID.map(v => v.youtubeId);
  const idAlive = await checkVideosAlive(idIds);
  const idDead  = dbID.filter(v => !idAlive.has(v.youtubeId));
  dbID = dbID.filter(v => idAlive.has(v.youtubeId));

  // ── STEP 4: Bersihkan hashtag ────────────────────────────────────
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

  // ── STEP 5: Simpan DB ─────────────────────────────────────────────
  fs.writeFileSync('db-en.json', JSON.stringify(dbEN, null, 2), 'utf-8');
  fs.writeFileSync('db-id.json', JSON.stringify(dbID, null, 2), 'utf-8');

  // ── STEP 6: Generate static-grid.json ────────────────────────────
  const staticSlugs = generateStaticGrid(dbEN, dbID);

  // ── Laporan ───────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  LAPORAN HASIL');
  console.log('══════════════════════════════════════════════════════');

  console.log(`\n📁 db-en.json`);
  console.log(`   Sebelum        : ${totalBefore.en} video`);
  console.log(`   Video mati     : ${enDead.length} dihapus`);
  console.log(`   Duplikat       : ${totalBefore.en - dbEN.length - enDead.length} dihapus`);
  console.log(`   Hashtag        : ${cleanedEN} dibersihkan`);
  console.log(`   Tersisa        : ${dbEN.length} video`);

  if (enDead.length > 0) {
    console.log(`   Video mati EN  :`);
    enDead.slice(0,5).forEach(v => console.log(`     - ${v.youtubeId} | ${v.title?.substring(0,50)}`));
    if (enDead.length > 5) console.log(`     ... dan ${enDead.length - 5} lagi`);
  }

  console.log(`\n📁 db-id.json`);
  console.log(`   Sebelum        : ${totalBefore.id} video`);
  console.log(`   Video mati     : ${idDead.length} dihapus`);
  console.log(`   Duplikat lintas: ${dupLintas.length} dihapus`);
  console.log(`   Hashtag        : ${cleanedID} dibersihkan`);
  console.log(`   Tersisa        : ${dbID.length} video`);

  console.log(`\n📊 static-grid.json : ${staticSlugs.length} slug (acak, diperbarui tiap deploy)`);
  console.log(`   Total video aktif : ${dbEN.length + dbID.length}`);
  console.log(`   Total dihapus     : ${enDead.length + idDead.length + dupLintas.length}`);
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
