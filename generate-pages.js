// ══════════════════════════════════════════════════════════════════
//  generate-pages.js
//  Membuat halaman HTML statis per video dari db-en.json
//  Output: video/{slug}/index.html
//  Dipanggil oleh build.yml setelah clean-db.js
// ══════════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────
  const DB_FILE      = path.join(__dirname, 'db-en.json'); // db-id.json sengaja tidak diproses (noindex/nofollow)
const OUTPUT_DIR   = path.join(__dirname, 'video');
const BASE_URL     = 'https://trend4genz.fun';
const SITE_NAME    = 'Trend4GenZ';
const DEFAULT_DESC = 'Streaming video terbaru — teknologi, AI, lifestyle, dan tren global.';

// ── Helpers ───────────────────────────────────────────────────────
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str, len = 160) {
  const s = stripHtml(str);
  return s.length <= len ? s : s.slice(0, len - 1) + '…';
}

function tagToSlug(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Template HTML statis per video ────────────────────────────────
function buildVideoPage(v, allVideos) {
  const canonical  = `${BASE_URL}/video/${v.slug}/`;
  const thumb      = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const thumbOg    = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const desc       = truncate(v.summary || DEFAULT_DESC, 160);
  const uploadDate = v.uploadDate || new Date().toISOString();
  const tags       = v.tags || [];

  // Related: 8 video random, bukan video ini sendiri
  const related = allVideos
    .filter(r => r.slug !== v.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 8);

  // JSON-LD VideoObject
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": v.title,
    "description": desc,
    "thumbnailUrl": [thumb],
    "uploadDate": uploadDate,
    "embedUrl": `https://www.youtube.com/embed/${v.youtubeId}`,
    "url": canonical,
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": BASE_URL
    }
  });

  // Tags HTML — internal link ke /?tag=
  const tagsHtml = tags.length
    ? `<div class="tags-wrap">${tags.map(t =>
        `<a href="${BASE_URL}/?tag=${encodeURIComponent(t)}" class="tag-badge">#${escHtml(t)}</a>`
      ).join('')}</div>`
    : '';

  // Related cards
  const relatedHtml = related.map(r => `
    <a href="${BASE_URL}/video/${r.slug}/" class="rel-card">
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${escHtml(r.title)}" loading="lazy" width="160" height="90"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s"/>
      <p>${escHtml(r.title)}</p>
    </a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escHtml(v.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${escHtml(desc)}"/>
  <link rel="canonical" href="${canonical}"/>

  <!-- Open Graph -->
  <meta property="og:type"        content="video.other"/>
  <meta property="og:title"       content="${escHtml(v.title)}"/>
  <meta property="og:description" content="${escHtml(desc)}"/>
  <meta property="og:url"         content="${canonical}"/>
  <meta property="og:image"       content="${thumbOg}"/>
  <meta property="og:site_name"   content="${SITE_NAME}"/>

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${escHtml(v.title)}"/>
  <meta name="twitter:description" content="${escHtml(desc)}"/>
  <meta name="twitter:image"       content="${thumbOg}"/>

  <!-- JSON-LD -->
  <script type="application/ld+json">${jsonLd}</script>

  <!-- Preload LCP image — kunci turunkan LCP -->
  <link rel="preload" as="image" href="${thumb}" fetchpriority="high"/>

  <style>
    :root{--bg:#0a0a0a;--dark:#111;--green:#98FB98;--red:#ff032d;--text:#eee}
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;max-width:1100px;margin:0 auto}

    /* Navbar */
    nav{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#000;position:sticky;top:0;z-index:100;border-bottom:1px solid #1a1a1a}
    .nav-logo{color:var(--green);font-size:1.1rem;font-weight:900;text-decoration:none;letter-spacing:.05em}
    .nav-home{background:transparent;border:1.5px solid var(--green);color:var(--green);padding:5px 14px;border-radius:4px;font-size:.75rem;font-weight:700;cursor:pointer;text-decoration:none}

    /* Desktop layout: player kiri, info kanan */
    .page-body{display:flex;flex-direction:column}
    @media(min-width:768px){
      .page-body{flex-direction:row;align-items:flex-start;gap:28px;padding:24px 20px}
      .player-col{flex:0 0 55%;max-width:55%}
      .info-col{flex:1;min-width:0}
      .info{padding:0}
    }

    /* Player */
    .player-wrap{position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden}
    .player-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;display:block}
    .play-overlay{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;background:rgba(0,0,0,.3)}
    .play-overlay:hover .play-svg{transform:scale(1.1)}
    .play-svg{width:68px;height:68px;filter:drop-shadow(0 0 12px rgba(255,3,45,.7));transition:transform .15s}
    .play-label{font-size:.9rem;font-weight:800;letter-spacing:.1em;text-shadow:0 2px 8px rgba(0,0,0,.9)}
    iframe{position:absolute;inset:0;width:100%;height:100%;border:none;z-index:30;display:none}
    iframe.active{display:block}

    /* Mask YouTube branding */
    .mask{position:absolute;z-index:25;background:var(--bg);pointer-events:none}
    .mask-top{top:0;left:0;width:65%;height:52px}
    .mask-bot{bottom:0;left:40%;width:100%;height:42px}

    /* Info */
    .info{padding:14px 20px}
    h1{font-size:1.25rem;font-weight:800;line-height:1.4;margin-bottom:14px}
    @media(min-width:768px){h1{font-size:1.45rem}}
    .btn-row{display:flex;gap:10px;margin-bottom:16px}
    .btn-home{flex:1;padding:11px;background:#98FB98;color:#000;font-weight:700;font-size:.85rem;border:none;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
    .btn-more{flex:1;padding:11px;background:linear-gradient(90deg,#e53935,#ff6f00);color:#fff;font-weight:700;font-size:.85rem;border:none;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}

    /* Summary */
    .summary-box{background:var(--dark);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:14px;margin-bottom:16px;font-size:.88rem;line-height:1.7}
    .summary-box h2,.summary-box h3{font-size:.95rem;color:var(--green);margin:14px 0 6px}
    .summary-box ul{padding-left:18px;margin:6px 0}
    .summary-box li{margin-bottom:5px}
    .summary-box p{margin-bottom:10px}

    /* Tags */
    .tags-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:14px;border-top:1px solid #1e1e1e}
    .tag-badge{background:#111;color:var(--green);border:1px solid #2a2a2a;padding:4px 10px;border-radius:4px;font-size:.78rem;font-weight:500;text-decoration:none;transition:.15s;display:inline-block}
    .tag-badge:hover{border-color:var(--green);color:#fff;background:#1a1a1a}

    /* Related */
    .related-title{color:var(--green);font-size:.85rem;font-weight:700;margin-bottom:10px}
    .related-slider{display:flex;overflow-x:auto;gap:10px;padding-bottom:12px;scrollbar-width:none}
    .related-slider::-webkit-scrollbar{display:none}
    .rel-card{min-width:158px;max-width:158px;flex-shrink:0;background:var(--dark);border-radius:7px;overflow:hidden;text-decoration:none;color:var(--text);border:1px solid transparent;transition:.2s}
    .rel-card:hover{border-color:var(--green);transform:translateY(-2px)}
    .rel-card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
    .rel-card p{font-size:.72rem;padding:6px 8px 8px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

    /* Mobile: info di bawah player */
    @media(max-width:767px){
      .player-col,.info-col{width:100%}
      .page-body{padding:0}
    }

    footer{padding:20px 14px;text-align:center;font-size:.72rem;color:#555;border-top:1px solid #1a1a1a;margin-top:10px}
    footer a{color:#555;text-decoration:none}
  </style>
</head>
<body>

<nav>
  <a href="${BASE_URL}/" class="nav-logo">${SITE_NAME}</a>
  <a href="${BASE_URL}/" class="nav-home">⌂ HOME</a>
</nav>

<div class="page-body">
  <!-- Kolom kiri: Player -->
  <div class="player-col">
    <div class="player-wrap" id="player-box">
      <img id="thumb-img"
           src="${thumb}"
           alt="${escHtml(v.title)}"
           width="480" height="270"
           fetchpriority="high"
           decoding="sync"/>
      <div class="play-overlay" id="play-overlay" onclick="startPlay()">
        <svg class="play-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,.55)" stroke="#ff032d" stroke-width="3"/>
          <polygon points="32,24 60,40 32,56" fill="#ff032d"/>
        </svg>
        <span class="play-label">TAP TO WATCH</span>
      </div>
      <iframe id="yt-frame"
              allow="autoplay;encrypted-media;fullscreen"
              allowfullscreen></iframe>
      <div class="mask mask-top"></div>
      <div class="mask mask-bot"></div>
    </div>
  </div>

  <!-- Kolom kanan: Info -->
  <div class="info-col">
    <div class="info">
      <h1>${escHtml(v.title)}</h1>

      <div class="btn-row">
        <a href="${BASE_URL}/" class="btn-home">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          HOME
        </a>
        <button class="btn-more" onclick="window.open('${BASE_URL}/?ref=moreinfo','_blank')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          More Info 🔥
        </button>
      </div>

      <div class="summary-box">
        ${v.summary || '<p>' + escHtml(desc) + '</p>'}
        ${tagsHtml}
      </div>

      <p class="related-title">MORE VIDEOS</p>
      <div class="related-slider" id="rel-slider">
        ${relatedHtml}
      </div>
    </div>
  </div>
</div>

<footer>
  <a href="${BASE_URL}/">${SITE_NAME}</a> &nbsp;·&nbsp;
  <a href="${BASE_URL}/sitemap.xml">Sitemap</a>
</footer>

<script>
  var YT_ID = '${v.youtubeId}';

  function startPlay() {
    document.getElementById('play-overlay').style.display = 'none';
    document.getElementById('thumb-img').style.display    = 'none';
    var f = document.getElementById('yt-frame');
    f.src = 'https://www.youtube.com/embed/' + YT_ID +
            '?autoplay=1&rel=0&modestbranding=1&fs=0&controls=1&playsinline=1';
    f.classList.add('active');
  }

  // Infinite scroll slider — load lebih banyak saat geser ke ujung
  var sliderData = ${JSON.stringify(related.map(r => ({ slug: r.slug, youtubeId: r.youtubeId, title: r.title })))};
  var allData    = ${JSON.stringify(allVideos.filter(r => r.slug !== v.slug).map(r => ({ slug: r.slug, youtubeId: r.youtubeId, title: r.title })))};
  var loaded     = sliderData.length;

  document.getElementById('rel-slider').addEventListener('scroll', function() {
    if (this.scrollLeft + this.clientWidth >= this.scrollWidth - 120) {
      var next = allData.slice(loaded, loaded + 8);
      if (!next.length) { loaded = 0; next = allData.slice(0, 8); } // loop
      next.forEach(function(r) {
        var a = document.createElement('a');
        a.className = 'rel-card';
        a.href = '${BASE_URL}/video/' + r.slug + '/';
        a.innerHTML = '<img src="https://img.youtube.com/vi/' + r.youtubeId +
          '/mqdefault.jpg" alt="" loading="lazy" width="160" height="90"' +
          ' onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s"/>' +
          '<p>' + r.title.replace(/</g,'&lt;') + '</p>';
        document.getElementById('rel-slider').appendChild(a);
      });
      loaded += next.length;
    }
  });
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('❌ db-en.json tidak ditemukan!');
    process.exit(1);
  }

  const rawDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  // Hanya proses video source=seo — skip nofollow agar tidak terindeks Google
  const db = rawDb.filter(v => v.source === 'seo');
  const skippedNofollow = rawDb.length - db.length;
  console.log(`📦 Database: ${rawDb.length} total → ${db.length} seo, ${skippedNofollow} nofollow dilewati`);

  // Buat folder output utama
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let created = 0;
  let skipped = 0;

  db.forEach((v, i) => {
    if (!v.slug || !v.youtubeId || !v.title) {
      console.warn(`⚠️  Skip video #${i} — field tidak lengkap (slug/youtubeId/title)`);
      skipped++;
      return;
    }

    const dir  = path.join(OUTPUT_DIR, v.slug);
    const file = path.join(dir, 'index.html');

    // Buat folder per video
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Tulis HTML
    fs.writeFileSync(file, buildVideoPage(v, db), 'utf8');
    created++;

    if (created % 100 === 0) console.log(`  ✅ ${created} halaman dibuat...`);
  });

  console.log(`\n✅ Selesai: ${created} halaman dibuat, ${skipped} dilewati`);
  console.log(`📁 Output: ./video/ (${created} folder)`);
}

main();
