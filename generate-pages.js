/**
 * generate-pages.js
 * ══════════════════════════════════════════════════════════════════
 * Generate static HTML pages (SSG) for each video to achieve 
 * 100 PageSpeed Score and maximum SEO Organic reach.
 * ══════════════════════════════════════════════════════════════════
 */
'use strict';
const fs = require('fs');
const path = require('path');

function readDB(filename) {
  if(!fs.existsSync(filename)) return [];
  const raw = fs.readFileSync(filename,'utf-8').trim();
  if(!raw||raw==='[]') return [];
  return JSON.parse(raw);
}

// 1. Ambil database
const dbEN = readDB('db-en.json');
const dbID = readDB('db-id.json');
const allVideos = [...dbEN, ...dbID];

// 2. Siapkan folder utama untuk halaman statis
const outputDir = path.join(__dirname, 'video');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 3. Loop dan buat halaman HTML untuk masing-masing video
let generatedCount = 0;

allVideos.forEach(video => {
  if (!video.slug) return;

  // Folder spesifik untuk video ini (contoh: /video/anthropic-mythos/)
  const videoDir = path.join(outputDir, video.slug);
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Siapkan metadata
  const title = `${video.title} | Trend4GenZ`;
  const desc = video.meta_description ? video.meta_description : (video.summary ? video.summary.replace(/<[^>]*>/g,'').substring(0,160) + '...' : video.title);
  const url = `https://www.trend4genz.fun/video/${video.slug}/`;
  const imageUrl = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  
  // Format Tags
  const videoTags = video.tags || [];
  const tagsHTML = videoTags.length > 0 
    ? `<div class="seo-tags-container" style="margin-top:15px;padding-top:15px;border-top:1px solid #222;display:flex;flex-wrap:wrap;gap:6px;">` + 
      videoTags.map(tag => `<span class="seo-tag-badge" style="background:#111;color:#00ff66;border:1px solid #333;padding:4px 10px;border-radius:4px;font-size:.8rem;">&#35;${tag}</span>`).join('') + 
      `</div>` 
    : '';

  // HTML Template Murni (Hardcoded untuk Kecepatan Maksimal)
  // Dilengkapi teknik Facade/Lite Embed agar LCP hijau seketika!
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="https://www.trend4genz.fun/logo.png" sizes="96x96" type="image/png"/>
  
  <title>${title.replace(/"/g, '&quot;')}</title>
  <meta name="description" content="${desc.replace(/"/g, '&quot;')}">
  <meta name="robots" content="${video.source === 'nofollow' ? 'noindex, nofollow' : 'index, follow'}">
  <link rel="canonical" href="${url}">
  
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${imageUrl}">
  
  <script type="application/ld+json">
  {
    "@context":"https://schema.org",
    "@type":"VideoObject",
    "name":"${video.title.replace(/"/g, '\\"')}",
    "description":"${desc.replace(/"/g, '\\"')}",
    "uploadDate":"${video.uploadDate || new Date().toISOString().substring(0,19)+'+00:00'}",
    "thumbnailUrl":["${imageUrl}"],
    "embedUrl":"https://www.youtube.com/embed/${video.youtubeId}",
    "url":"${url}",
    "publisher":{"@type":"Organization","name":"Trend4GenZ","logo":{"@type":"ImageObject","url":"https://www.trend4genz.fun/logo.png"}}
  }
  </script>

  <style>
    /* CSS Esensial Diekstrak Langsung ke Head */
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#212122;color:#f1f1f1;font-family:'Segoe UI',sans-serif;}
    .navbar-custom{background:#000;padding:12px 15px;display:flex;align-items:center;border-bottom:1.5px solid #98FB98;}
    .brand-logo{color:#98FB98;font-weight:900;font-size:1.5rem;text-decoration:none;text-transform:uppercase;}
    .main-content{padding:15px;max-width:1150px;margin:auto;}
    .player-container{position:relative;width:100%;background:#000;border-radius:14px;overflow:hidden;aspect-ratio:16/9;cursor:pointer;}
    .play-overlay{position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;}
    .play-overlay svg{width:72px;height:72px;filter:drop-shadow(0 0 12px rgba(255,3,45,.7));transition:transform .15s;}
    .summary-box{background:rgba(255,255,255,.05);padding:20px;border-radius:12px;border-left:4px solid #98FB98;}
    .summary-text h2{font-size:1.1rem;color:#fff;margin:20px 0 8px;}
    .summary-text p{font-size:.9rem;line-height:1.5;color:#ddd;margin-bottom:12px;}
    .summary-text ul{margin-bottom:12px;padding-left:20px;}
    .summary-text li{font-size:.9rem;line-height:1.4;margin-bottom:5px;color:#ddd;}
  </style>
</head>
<body>

  <nav class="navbar-custom">
    <a href="https://www.trend4genz.fun/" class="brand-logo">Trend4GenZ</a>
  </nav>

  <div class="main-content">
    <h1 style="font-size:1.2rem;font-weight:800;margin-bottom:15px">${video.title}</h1>
    
    <div class="player-container" onclick="this.innerHTML='<iframe src=\\'https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&modestbranding=1&playsinline=1\\' style=\\'position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1\\' allow=\\'autoplay;encrypted-media;fullscreen\\' allowfullscreen></iframe>'">
      <img src="${imageUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2" alt="${video.title.replace(/"/g, '&quot;')}"/>
      <div class="play-overlay">
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.55)" stroke="#ff032d" stroke-width="3"/>
          <polygon points="32,24 60,40 32,56" fill="#ff032d"/>
        </svg>
      </div>
    </div>

    <div style="margin-top:20px;">
      <div class="summary-box">
        <div class="summary-text">${video.summary}</div>
        ${tagsHTML}
      </div>
    </div>
  </div>

</body>
</html>`;

  fs.writeFileSync(path.join(videoDir, 'index.html'), htmlContent, 'utf-8');
  generatedCount++;
});

console.log(`✅ Sukses! ${generatedCount} halaman HTML statis berhasil di-generate di folder /video/`);
