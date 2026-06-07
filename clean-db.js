/**
 * clean-db.js  v2 — FIXED
 * ══════════════════════════════════════════════════════════════════
 *  1. Hapus video mati dari YouTube (private/dihapus)
 *     ✅ FIX: video yang tidak muncul di API response TIDAK dihapus
 *        (bisa karena region restriction atau filter bot GitHub Actions)
 *        Hanya hapus jika YouTube API eksplisit bilang private/deleted.
 *  2. Hapus duplikat youtubeId lintas db-en dan db-id
 *  3. Bersihkan hashtag dari summary
 *  4. Generate static-grid.json → 40 slug acak untuk homepage
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
const STATIC_GRID_COUNT = 40;

// ── Safety threshold ─────────────────────────────────────────────
// Jika lebih dari X% video dianggap mati → ABORT, DB tidak diubah.
// Mencegah kehilangan massal akibat quota habis / bug API.
const MAX_DEAD_PERCENT = 15;

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Cek status video via YouTube API ─────────────────────────────
// Mengembalikan: { aliveSet, deadSet }
//
// ✅ LOGIKA BARU (aman):
//   - Video eksplisit "private" atau "unlisted" di response → deadSet (hapus)
//   - Video yang TIDAK MUNCUL di response → aliveSet (jangan hapus!)
//     Alasan: GitHub Actions server (US/EU) sering di-filter YouTube
//     karena dianggap bot, atau video di-restrict per region.
//     Padahal video masih bisa embed dari browser biasa.
//   - API error / quota habis (data.error) → semua batch dianggap hidup
// ─────────────────────────────────────────────────────────────────
async function checkVideosAlive(youtubeIds) {
  const aliveSet = new Set();
  const deadSet  = new Set();

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'MASUKKAN_API_KEY_DISINI') {
    console.log('  ⚠️  YOUTUBE_API_KEY tidak ada — skip cek, semua dianggap hidup');
    youtubeIds.forEach(id => aliveSet.add(id));
    return { aliveSet, deadSet };
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

      // ✅ Cek jika API return error object (quota habis, auth gagal, dll)
      // Versi lama tidak cek ini → data.items = undefined → semua dianggap mati
      if (data.error) {
        const reason = data.error.errors?.[0]?.reason || 'unknown';
        console.log(`⚠️  API error [${reason}]: ${data.error.message}`);
        console.log(`   → Batch di-skip, semua ${batch.length} video dianggap HIDUP (aman)`);
        batch.forEach(id => aliveSet.add(id));
        if (i + BATCH_SIZE < youtubeIds.length) await delay(DELAY_MS);
        continue;
      }

      // Kumpulkan ID yang benar-benar muncul di response
      const returnedIds = new Set();

      if (data.items) {
        for (const item of data.items) {
          returnedIds.add(item.id);
          const privacyStatus = item.status?.privacyStatus;

          if (privacyStatus === 'private' || privacyStatus === 'unlisted') {
            // ✅ Eksplisit tidak publik → benar-benar mati, hapus
            deadSet.add(item.id);
          } else {
            // public (embeddable true/false) → hidup, simpan
            // embeddable=false bukan berarti mati — pemilik hanya menonaktifkan embed
            // tapi di situs streaming kita tetap bisa tampilkan thumbnail & link
            aliveSet.add(item.id);
          }
        }
      }

      // ✅ KUNCI FIX: video yang tidak muncul di response → JANGAN hapus
      // Versi lama: tidak ada di response = mati → ini yang menyebabkan 80 video hilang!
      // Penyebab tidak muncul: region restriction, bot filter GitHub Actions (server US/EU),
      // atau YouTube API quota per-region. Padahal video masih bisa embed dari browser normal.
      for (const id of batch) {
        if (!returnedIds.has(id)) {
          aliveSet.add(id); // tidak diketahui statusnya → anggap hidup, lebih aman
        }
      }

      const deadInBatch  = [...deadSet].filter(id => batch.includes(id)).length;
      const aliveInBatch = batch.length - deadInBatch;
      console.log(`✅ ${aliveInBatch} hidup, ${deadInBatch} mati (eksplisit private/deleted)`);

    } catch(e) {
      console.log(`❌ Error: ${e.message} — batch di-skip, semua dianggap HIDUP`);
      batch.forEach(id => aliveSet.add(id));
    }

    if (i + BATCH_SIZE < youtubeIds.length) await delay(DELAY_MS);
  }

  return { aliveSet, deadSet };
}

// ── Generate static-grid.json ─────────────────────────────────────
function generateStaticGrid(dbEN, dbID) {
  const enSlugs = dbEN.map(v => v.slug).filter(Boolean);
  const idSlugs = dbID.map(v => v.slug).filter(Boolean);

  const enCount  = Math.min(Math.ceil(STATIC_GRID_COUNT * 0.7), enSlugs.length);
  const idCount  = Math.min(STATIC_GRID_COUNT - enCount, idSlugs.length);
  const pickedEN = shuffle(enSlugs).slice(0, enCount);
  const pickedID = shuffle(idSlugs).slice(0, idCount);

  const finalSlugs = shuffle([...pickedEN, ...pickedID]);
  fs.writeFileSync('static-grid.json', JSON.stringify(finalSlugs, null, 2), 'utf-8');
  console.log(`\n🎲 static-grid.json → ${finalSlugs.length} slug acak digenerate`);
  return finalSlugs;
}

// ── Proses utama ──────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════');
  console.log('  Clean DB v2 — safe mode                            ');
  console.log('══════════════════════════════════════════════════════\n');

  let dbEN = readDB('db-en.json');
  let dbID = readDB('db-id.json');

  const totalBefore = { en: dbEN.length, id: dbID.length };

  // ── Backup otomatis sebelum apapun diubah ────────────────────────
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  if (fs.existsSync('db-en.json')) fs.copyFileSync('db-en.json', `db-en.backup-${ts}.json`);
  if (fs.existsSync('db-id.json')) fs.copyFileSync('db-id.json', `db-id.backup-${ts}.json`);
  console.log(`💾 Backup dibuat: db-en.backup-${ts}.json & db-id.backup-${ts}.json\n`);

  // ── STEP 1: Hapus duplikat dalam masing-masing DB ────────────────
  const seenEN = new Set();
  const dupEN  = [];
  dbEN = dbEN.filter(item => {
    if (!item.youtubeId || seenEN.has(item.youtubeId)) {
      dupEN.push(item.youtubeId);
      return false;
    }
    seenEN.add(item.youtubeId);
    return true;
  });

  const seenID = new Set();
  const dupID  = [];
  dbID = dbID.filter(item => {
    if (!item.youtubeId || seenID.has(item.youtubeId)) {
      dupID.push(item.youtubeId);
      return false;
    }
    seenID.add(item.youtubeId);
    return true;
  });

  // ── STEP 2: Hapus dari db-id kalau sudah ada di db-en ────────────
  const dupLintas = [];
  dbID = dbID.filter(item => {
    if (seenEN.has(item.youtubeId)) { dupLintas.push(item.youtubeId); return false; }
    return true;
  });

  console.log(`📊 Dedup selesai:`);
  console.log(`   db-en duplikat internal : ${dupEN.length}`);
  console.log(`   db-id duplikat internal : ${dupID.length}`);
  console.log(`   db-id duplikat lintas   : ${dupLintas.length}\n`);

  // ── STEP 3: Cek video mati via YouTube API ───────────────────────
  console.log('📡 Mengecek status video di YouTube...\n');

  console.log(`📁 db-en.json (${dbEN.length} video):`);
  const enResult      = await checkVideosAlive(dbEN.map(v => v.youtubeId));
  const enDead        = dbEN.filter(v => enResult.deadSet.has(v.youtubeId));
  const enDeadPercent = dbEN.length > 0 ? (enDead.length / dbEN.length) * 100 : 0;

  // Safety: abort jika terlalu banyak yang dianggap mati
  if (enDeadPercent > MAX_DEAD_PERCENT) {
    console.error(`\n🚨 ABORT! db-en: ${enDead.length}/${dbEN.length} video (${enDeadPercent.toFixed(1)}%) dianggap mati.`);
    console.error(`   Melebihi batas aman ${MAX_DEAD_PERCENT}%.`);
    console.error(`   Kemungkinan quota API habis atau terjadi error tak terduga.`);
    console.error(`   DB TIDAK diubah. Periksa manual atau naikkan MAX_DEAD_PERCENT jika yakin.`);
    process.exit(1);
  }

  dbEN = dbEN.filter(v => !enResult.deadSet.has(v.youtubeId));

  console.log(`\n📁 db-id.json (${dbID.length} video):`);
  const idResult      = await checkVideosAlive(dbID.map(v => v.youtubeId));
  const idDead        = dbID.filter(v => idResult.deadSet.has(v.youtubeId));
  const idDeadPercent = dbID.length > 0 ? (idDead.length / dbID.length) * 100 : 0;

  if (idDeadPercent > MAX_DEAD_PERCENT) {
    console.error(`\n🚨 ABORT! db-id: ${idDead.length}/${dbID.length} video (${idDeadPercent.toFixed(1)}%) dianggap mati.`);
    console.error(`   DB TIDAK diubah.`);
    process.exit(1);
  }

  dbID = dbID.filter(v => !idResult.deadSet.has(v.youtubeId));

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

  // ── STEP 5: Simpan DB ─────────────────────────────────────────────
  fs.writeFileSync('db-en.json', JSON.stringify(dbEN, null, 2), 'utf-8');
  fs.writeFileSync('db-id.json', JSON.stringify(dbID, null, 2), 'utf-8');
  console.log('\n💾 db-en.json & db-id.json disimpan.');

  // ── STEP 6: Generate static-grid.json ────────────────────────────
  const staticSlugs = generateStaticGrid(dbEN, dbID);

  // ── Laporan ───────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  LAPORAN HASIL');
  console.log('══════════════════════════════════════════════════════');

  console.log(`\n📁 db-en.json`);
  console.log(`   Sebelum          : ${totalBefore.en} video`);
  console.log(`   Duplikat internal: ${dupEN.length} dihapus`);
  console.log(`   Video mati       : ${enDead.length} dihapus (eksplisit private/deleted)`);
  console.log(`   Hashtag          : ${cleanedEN} dibersihkan`);
  console.log(`   Tersisa          : ${dbEN.length} video ✅`);

  if (enDead.length > 0) {
    console.log(`   Detail video mati EN:`);
    enDead.slice(0, 10).forEach(v =>
      console.log(`     - ${v.youtubeId} | ${v.title?.slice(0, 50)}`)
    );
    if (enDead.length > 10) console.log(`     ... dan ${enDead.length - 10} lagi`);
  }

  console.log(`\n📁 db-id.json`);
  console.log(`   Sebelum          : ${totalBefore.id} video`);
  console.log(`   Duplikat internal: ${dupID.length} dihapus`);
  console.log(`   Duplikat lintas  : ${dupLintas.length} dihapus`);
  console.log(`   Video mati       : ${idDead.length} dihapus (eksplisit private/deleted)`);
  console.log(`   Hashtag          : ${cleanedID} dibersihkan`);
  console.log(`   Tersisa          : ${dbID.length} video ✅`);

  if (idDead.length > 0) {
    console.log(`   Detail video mati ID:`);
    idDead.slice(0, 10).forEach(v =>
      console.log(`     - ${v.youtubeId} | ${v.title?.slice(0, 50)}`)
    );
    if (idDead.length > 10) console.log(`     ... dan ${idDead.length - 10} lagi`);
  }

  console.log(`\n📊 Ringkasan`);
  console.log(`   static-grid.json : ${staticSlugs.length} slug (acak, diperbarui tiap deploy)`);
  console.log(`   Total video aktif: ${dbEN.length + dbID.length}`);
  console.log(`   Total dihapus    : ${enDead.length + idDead.length + dupEN.length + dupID.length + dupLintas.length}`);
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
