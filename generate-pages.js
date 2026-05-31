// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  v4
//  Yang dikerjakan:
//    1. Hapus folder /video/ lama seluruhnya + buat ulang
//    2. Overwrite index.html dari index_base.html (template bersih)
//       dengan 20 card random hardcoded langsung di HTML
// ══════════════════════════════════════════════════════════════════
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────
const DB_FILE      = path.join(__dirname, 'db-en.json');
const BASE_TMPL    = path.join(__dirname, 'index_base.html');  // template tidak pernah disentuh
const INDEX_FILE   = path.join(__dirname, 'index.html');       // yang di-overwrite setiap build
const VIDEO_DIR    = path.join(__dirname, 'video');
const BASE_URL     = 'https://trend4genz.fun';
const SITE_NAME    = 'Trend4GenZ';
const DESC_DEF     = 'Streaming video terbaru — teknologi, AI, lifestyle, dan tren global.';
const HOMEPAGE_CARDS = 20;

// ── Helpers ────────────────────────────────────────────────────
function esc(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
                  .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function stripHtml(s='') { return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function trunc(s,n=160)  { const t=stripHtml(s); return t.length<=n?t:t.slice(0,n-1)+'…'; }
function rmDir(dir)      { if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true}); }
function shuffle(arr)    { return [...arr].sort(()=>0.5-Math.random()); }

