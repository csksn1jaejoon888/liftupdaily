const fs = require('fs');

// Otomatis deteksi semua variasi nama file di folder utama Anda
const files = fs.readdirSync('.');
const fileEN = files.find(f => f.toLowerCase() === 'db-en.json');
const fileID = files.find(f => f.toLowerCase() === 'db-id.json');

let dbEN = [];
let dbID = [];

// Ambil data EN
if (fileEN) {
  const contentEN = fs.readFileSync(fileEN, 'utf8').trim();
  if (contentEN && contentEN !== '[]') {
    dbEN = JSON.parse(contentEN);
  }
}

// Ambil data ID
if (fileID) {
  const contentID = fs.readFileSync(fileID, 'utf8').trim();
  if (contentID && contentID !== '[]') {
    dbID = JSON.parse(contentID);
  }
}

const baseUrl = 'https://www.trend4genz.fun';

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/?lang=id</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/?lang=en</loc>
    <priority>1.0</priority>
  </url>`;

// Cetak URL Inggris
dbEN.forEach(video => {
  if (video && video.slug) {
    xml += `
  <url>
    <loc>${baseUrl}/?v=${video.slug}&amp;lang=en</loc>
    <priority>0.8</priority>
  </url>`;
}
});

// Cetak URL Indonesia
dbID.forEach(video => {
  if (video && video.slug) {
    xml += `
  <url>
    <loc>${baseUrl}/?v=${video.slug}&amp;lang=id</loc>
    <priority>0.8</priority>
  </url>`;
  }
});

xml += `\n</urlset>`;

fs.writeFileSync('./sitemap.xml', xml);
console.log(`✅ BERHASIL: sitemap.xml sukses dibuat!`);
