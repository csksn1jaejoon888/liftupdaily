// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  v3
//  Yang dikerjakan:
//    1. Hapus folder /video/ lama seluruhnya
//    2. Buat ulang /video/{slug}/index.html untuk setiap video seo
//    3. Overwrite index.html homepage dengan 20 video random hardcoded
//       (tidak perlu featured.json, tidak perlu fetch saat first paint)
// ══════════════════════════════════════════════════════════════════
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────
const DB_FILE    = path.join(__dirname, 'db-en.json');
const VIDEO_DIR  = path.join(__dirname, 'video');
const INDEX_FILE = path.join(__dirname, 'index.html');
const BASE_URL   = 'https://trend4genz.fun';
const SITE_NAME  = 'Trend4GenZ';
const DESC_DEF   = 'Streaming video terbaru — teknologi, AI, lifestyle, dan tren global.';
const HOMEPAGE_CARDS = 20;   // jumlah card hardcoded di homepage
const PAGE_SIZE  = 24;       // load-more batch size (sama dengan SPA)

// ── Helpers ───────────────────────────────────────────────────────
function esc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
                  .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function stripHtml(s = '') { return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function trunc(s, n = 160)  { const t = stripHtml(s); return t.length<=n ? t : t.slice(0,n-1)+'…'; }

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── Shuffle ───────────────────────────────────────────────────────
function shuffle(arr) { return [...arr].sort(() => 0.5 - Math.random()); }

// ════════════════════════════════════════════════════════════════
//  BUILD HALAMAN VIDEO STATIS
// ════════════════════════════════════════════════════════════════
function buildVideoPage(v, allVideos) {
  const canonical  = `${BASE_URL}/video/${v.slug}/`;
  const thumb      = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const thumbOg    = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const desc       = trunc(v.summary || DESC_DEF, 160);
  const uploadDate = v.uploadDate || new Date().toISOString();
  const tags       = v.tags || [];

  const related = shuffle(allVideos.filter(r => r.slug !== v.slug)).slice(0, 8);

  const jsonLd = JSON.stringify({
    '@context':'https://schema.org','@type':'VideoObject',
    'name':v.title,'description':desc,'thumbnailUrl':[thumb],
    'uploadDate':uploadDate,
    'embedUrl':`https://www.youtube.com/embed/${v.youtubeId}`,
    'url':canonical,
    'publisher':{'@type':'Organization','name':SITE_NAME,'url':BASE_URL}
  });

  const tagsHtml = tags.length
    ? `<div class="tags-wrap">${tags.map(t=>
        `<a href="${BASE_URL}/?tag=${encodeURIComponent(t)}" class="tag-badge">#${esc(t)}</a>`
      ).join('')}</div>`
    : '';

  const relatedHtml = related.map(r => `
    <a href="${BASE_URL}/video/${r.slug}/" class="rel-card">
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="160" height="90"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  // data untuk infinite slider JS
  const sliderDataJson = JSON.stringify(
    allVideos.filter(r=>r.slug!==v.slug).map(r=>({slug:r.slug,youtubeId:r.youtubeId,title:r.title}))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(v.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="robots" content="index, follow"/>
  <link rel="canonical" href="${canonical}"/>
  <link rel="icon" href="${BASE_URL}/logo.png" sizes="96x96" type="image/png"/>
  <meta property="og:type"        content="video.other"/>
  <meta property="og:title"       content="${esc(v.title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:url"         content="${canonical}"/>
  <meta property="og:image"       content="${thumbOg}"/>
  <meta property="og:site_name"   content="${SITE_NAME}"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${esc(v.title)}"/>
  <meta name="twitter:description" content="${esc(desc)}"/>
  <meta name="twitter:image"       content="${thumbOg}"/>
  <script type="application/ld+json">${jsonLd}</script>
  <link rel="preload" as="image" href="${thumb}" fetchpriority="high"/>
  <link rel="preconnect" href="https://img.youtube.com"/>
  <style>
    :root{--bg:#0a0a0a;--dark:#1a1a1a;--green:#98FB98;--red:#ff032d;--text:#f1f1f1}
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif}
    nav{background:#000;border-bottom:1.5px solid var(--green);position:sticky;top:0;z-index:100}
    .nav-inner{max-width:520px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 14px}
    .nav-logo{color:var(--green);font-size:1.1rem;font-weight:900;text-decoration:none;letter-spacing:.05em;text-transform:uppercase}
    .nav-home{background:transparent;border:1.5px solid var(--green);color:var(--green);padding:5px 14px;border-radius:4px;font-size:.75rem;font-weight:700;text-decoration:none}
    .page-wrap{max-width:520px;margin:0 auto}
    .player-wrap{position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden}
    .player-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;display:block}
    .play-overlay{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;background:rgba(0,0,0,.3)}
    .play-overlay:hover .play-svg{transform:scale(1.1)}
    .play-svg{width:68px;height:68px;filter:drop-shadow(0 0 12px rgba(255,3,45,.7));transition:transform .15s}
    .play-label{font-size:.9rem;font-weight:800;letter-spacing:.1em;text-shadow:0 2px 8px rgba(0,0,0,.9)}
    iframe{position:absolute;inset:0;width:100%;height:100%;border:none;z-index:30;display:none}
    iframe.active{display:block}
    .mask{position:absolute;z-index:25;background:var(--bg);pointer-events:none}
    .mask-top{top:0;left:0;width:65%;height:52px}
    .mask-bot{bottom:0;left:40%;width:100%;height:42px}
    .info{padding:14px}
    h1{font-size:1.15rem;font-weight:800;line-height:1.4;margin:12px 0 14px}
    .btn-row{display:flex;gap:10px;margin-bottom:16px}
    .btn-home{flex:1;padding:11px;background:#98FB98;color:#000;font-weight:700;font-size:.85rem;border:none;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
    .btn-more{flex:1;padding:11px;background:linear-gradient(90deg,#e53935,#ff6f00);color:#fff;font-weight:700;font-size:.85rem;border:none;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 14px rgba(255,65,108,.5)}50%{box-shadow:0 0 24px rgba(255,65,108,.85)}}
    .summary-box{background:rgba(255,255,255,.05);border-left:4px solid var(--green);border-radius:0 8px 8px 0;padding:16px;margin-bottom:16px;font-size:.88rem;line-height:1.7}
    .summary-box h2{font-size:1.0rem;font-weight:700;color:var(--green);margin:14px 0 6px}
    .summary-box h3{font-size:.95rem;font-weight:600;color:var(--green);margin:12px 0 5px}
    .summary-box p{margin-bottom:10px;color:#ddd}
    .summary-box ul{padding-left:18px;margin:6px 0}
    .summary-box li{margin-bottom:5px;color:#ddd}
    .summary-box strong{color:#fff}
    .tags-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:14px;border-top:1px solid #222}
    .tag-badge{background:#111;color:var(--green);border:1px solid #2a2a2a;padding:4px 10px;border-radius:4px;font-size:.78rem;font-weight:500;text-decoration:none;transition:.15s;display:inline-block}
    .tag-badge:hover{border-color:var(--green);color:#fff;background:#1a1a1a}
    .related-title{color:var(--green);font-size:.85rem;font-weight:700;margin-bottom:10px}
    .related-slider{display:flex;overflow-x:auto;gap:10px;padding-bottom:14px;scrollbar-width:none}
    .related-slider::-webkit-scrollbar{display:none}
    .rel-card{min-width:158px;max-width:158px;flex-shrink:0;background:var(--dark);border-radius:7px;overflow:hidden;text-decoration:none;color:var(--text);border:1px solid transparent;transition:.2s}
    .rel-card:hover{border-color:var(--green);transform:translateY(-2px)}
    .rel-card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
    .rel-card p{font-size:.72rem;padding:6px 8px 8px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    footer{padding:20px 14px;text-align:center;font-size:.72rem;color:#555;border-top:1px solid #1a1a1a;margin-top:10px}
    footer a{color:#555;text-decoration:none}
  </style>
</head>
<body>
<nav><div class="nav-inner">
  <a href="${BASE_URL}/" class="nav-logo">${SITE_NAME}</a>
  <a href="${BASE_URL}/" class="nav-home">⌂ HOME</a>
</div></nav>
<div class="page-wrap">
  <div class="player-wrap" id="player-box">
    <img id="thumb-img" src="${thumb}" alt="${esc(v.title)}"
         width="480" height="270" fetchpriority="high" decoding="sync"/>
    <div class="play-overlay" id="play-overlay" onclick="startPlay()">
      <svg class="play-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,.55)" stroke="#ff032d" stroke-width="3"/>
        <polygon points="32,24 60,40 32,56" fill="#ff032d"/>
      </svg>
      <span class="play-label">TAP TO WATCH</span>
    </div>
    <iframe id="yt-frame" allow="autoplay;encrypted-media;fullscreen" allowfullscreen></iframe>
    <div class="mask mask-top"></div>
    <div class="mask mask-bot"></div>
  </div>
  <div class="info">
    <h1>${esc(v.title)}</h1>
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
      ${v.summary || '<p>'+esc(desc)+'</p>'}
      ${tagsHtml}
    </div>
    <p class="related-title">MORE VIDEOS</p>
    <div class="related-slider" id="rel-slider">${relatedHtml}</div>
  </div>
</div>
<footer><a href="${BASE_URL}/">${SITE_NAME}</a> &nbsp;·&nbsp; <a href="${BASE_URL}/sitemap.xml">Sitemap</a></footer>
<script>
var YT_ID='${v.youtubeId}';
function startPlay(){
  document.getElementById('play-overlay').style.display='none';
  document.getElementById('thumb-img').style.display='none';
  var f=document.getElementById('yt-frame');
  f.src='https://www.youtube.com/embed/'+YT_ID+'?autoplay=1&rel=0&modestbranding=1&fs=0&controls=1&playsinline=1';
  f.classList.add('active');
}
// Infinite scroll slider
var _all=${sliderDataJson};
var _loaded=_all.slice(0,8).length;
document.getElementById('rel-slider').addEventListener('scroll',function(){
  if(this.scrollLeft+this.clientWidth>=this.scrollWidth-120){
    var next=_all.slice(_loaded,_loaded+8);
    if(!next.length){_loaded=0;next=_all.slice(0,8);}
    next.forEach(function(r){
      var a=document.createElement('a');
      a.className='rel-card';
      a.href='${BASE_URL}/video/'+r.slug+'/';
      a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" alt="" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
      document.getElementById('rel-slider').appendChild(a);
    });
    _loaded+=next.length;
  }
});
</script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  BUILD HOMEPAGE STATIS
//  - 20 video random hardcoded langsung di HTML (tidak perlu fetch)
//  - DB lengkap tetap di-fetch background untuk search + load more
// ════════════════════════════════════════════════════════════════
function buildHomepage(db) {
  const featured = shuffle(db).slice(0, HOMEPAGE_CARDS);

  // 4 card pertama: eager load (LCP), sisanya lazy
  function cardHtml(v, idx) {
    const loading = idx < 4 ? 'eager' : 'lazy';
    const fp      = idx < 4 ? ' fetchpriority="high"' : '';
    return `<a href="${BASE_URL}/video/${v.slug}/" class="video-card-link">
  <div class="video-card">
    <div class="thumb-wrap">
      <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg"
           alt="${esc(v.title)}" loading="${loading}"${fp}
           decoding="async" width="320" height="180"
           onload="this.classList.add('loaded')"
           onerror="this.src='https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg';this.classList.add('loaded')"/>
    </div>
    <div class="video-card-title">${esc(v.title)}</div>
  </div>
</a>`;
  }

  const cardsHtml = featured.map((v,i) => cardHtml(v,i)).join('\n');

  // Baca index.html lama untuk ambil semua CSS + JS config yang sudah ada
  // Kita hanya ganti bagian <div id="app"> dan loadDatabases()
  let html = fs.readFileSync(INDEX_FILE, 'utf8');

  // 1. Ganti konten #app skeleton → card hardcoded
  html = html.replace(
    /<div class="main-content" id="app">[\s\S]*?<\/div>\s*\n\s*<script>/,
    `<div class="main-content" id="app">
    <h5 style="color:#98FB98;margin-bottom:12px">🔥 TRENDING VIDEO</h5>
    <div class="video-grid" id="video-grid-inner">
${cardsHtml}
    </div>
    <div class="load-more-wrap"><button class="btn-load-more" id="btn-load-more" onclick="loadMore()">Load More</button></div>
  </div>

<script>`
  );

  // 2. Ganti loadDatabases() — tidak perlu featured.json lagi
  //    Hanya fetch db-en + db-id untuk search & load more
  const newLoadDB = `async function loadDatabases() {
  // Tidak fetch featured.json — homepage sudah hardcoded di HTML
  // Fetch DB lengkap hanya untuk search dan load more
  const [resEN, resID] = await Promise.all([
    fetch('./db-en.json'),
    fetch('./db-id.json')
  ]);
  videoDatabaseEN  = (await resEN.json()).map(v=>({...v, source: v.source||'seo'}));
  videoDatabaseID  = (await resID.json()).map(v=>({...v, source: v.source||'nofollow'}));
  const shuffled   = [...videoDatabaseEN, ...videoDatabaseID].sort(()=>0.5-Math.random());
  videoDatabaseALL = shuffled;

  // Isi currentData untuk load more (lanjutan dari 20 card hardcoded)
  const hardcodedSlugs = new Set(${JSON.stringify(featured.map(v=>v.slug))});
  const rest = videoDatabaseALL.filter(v => !hardcodedSlugs.has(v.slug));
  currentData  = rest;
  currentPage  = 1; // halaman pertama sudah ada dari HTML
}`;

  html = html.replace(
    /\/\/ ═+\s*\/\/\s*LOAD DATABASE[\s\S]*?^}/m,
    newLoadDB
  );

  // 3. Ganti router() — tidak perlu render homepage dari JS lagi
  //    Cukup init search dan handle tag/video navigation
  const newRouter = `async function router() {
  const app   = document.getElementById('app');
  const navbar= document.getElementById('main-navbar');
  const slug  = getCurrentSlug();
  const tag   = getUrlParams().get('tag');

  updateHtmlLang();
  updateRobotsBySource('seo');

  if(tag) {
    navbar.classList.remove('video-mode');
    // DB mungkin belum load saat tag diklik dari halaman video statis
    if(!videoDatabaseALL.length) await loadDatabases();
    const results = videoDatabaseALL.filter(v => v.tags && v.tags.some(t=>t.toLowerCase()===tag.toLowerCase()));
    renderGrid(app, results.length ? results : videoDatabaseALL);
    updateCanonical('home','seo');
    const h = app.querySelector('h5');
    if(h && results.length) h.textContent = '🏷️ Tag: #' + tag + ' (' + results.length + ' videos)';
  } else if(!slug || slug==='home') {
    // Homepage — card sudah ada di HTML, tidak perlu render ulang
    navbar.classList.remove('video-mode');
    updateCanonical('home','seo');
  } else {
    // Redirect ke halaman statis video
    window.location.replace('/video/' + slug + '/');
    return;
  }
  window.scrollTo(0,0);
}`;

  html = html.replace(
    /async function router\(\)[\s\S]*?^}/m,
    newRouter
  );

  // 4. Ganti load event — tidak perlu render homepage dari JS
  html = html.replace(
    /window\.addEventListener\('load'[\s\S]*?\}\);/,
    `window.addEventListener('load', async ()=>{
  try {
    // DB fetch di background — homepage sudah tampil dari HTML
    loadDatabases().then(()=>{ initSearch(); });
  } catch(e) {
    console.warn('DB load error:', e);
  }
  initSearch();
  router();
});`
  );

  return html;
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════
function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('❌ db-en.json tidak ditemukan!');
    process.exit(1);
  }
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('❌ index.html tidak ditemukan!');
    process.exit(1);
  }

  const rawDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const db    = rawDb.filter(v => v.source === 'seo' && v.slug && v.youtubeId && v.title);
  const skipped = rawDb.length - db.length;
  console.log(`📦 Database: ${rawDb.length} total → ${db.length} seo, ${skipped} dilewati`);

  // ── STEP 1: Hapus folder /video/ lama ──────────────────────────
  console.log('🗑️  Menghapus folder /video/ lama...');
  rmDir(VIDEO_DIR);
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  console.log('✅ /video/ bersih');

  // ── STEP 2: Generate halaman statis per video ───────────────────
  console.log('📄 Membuat halaman video statis...');
  let created = 0;
  db.forEach((v, i) => {
    const dir  = path.join(VIDEO_DIR, v.slug);
    const file = path.join(dir, 'index.html');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, buildVideoPage(v, db), 'utf8');
    created++;
    if (created % 50 === 0) console.log(`  ✅ ${created}/${db.length} halaman dibuat...`);
  });
  console.log(`✅ ${created} halaman video statis selesai`);

  // ── STEP 3: Overwrite index.html dengan 20 card hardcoded ───────
  console.log('🏠 Memperbarui index.html homepage...');
  const newIndex = buildHomepage(db);
  fs.writeFileSync(INDEX_FILE, newIndex, 'utf8');
  console.log('✅ index.html diperbarui dengan 20 video random hardcoded');

  console.log(`\n🎉 Selesai! ${created} halaman video + 1 homepage statis`);
}

main();