// ════════════════════════════════════════════════════════════════
//  HALAMAN VIDEO STATIS
// ════════════════════════════════════════════════════════════════
function buildVideoPage(v, allVideos) {
  const canonical  = `${BASE_URL}/video/${v.slug}/`;
  const thumb      = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const thumbOg    = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const desc       = trunc(v.summary||DESC_DEF, 160);
  const uploadDate = v.uploadDate||new Date().toISOString();
  const tags       = v.tags||[];
  const related    = shuffle(allVideos.filter(r=>r.slug!==v.slug)).slice(0,8);

  const jsonLd = JSON.stringify({
    '@context':'https://schema.org','@type':'VideoObject',
    'name':v.title,'description':desc,'thumbnailUrl':[thumb],
    'uploadDate':uploadDate,
    'embedUrl':`https://www.youtube.com/embed/${v.youtubeId}`,
    'url':canonical,
    'publisher':{'@type':'Organization','name':SITE_NAME,'url':BASE_URL}
  });

  const tagsHtml = tags.length
    ? `<div class="seo-tags-container">${tags.map(t=>
        `<a href="${BASE_URL}/?tag=${encodeURIComponent(t)}" class="seo-tag-badge">#${esc(t)}</a>`
      ).join('')}</div>` : '';

  const relatedHtml = related.map(r=>`
    <a href="${BASE_URL}/video/${r.slug}/" class="slider-item" style="text-decoration:none;color:inherit;display:block">
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="160" height="90"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

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
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--green:#98FB98;--red:#ff032d;--dark:#1a1a1a}
    body{background:#212122;color:#f1f1f1;font-family:'Segoe UI',sans-serif;overflow-x:hidden}
    /* Navbar — sama persis dengan SPA video-mode (no logo, no border) */
    .navbar-custom{background:#000;padding:8px 15px;position:sticky;top:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;border-bottom:0}
    /* Search — sama dengan SPA */
    .navbar-right-group{display:flex;align-items:center;margin-left:auto}
    .search-wrapper{position:relative;display:flex;align-items:center;z-index:9999}
    .search-container{display:flex;align-items:center;background:var(--dark);border-radius:20px;padding:5px 12px;border:1px solid var(--green)}
    .search-container input{background:transparent;border:none;color:#fff;outline:none;font-size:.85rem;width:45px;transition:.3s}
    .search-container input:focus{width:65px}
    .search-suggestions{position:absolute;top:calc(100% + 6px);right:0;width:240px;background:var(--dark);border:1px solid var(--green);border-radius:10px;overflow:hidden;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.6);display:none}
    .search-suggestions.show{display:block}
    .suggestion-item{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.05)}
    .suggestion-item:last-child{border-bottom:none}
    .suggestion-item:hover{background:rgba(152,251,152,.12)}
    .suggestion-item img{width:52px;height:30px;object-fit:cover;border-radius:4px;flex-shrink:0}
    .suggestion-item span{font-size:.75rem;color:#f1f1f1;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .suggestion-empty{padding:12px;text-align:center;font-size:.75rem;color:#888}
    /* Player */
    .video-page-container{padding:15px;max-width:600px;margin:0 auto}
    @media(max-width:600px){.video-page-container{padding:0}}
    .player-container{position:relative;width:100%;background:#000;border-radius:14px;overflow:hidden;aspect-ratio:16/9}
    @media(max-width:600px){.player-container{border-radius:0}}
    .player-container iframe{position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1}
    .player-container>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2}
    .play-overlay{position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;gap:10px}
    .play-btn-svg{width:72px;height:72px;filter:drop-shadow(0 0 12px rgba(255,3,45,.7));transition:transform .15s}
    .play-overlay:hover .play-btn-svg{transform:scale(1.1)}
    .play-overlay-label{font-size:.95rem;font-weight:800;color:#fff;letter-spacing:.08em;text-shadow:0 2px 8px rgba(0,0,0,.8)}
    .video-mask{position:absolute;z-index:99999;background:transparent;pointer-events:all;touch-action:none}
    .mask-top{top:0;left:0;width:55%;height:94px}
    .mask-bottom{bottom:0;left:40%;width:100%;height:43px}
    /* Info */
    .info-section{padding:15px}
    h1{font-size:1.2rem;font-weight:800;line-height:1.4;margin:15px 0}
    /* Buttons */
    .dual-action-wrap{display:flex;gap:10px;margin-bottom:18px}
    .home-split-btn{width:50%;border:none;padding:10px 6px;border-radius:10px;font-weight:800;background:var(--green);color:#000;font-size:.8rem;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s}
    .home-split-btn:hover{background:#7ddb7d;transform:translateY(-2px)}
    .offer-split-btn{width:50%;border:none;padding:10px 6px;border-radius:10px;font-weight:800;color:#fff;font-size:.8rem;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#ff416c,#ff4b2b);animation:pulse-offer 2s infinite}
    @keyframes pulse-offer{0%,100%{box-shadow:0 0 14px rgba(255,65,108,.5)}50%{box-shadow:0 0 24px rgba(255,65,108,.85)}}
    /* Summary */
    .summary-box{background:rgba(255,255,255,.05);padding:20px;border-radius:12px;border-left:4px solid var(--green)}
    .summary-text{font-size:.9rem;line-height:1.5;color:#ddd}
    .summary-text h2{font-size:1.1rem;font-weight:700;margin:20px 0 8px;line-height:1.3;color:#fff}
    .summary-text h3{font-size:1.0rem;font-weight:600;margin:16px 0 6px;line-height:1.3;color:#fff}
    .summary-text p{font-size:.9rem;line-height:1.5;margin-bottom:12px;color:#ddd}
    .summary-text ul{margin-bottom:12px;padding-left:20px}
    .summary-text li{font-size:.9rem;line-height:1.4;margin-bottom:5px;color:#ddd}
    .summary-text strong{color:#fff}
    /* Tags */
    .seo-tags-container{margin-top:15px;padding-top:15px;border-top:1px solid #222;display:flex;flex-wrap:wrap;gap:6px}
    .seo-tag-badge{background:#111;color:#00ff66;border:1px solid #333;padding:4px 10px;border-radius:4px;font-size:.8rem;font-weight:500;text-decoration:none;transition:.15s;display:inline-block}
    .seo-tag-badge:hover{background:#1a1a1a;border-color:var(--green);color:#fff}
    /* Slider */
    .recommendation-slider{display:flex;overflow-x:auto;gap:12px;padding-bottom:15px;scrollbar-width:none;-ms-overflow-style:none}
    .recommendation-slider::-webkit-scrollbar{display:none}
    .slider-item{min-width:160px;max-width:160px;background:var(--dark);border-radius:8px;overflow:hidden;cursor:pointer;flex-shrink:0;transition:.2s;border:1px solid transparent}
    .slider-item:hover{border-color:var(--green);transform:translateY(-2px)}
    .slider-item img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
    .slider-item p{font-size:.72rem;padding:6px 8px 8px;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35;min-height:42px;color:#f1f1f1}
  </style>
</head>
<body>
<nav class="navbar-custom">
  <div class="navbar-right-group">
    <div class="search-wrapper">
      <div class="search-container">
        <input id="searchInput" placeholder="Cari..." type="text" autocomplete="off"/>
        <svg id="searchBtn" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#98FB98" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="cursor:pointer;flex-shrink:0"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <div class="search-suggestions" id="searchSuggestions"></div>
    </div>
  </div>
</nav>
<div class="video-page-container">
  <div class="player-container" id="player-box">
    <img src="${thumb}" alt="${esc(v.title)}" width="480" height="270"
         fetchpriority="high" decoding="sync"/>
    <div class="play-overlay" onclick="startPlay()">
      <svg class="play-btn-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,.55)" stroke="#ff032d" stroke-width="3"/>
        <polygon points="32,24 60,40 32,56" fill="#ff032d"/>
      </svg>
      <div class="play-overlay-label">TAP TO WATCH</div>
    </div>
    <div class="video-mask mask-top"></div>
    <div class="video-mask mask-bottom"></div>
  </div>
  <div class="info-section">
    <h1>${esc(v.title)}</h1>
    <div class="dual-action-wrap">
      <button class="home-split-btn" onclick="location.href='${BASE_URL}/'">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        HOME
      </button>
      <button class="offer-split-btn" onclick="window.open('${BASE_URL}/?ref=moreinfo','_blank')">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        More Info 🔥
      </button>
    </div>
    <div class="summary-box">
      <div class="summary-text">${v.summary||'<p>'+esc(desc)+'</p>'}</div>
      ${tagsHtml}
    </div>
    <h6 style="color:#98FB98;margin:24px 0 12px">MORE VIDEOS</h6>
    <div class="recommendation-slider" id="rec-slider">${relatedHtml}</div>
  </div>
</div>
<script>
function startPlay(){
  var pb=document.getElementById('player-box');
  pb.innerHTML='<iframe src="https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&fs=0&controls=1&playsinline=1" allow="autoplay;encrypted-media;fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1"></iframe>'+
  '<div class="video-mask mask-top"></div><div class="video-mask mask-bottom"></div>';
}

// Search — redirect ke homepage dengan query
(function(){
  var inp=document.getElementById('searchInput');
  var btn=document.getElementById('searchBtn');
  var sug=document.getElementById('searchSuggestions');
  function doSearch(){
    var q=inp.value.trim();
    if(q) window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);
  }
  inp.addEventListener('keydown',function(e){ if(e.key==='Enter') doSearch(); });
  btn.addEventListener('click', doSearch);
  // Placeholder suggestions saat mengetik
  inp.addEventListener('input',function(){
    var q=inp.value.trim();
    if(!q){ sug.classList.remove('show'); return; }
    sug.innerHTML='<div class="suggestion-empty">Tekan Enter untuk cari: <b>'+q+'</b></div>';
    sug.classList.add('show');
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('.search-wrapper')){ sug.classList.remove('show'); }
  });
})();
var _all=${sliderDataJson};
var _loaded=8;
document.getElementById('rec-slider').addEventListener('scroll',function(){
  if(this.scrollLeft+this.clientWidth>=this.scrollWidth-120){
    var next=_all.slice(_loaded,_loaded+8);
    if(!next.length){_loaded=0;next=_all.slice(0,8);}
    next.forEach(function(r){
      var a=document.createElement('a');
      a.className='slider-item';
      a.href='${BASE_URL}/video/'+r.slug+'/';
      a.style.cssText='text-decoration:none;color:inherit;display:block';
      a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
      document.getElementById('rec-slider').appendChild(a);
    });
    _loaded+=next.length;
  }
});
</script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  HOMEPAGE STATIS — dari index_base.html (template bersih)
// ════════════════════════════════════════════════════════════════
function buildHomepage(db) {
  const featured = shuffle(db).slice(0, HOMEPAGE_CARDS);

  // Baca template bersih — tidak pernah dimodifikasi langsung
  let html = fs.readFileSync(BASE_TMPL, 'utf8');

  // Ganti loadDatabases() — hapus featured.json, DB tetap di-fetch untuk search
  const newLoadDB = `async function loadDatabases() {
  // Homepage sudah hardcoded — DB fetch hanya untuk search & load more
  const [resEN, resID] = await Promise.all([
    fetch('./db-en.json'),
    fetch('./db-id.json')
  ]);
  videoDatabaseEN  = (await resEN.json()).map(v=>({...v,source:v.source||'seo'}));
  videoDatabaseID  = (await resID.json()).map(v=>({...v,source:v.source||'nofollow'}));
  videoDatabaseALL = [...videoDatabaseEN,...videoDatabaseID].sort(()=>0.5-Math.random());
  // currentData untuk load more = semua kecuali 20 yang sudah hardcoded
  const hardcoded = new Set(${JSON.stringify(featured.map(v=>v.slug))});
  currentData = videoDatabaseALL.filter(v=>!hardcoded.has(v.slug));
  currentPage = 1;
}`;

  html = html.replace(/async function loadDatabases\(\)\s*\{[\s\S]*?\n\}/, newLoadDB);

  // Ganti router() — homepage tidak perlu render dari JS lagi
  const newRouter = `async function router() {
  const app    = document.getElementById('app');
  const navbar = document.getElementById('main-navbar');
  const slug   = getCurrentSlug();
  const tag    = getUrlParams().get('tag');

  updateHtmlLang();
  updateRobotsBySource('seo');

  if(tag) {
    navbar.classList.remove('video-mode');
    if(!videoDatabaseALL.length) await loadDatabases();
    const results = videoDatabaseALL.filter(v=>v.tags&&v.tags.some(t=>t.toLowerCase()===tag.toLowerCase()));
    renderGrid(app, results.length?results:videoDatabaseALL);
    updateCanonical('home','seo');
    const h=app.querySelector('h5');
    if(h&&results.length) h.textContent='🏷️ Tag: #'+tag+' ('+results.length+' videos)';
  } else if(getUrlParams().get('search')) {
    // Dari search di halaman statis video
    navbar.classList.remove('video-mode');
    if(!videoDatabaseALL.length) await loadDatabases();
    const q=getUrlParams().get('search').toLowerCase();
    const results=videoDatabaseALL.filter(v=>v.title.toLowerCase().includes(q));
    renderGrid(app, results.length?results:videoDatabaseALL);
    updateCanonical('home','seo');
    const h=app.querySelector('h5');
    if(h) h.textContent=(results.length?'🔍 Hasil: "'+getUrlParams().get('search')+'" ('+results.length+' video)':'🔥 TRENDING VIDEO');
  } else if(!slug||slug==='home') {
    // Homepage — card sudah ada di HTML, tidak perlu render ulang
    navbar.classList.remove('video-mode');
    updateCanonical('home','seo');
  } else {
    // Redirect ke halaman statis video
    window.location.replace('/video/'+slug+'/');
    return;
  }
  window.scrollTo(0,0);
}`;

  html = html.replace(/async function router\(\)\s*\{[\s\S]*?\n\}/, newRouter);

  // Ganti load event
  const newLoad = `window.addEventListener('load', async ()=>{
  try {
    // DB fetch background — homepage sudah tampil dari HTML
    loadDatabases().then(()=>{ initSearch(); });
  } catch(e) { console.warn('DB load error:',e); }
  initSearch();
  router();
});`;

  html = html.replace(/window\.addEventListener\('load'[\s\S]*?\}\);/, newLoad);

  // Ganti renderCards — href ke /video/slug/ bukan ?v=slug
  html = html.replace(
    /let html = `<a href="\?v=\$\{v\.slug\}"/g,
    'let html = `<a href="/video/${v.slug}/"'
  );
  // Fallback kalau format sedikit beda
  html = html.replace(
    /href="\?v=\$\{v\.slug\}"/g,
    'href="/video/${v.slug}/"'
  );

  // Ganti konten #app skeleton → 20 card hardcoded
  function cardHtml(v, idx) {
    const loading = idx < 4 ? 'eager' : 'lazy';
    const fp      = idx < 4 ? ' fetchpriority="high"' : '';
    return `<a href="${BASE_URL}/video/${v.slug}/" class="video-card-link" style="text-decoration:none;color:inherit">
  <div class="video-card">
    <div class="thumb-wrap">
      <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg"
           alt="${esc(v.title)}" loading="${loading}"${fp} decoding="async" width="320" height="180"
           onload="this.classList.add('loaded')"
           onerror="this.src='https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg';this.classList.add('loaded')"/>
    </div>
    <div class="video-card-title">${esc(v.title)}</div>
  </div>
</a>`;
  }

  const cardsHtml = featured.map((v,i)=>cardHtml(v,i)).join('\n');

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

  return html;
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════
function main() {
  if (!fs.existsSync(DB_FILE)) { console.error('❌ db-en.json tidak ditemukan!'); process.exit(1); }

  // Kalau index_base.html belum ada → buat otomatis dari index.html yang ada sekarang
  if (!fs.existsSync(BASE_TMPL)) {
    if (!fs.existsSync(INDEX_FILE)) { console.error('❌ index.html dan index_base.html keduanya tidak ada!'); process.exit(1); }
    console.log('⚠️  index_base.html tidak ada → membuat dari index.html saat ini...');
    fs.copyFileSync(INDEX_FILE, BASE_TMPL);
    console.log('✅ index_base.html dibuat otomatis dari index.html');
  }

  const rawDb = JSON.parse(fs.readFileSync(DB_FILE,'utf8'));
  const db    = rawDb.filter(v=>v.source==='seo'&&v.slug&&v.youtubeId&&v.title);
  console.log(`📦 ${rawDb.length} total → ${db.length} seo valid`);

  // STEP 1: Hapus /video/ lama, buat ulang
  console.log('🗑️  Hapus /video/ lama...');
  rmDir(VIDEO_DIR);
  fs.mkdirSync(VIDEO_DIR,{recursive:true});

  // STEP 2: Generate halaman video statis
  console.log('📄 Generate halaman video...');
  let created=0;
  db.forEach(v=>{
    const dir=path.join(VIDEO_DIR,v.slug);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), buildVideoPage(v,db),'utf8');
    created++;
    if(created%50===0) console.log(`  ✅ ${created}/${db.length}`);
  });
  console.log(`✅ ${created} halaman video selesai`);

  // STEP 3: Overwrite index.html dari template bersih
  console.log('🏠 Update index.html dari index_base.html...');
  const newIndex = buildHomepage(db);
  fs.writeFileSync(INDEX_FILE, newIndex, 'utf8');
  console.log('✅ index.html diperbarui dengan 20 card random hardcoded');

  console.log(`\n🎉 Selesai! ${created} video + homepage statis`);
}

main();
