const fs = require('fs');

// Otomatis deteksi semua variasi nama file di folder utama Anda
const files = fs.readdirSync('.');
const fileEN = files.find(f => f.toLowerCase() === 'db-en.json');
const fileID = files.find(f => f.toLowerCase() === 'db-id.json');

let dbEN = [];

// Ambil data EN saja (db-id.json SENGAJA tidak dimasukkan ke sitemap)
if (fileEN) {
  const contentEN = fs.readFileSync(fileEN, 'utf8').trim();
  if (contentEN && contentEN !== '[]') {
    dbEN = JSON.parse(contentEN);
  }
}

// db-id.json tidak digunakan untuk sitemap
// (konten ID hanya untuk sosial media, bukan untuk indexing Google)
if (fileID) {
  console.log(`ℹ️  db-id.json ditemukan tapi TIDAK dimasukkan ke sitemap (noindex strategy)`);
}

const baseUrl = 'https://www.trend4genz.fun';

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>`;

// Hanya URL bahasa Inggris (db-en.json) yang masuk sitemap
dbEN.forEach(video => {
  if (video && video.slug) {
    xml += `
  <url>
    <loc>${baseUrl}/?v=${video.slug}</loc>
    <priority>0.8</priority>
  </url>`;
  }
});

xml += `\n</urlset>`;

fs.writeFileSync('./sitemap.xml', xml);
console.log(`✅ BERHASIL: sitemap.xml dibuat dengan ${dbEN.length} artikel EN`);
console.log(`🚫 URL lang=id tidak dimasukkan ke sitemap`);
