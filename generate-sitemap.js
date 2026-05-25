const fs = require('fs');

try {
  // Ambil data dari database baru Anda
  const dbEN = JSON.parse(fs.readFileSync('./db-en.json', 'utf8'));
  const dbID = JSON.parse(fs.readFileSync('./db-id.json', 'utf8'));

  const baseUrl = 'https://www.trend4genz.fun';

  // Tulis template dasar XML sitemap
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

  // Masukkan URL Video Bahasa Inggris berdasarkan Slug baru
  dbEN.forEach(video => {
    if (video.slug) {
      xml += `
  <url>
    <loc>${baseUrl}/?v=${video.slug}&amp;lang=en</loc>
    <priority>0.8</priority>
  </url>`;
    }
  });

  // Masukkan URL Video Bahasa Indonesia berdasarkan Slug baru
  dbID.forEach(video => {
    if (video.slug) {
      xml += `
  <url>
    <loc>${baseUrl}/?v=${video.slug}&amp;lang=id</loc>
    <priority>0.8</priority>
  </url>`;
    }
  });

  xml += `\n</urlset>`;

  // Simpan menjadi file sitemap.xml
  fs.writeFileSync('./sitemap.xml', xml);
  console.log(`✅ BERHASIL: sitemap.xml sukses dibuat dengan total ${dbEN.length + dbID.length} halaman video.`);

} catch (error) {
  console.error('❌ GAGAL: Terjadi kesalahan saat membaca database JSON:', error.message);
  process.exit(1);
}
