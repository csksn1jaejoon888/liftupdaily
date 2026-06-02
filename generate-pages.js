// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  v7
//  Fix:
//    1. Search suggestion real di halaman statis (fetch db-en.json bg)
//    2. Tombol HOME muncul di halaman hasil search/?tag di homepage
//    3. Hasil search/tag: relevan di atas + semua video di bawah (tdk terputus)
//    4. Desktop player lebih lebar (max-width 1100px, tengah)
//    5. db-id.json tetap di-fetch di homepage (muncul di grid & load more)
//       tapi TIDAK di-generate jadi halaman statis
// ══════════════════════════════════════════════════════════════════
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────
const DB_FILE_EN   = path.join(__dirname, 'db-en.json');
const DB_FILE_ID   = path.join(__dirname, 'db-id.json');
const BASE_TMPL    = path.join(__dirname, 'index_base.html');
const INDEX_FILE   = path.join(__dirname, 'index.html');
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
//  KONFIGURASI ADS — HALAMAN STATIS
//  Edit bagian ini untuk mengatur semua ads di /video/slug/
// ════════════════════════════════════════════════════════════════
const STATIC_AD = {
  // ── Direct Link (tombol More Info 🔥) ──────────────────────────
  useDirect:   false,                          // true = aktifkan direct link
  directUrl:   'https://linkadsterra-kamu.com', // URL direct link Adsterra

  // ── Play Button Ads (direct link saat tap play) ────────────────
  // Muncul mulai dari video ke-N yang diputar di sesi yang sama
  usePlayAds:      false,                      // true = aktifkan play button ads
  playAdsUrl:      'https://linkadsterra.com', // URL direct link untuk play ads
  playAdsStartFrom: 2,                         // mulai dari tap play ke berapa
};

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

  // Semua video untuk infinite scroll slider + suggestion search
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
  ${v.faqSchema ? `<script type="application/ld+json">${JSON.stringify(v.faqSchema).replace(/<\/script>/gi,'<\\/script>')}</script>` : ''}
  <link rel="preload" as="image" href="${thumb}" fetchpriority="high"/>
  <link rel="preconnect" href="https://img.youtube.com"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--green:#98FB98;--red:#ff032d;--dark:#1a1a1a}
    body{background:#212122;color:#f1f1f1;font-family:'Segoe UI',sans-serif;overflow-x:hidden}

    /* ── Navbar ── */
    .navbar-custom{background:#000;padding:8px 15px;position:sticky;top:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;border-bottom:0}
    .navbar-right-group{display:flex;align-items:center;margin-left:auto}
    .search-wrapper{position:relative;display:flex;align-items:center;z-index:9999}
    .search-container{display:flex;align-items:center;background:var(--dark);border-radius:20px;padding:5px 12px;border:1px solid var(--green)}
    .search-container input{background:transparent;border:none;color:#fff;outline:none;font-size:.85rem;width:45px;transition:.3s}
    .search-container input:focus{width:65px}
    .search-suggestions{position:absolute;top:calc(100% + 6px);right:0;width:280px;background:var(--dark);border:1px solid var(--green);border-radius:10px;overflow:hidden;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.6);display:none}
    .search-suggestions.show{display:block}
    .suggestion-item{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.05)}
    .suggestion-item:last-child{border-bottom:none}
    .suggestion-item:hover{background:rgba(152,251,152,.12)}
    .suggestion-item img{width:52px;height:30px;object-fit:cover;border-radius:4px;flex-shrink:0}
    .suggestion-item span{font-size:.75rem;color:#f1f1f1;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .suggestion-item span em{color:var(--green);font-style:normal;font-weight:bold}
    .suggestion-empty{padding:12px;text-align:center;font-size:.75rem;color:#888}
    @media(max-width:768px){.search-suggestions{width:240px}}

    .video-page-container{width:100%;max-width:800px;margin:0 auto;padding:15px}
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
    .btn-fs-custom{position:absolute;bottom:18px;right:18px;z-index:2147483647;cursor:pointer;background:transparent;color:#fff;width:23px;height:23px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;box-shadow:0 0 20px var(--green);border:2px solid var(--green)}
    #player-box:fullscreen .video-mask,#player-box:-webkit-full-screen .video-mask{display:block!important}

    /* ── Info ── */
    .info-section{padding:15px}
    h1{font-size:1.2rem;font-weight:800;line-height:1.4;margin:15px 0}
    .dual-action-wrap{display:flex;gap:10px;margin-bottom:18px}
    .home-split-btn{width:50%;border:none;padding:10px 6px;border-radius:10px;font-weight:800;background:var(--green);color:#000;font-size:.8rem;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s}
    .home-split-btn:hover{background:#7ddb7d;transform:translateY(-2px)}
    .offer-split-btn{width:50%;border:none;padding:10px 6px;border-radius:10px;font-weight:800;color:#fff;font-size:.8rem;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#ff416c,#ff4b2b);animation:pulse-offer 2s infinite}
    @keyframes pulse-offer{0%,100%{box-shadow:0 0 14px rgba(255,65,108,.5)}50%{box-shadow:0 0 24px rgba(255,65,108,.85)}}
    .summary-box{background:rgba(255,255,255,.05);padding:20px;border-radius:12px;border-left:4px solid var(--green)}
    .summary-text{font-size:.9rem;line-height:1.5;color:#ddd}
    .summary-text h2{font-size:1.1rem;font-weight:700;margin:20px 0 8px;color:#fff}
    .summary-text h3{font-size:1.0rem;font-weight:600;margin:16px 0 6px;color:#fff}
    .summary-text p{font-size:.9rem;line-height:1.5;margin-bottom:12px;color:#ddd}
    .summary-text ul{margin-bottom:12px;padding-left:20px}
    .summary-text li{font-size:.9rem;line-height:1.4;margin-bottom:5px;color:#ddd}
    .summary-text strong{color:#fff}
    .seo-tags-container{margin-top:15px;padding-top:15px;border-top:1px solid #222;display:flex;flex-wrap:wrap;gap:6px}
    .seo-tag-badge{background:#111;color:#00ff66;border:1px solid #333;padding:4px 10px;border-radius:4px;font-size:.8rem;font-weight:500;text-decoration:none;transition:.15s;display:inline-block}
    .seo-tag-badge:hover{background:#1a1a1a;border-color:var(--green);color:#fff}
    .more-videos-label{color:#98FB98;margin:24px 0 12px;font-size:.85rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
    .recommendation-slider{display:flex;
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

<main>
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
      <button class="offer-split-btn" onclick="handleMoreInfo()">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        More Info 🔥
      </button>
    </div>
    <div class="summary-box">
      <div class="summary-text">${v.summary||'<p>'+esc(desc)+'</p>'}</div>
      ${tagsHtml}
    </div>
    <p class="more-videos-label">MORE VIDEOS</p>
    <div class="recommendation-slider" id="rec-slider">${relatedHtml}</div>
  </div>
</div>
</main>

<script>
// ── Konfigurasi Ads — di-inject saat build oleh generate-pages.js ──
var STATIC_AD = {
  useDirect:       ${STATIC_AD.useDirect},
  directUrl:       '${STATIC_AD.directUrl}',
  usePlayAds:      ${STATIC_AD.usePlayAds},
  playAdsUrl:      '${STATIC_AD.playAdsUrl}',
  playAdsStartFrom:${STATIC_AD.playAdsStartFrom}
};
// ── Ads config (dibaca dari STATIC_AD yang di-inject saat build) ──
var _playCount = 0; // hitung berapa kali tap play di sesi ini

// ── Tombol More Info 🔥 ──────────────────────────────────────────
function handleMoreInfo() {
  if (STATIC_AD.useDirect) {
    window.open(STATIC_AD.directUrl, '_blank');
  }
}

// ── Player & Fullscreen ──────────────────────────────────────────
function startPlay() {
  _playCount++;
  // Play Button Ads: buka direct link mulai dari tap ke-N
  if (STATIC_AD.usePlayAds && _playCount >= STATIC_AD.playAdsStartFrom) {
    window.open(STATIC_AD.playAdsUrl, '_blank');
  }
  var pb = document.getElementById('player-box');
  pb.innerHTML =
    '<iframe src="https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&fs=0&controls=1&playsinline=1"' +
    ' allow="autoplay;encrypted-media;fullscreen" allowfullscreen' +
    ' style="position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1"></iframe>' +
    '<div class="video-mask mask-top"></div>' +
    '<div class="video-mask mask-bottom"></div>' +
    '<div id="fs-btn" class="btn-fs-custom" onclick="toggleFS()" title="Fullscreen">' +
    '<svg id="fs-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/>' +
    '<polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/>' +
    '</svg></div>';
}
function toggleFS() {
  var el=document.getElementById('player-box'), svg=document.getElementById('fs-icon');
  if (!document.fullscreenElement&&!document.webkitFullscreenElement) {
    (el.requestFullscreen||el.webkitRequestFullscreen).call(el);
    if(svg) svg.innerHTML='<polyline points="8 3 3 3 3 8"/><line x1="3" y1="3" x2="10" y2="10"/><polyline points="21 8 21 3 16 3"/><line x1="21" y1="3" x2="14" y2="10"/><polyline points="3 16 3 21 8 21"/><line x1="3" y1="21" x2="10" y2="14"/><polyline points="16 21 21 21 21 16"/><line x1="21" y1="21" x2="14" y2="14"/>';
  } else {
    (document.exitFullscreen||document.webkitExitFullscreen).call(document);
    if(svg) svg.innerHTML='<polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/>';
  }
}

// ── FIX #1: Search suggestion real dari db-en.json ───────────────
var _db = ${sliderDataJson};  // sudah ada dari slider data, reuse!
(function(){
  var inp = document.getElementById('searchInput');
  var btn = document.getElementById('searchBtn');
  var sug = document.getElementById('searchSuggestions');
  var ai  = -1;

  function hl(t,q){
    var esc=q.replace(/[.*+?^$\x7B\x7D()|[\]\\]/g,'\\$&');
    return t.replace(new RegExp('('+esc+')','gi'),'<em>$1</em>');
  }
  function hide(){ sug.classList.remove('show'); sug.innerHTML=''; ai=-1; }

  inp.addEventListener('input', function(){
    var val = inp.value.trim().toLowerCase(); ai=-1;
    if (!val) { hide(); return; }
    var matches = _db.filter(function(v){ return v.title.toLowerCase().indexOf(val)!==-1; }).slice(0,7);
    if (!matches.length) {
      sug.innerHTML='<div class="suggestion-empty">No results for "<b>'+val+'</b>"</div>';
      sug.classList.add('show'); return;
    }
    sug.innerHTML = matches.map(function(v){
      return '<div class="suggestion-item" data-slug="'+v.slug+'">' +
        '<img src="https://img.youtube.com/vi/'+v.youtubeId+'/mqdefault.jpg" loading="lazy" alt=""/>' +
        '<span>'+hl(v.title,val)+'</span></div>';
    }).join('');
    sug.classList.add('show');
    sug.querySelectorAll('.suggestion-item').forEach(function(el){
      el.addEventListener('mousedown', function(e){
        e.preventDefault();
        window.location.href = '${BASE_URL}/video/' + el.dataset.slug + '/';
      });
    });
  });

  inp.addEventListener('keydown', function(e){
    var items = sug.querySelectorAll('.suggestion-item');
    if (e.key==='ArrowDown'){ e.preventDefault(); ai=Math.min(ai+1,items.length-1); upA(items); }
    else if (e.key==='ArrowUp'){ e.preventDefault(); ai=Math.max(ai-1,-1); upA(items); }
    else if (e.key==='Enter'){
      if (ai>=0&&items[ai]) { window.location.href='${BASE_URL}/video/'+items[ai].dataset.slug+'/'; }
      else { var q=inp.value.trim(); if(q) window.location.href='${BASE_URL}/?search='+encodeURIComponent(q); }
    }
    else if (e.key==='Escape'){ hide(); inp.blur(); }
  });

  function upA(items){ items.forEach(function(el,i){ el.classList.toggle('active',i===ai); }); }
  btn.addEventListener('click', function(){ var q=inp.value.trim(); if(q) window.location.href='${BASE_URL}/?search='+encodeURIComponent(q); });
  document.addEventListener('click', function(e){ if(!e.target.closest('.search-wrapper')) hide(); });
})();

// ── Infinite scroll slider ───────────────────────────────────────
var _loaded = 8;
document.getElementById('rec-slider').addEventListener('scroll', function(){
  if (this.scrollLeft + this.clientWidth >= this.scrollWidth - 120) {
    var next = _db.slice(_loaded, _loaded+8);
    if (!next.length) { _loaded=0; next=_db.slice(0,8); }
    next.forEach(function(r){
      var a = document.createElement('a');
      a.className='slider-item';
      a.href='${BASE_URL}/video/'+r.slug+'/';
      a.style.cssText='text-decoration:none;color:inherit;display:block';
      a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
      document.getElementById('rec-slider').appendChild(a);
    });
    _loaded += next.length;
  }
});
</script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  HOMEPAGE STATIS
// ════════════════════════════════════════════════════════════════
function buildHomepage(dbEN) {
  const featured = shuffle(dbEN).slice(0, HOMEPAGE_CARDS);

  let html = fs.readFileSync(BASE_TMPL, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const APP_START = '  <div class="main-content" id="app">';
  // APP_END disesuaikan dengan index_base.html baru yang ada <main> landmark
  const APP_END   = '  </div>\n  </main>\n\n<script>';
  const startIdx  = html.indexOf(APP_START);
  let   endIdx    = html.indexOf(APP_END);

  // Fallback pola lama tanpa </main> jika template belum diupdate
  if (endIdx === -1) {
    const APP_END_OLD = '  </div>\n\n<script>';
    endIdx = html.indexOf(APP_END_OLD);
  }
  if (startIdx === -1 || endIdx === -1) {
    console.error('❌ Tidak bisa menemukan #app block di template! Cek index_base.html');
    process.exit(1);
  }

  function cardHtml(v, idx) {
    const loading = idx < 4 ? 'eager' : 'lazy';
    const fp      = idx < 4 ? ' fetchpriority="high"' : '';
    return `<a href="/video/${v.slug}/" class="video-card-link" style="text-decoration:none;color:inherit">
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

  const cardsHtml      = featured.map((v,i) => cardHtml(v,i)).join('\n');
  const hardcodedSlugs = JSON.stringify(featured.map(v => v.slug));

  const newApp = `${APP_START}
    <h5 style="color:#98FB98;margin-bottom:12px">🔥 TRENDING VIDEO</h5>
    <div class="video-grid" id="video-grid-inner">
${cardsHtml}
    </div>
    <div class="load-more-wrap"><button class="btn-load-more" id="btn-load-more" onclick="loadMore()">Load More</button></div>
  </div>\n  </main>\n\n<script>`;

  html = html.slice(0, startIdx) + newApp + html.slice(endIdx + APP_END.length);

  const patchScript = `
// ══════════════════════════════════════════════════════════════
//  PATCH homepage statis v7
// ══════════════════════════════════════════════════════════════

// FIX #5: db-id.json tetap di-fetch agar muncul di grid & load more
async function loadDatabases() {
  const ROOT = location.origin + '/';
  // Fetch paralel — db-id.json tetap dimuat untuk ditampilkan di homepage
  const [resEN, resID] = await Promise.all([
    fetch(ROOT + 'db-en.json'),
    fetch(ROOT + 'db-id.json').catch(()=>({ok:false}))
  ]);
  videoDatabaseEN  = (await resEN.json()).map(v=>({...v,source:v.source||'seo'}));
  videoDatabaseID  = resID.ok ? (await resID.json()).map(v=>({...v,source:v.source||'nofollow'})) : [];
  // Shuffle campuran EN+ID — EN & ID berbaur di homepage
  videoDatabaseALL = [...videoDatabaseEN,...videoDatabaseID].sort(()=>0.5-Math.random());
  // Load more mulai dari video yang belum tampil di 20 card hardcoded
  const shown = new Set(${hardcodedSlugs});
  currentData = videoDatabaseALL.filter(v=>!shown.has(v.slug));
  currentPage = 1;
}

// FIX #2 & #3: router dengan tombol HOME + hasil search tidak terputus
async function router() {
  const app    = document.getElementById('app');
  const navbar = document.getElementById('main-navbar');
  const slug   = getCurrentSlug();
  const tag    = getUrlParams().get('tag');
  const search = getUrlParams().get('search');

  updateHtmlLang();
  updateRobotsBySource('seo');

  if (tag) {
    navbar.classList.remove('video-mode');
    if (!videoDatabaseALL.length) await loadDatabases();
    // Relevan di atas, sisanya (tidak relevan) tetap muncul di bawah
    const rel   = videoDatabaseALL.filter(v=>v.tags&&v.tags.some(t=>t.toLowerCase()===tag.toLowerCase()));
    const rest  = videoDatabaseALL.filter(v=>!v.tags||!v.tags.some(t=>t.toLowerCase()===tag.toLowerCase()));
    const combined = rel.length ? [...rel, ...rest] : videoDatabaseALL;
    renderGrid(app, combined);
    updateCanonical('home','seo');
    // FIX #2: Tambahkan tombol HOME di bawah heading
    const h = app.querySelector('h5');
    if (h) {
      h.textContent = rel.length ? '🏷️ Tag: #'+tag+' ('+rel.length+' videos)' : '🔥 TRENDING VIDEO';
      if (!document.getElementById('btn-back-home')) {
        var btn = document.createElement('button');
        btn.id='btn-back-home';
        btn.onclick=function(){ history.pushState({},'',location.origin+'/'); router(); };
        btn.style.cssText='background:transparent;color:var(--green);border:1px solid var(--green);padding:4px 12px;border-radius:14px;font-weight:700;font-size:.75rem;cursor:pointer;margin-bottom:10px;display:inline-flex;align-items:center;gap:5px;line-height:1';
        btn.innerHTML='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> HOME';
        h.parentNode.insertBefore(btn, h);
      }
    }
  } else if (search) {
    navbar.classList.remove('video-mode');
    if (!videoDatabaseALL.length) await loadDatabases();
    const q   = search.toLowerCase();
    // Relevan di atas, sisanya tetap muncul di bawah
    const rel  = videoDatabaseALL.filter(v=>v.title.toLowerCase().indexOf(q)!==-1);
    const rest = videoDatabaseALL.filter(v=>v.title.toLowerCase().indexOf(q)===-1);
    const combined = rel.length ? [...rel, ...rest] : videoDatabaseALL;
    renderGrid(app, combined);
    updateCanonical('home','seo');
    // FIX #2: Tambahkan tombol HOME
    const h = app.querySelector('h5');
    if (h) {
      h.textContent = rel.length ? '🔍 "'+search+'" — '+rel.length+' hasil' : '🔥 TRENDING VIDEO';
      if (!document.getElementById('btn-back-home')) {
        var btn = document.createElement('button');
        btn.id='btn-back-home';
        btn.onclick=function(){ history.pushState({},'',location.origin+'/'); router(); };
        btn.style.cssText='background:transparent;color:var(--green);border:1px solid var(--green);padding:4px 12px;border-radius:14px;font-weight:700;font-size:.75rem;cursor:pointer;margin-bottom:10px;display:inline-flex;align-items:center;gap:5px;line-height:1';
        btn.innerHTML='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> HOME';
        h.parentNode.insertBefore(btn, h);
      }
    }
  } else if (!slug || slug==='home') {
    // Homepage normal — hapus tombol HOME kalau ada
    var oldBtn = document.getElementById('btn-back-home');
    if (oldBtn) oldBtn.remove();
    navbar.classList.remove('video-mode');
    
    // PENYEMBUH 1: Panggil ulang grid video agar layar tidak nyangkut
    if(!videoDatabaseALL.length) await loadDatabases();
    renderGrid(app, videoDatabaseALL);
    
    updateCanonical('home','seo');
  } else {
    // Cek dulu apakah ini video nofollow dari db-id.json
    const video = videoDatabaseALL.find(v => v.slug === slug);
    
    if (video && video.source === 'nofollow') {
      // Render via SPA untuk db-id.json (tidak ada file fisik statis)
      navbar.classList.add('video-mode');
      renderVideo(app, video);
    } else {
      // Jika dari db-en.json, tetap redirect ke halaman statis SEO
      window.location.replace('/video/' + slug + '/');
    }
    return;
  }
  window.scrollTo(0,0);
}
// ── END PATCH ───────────────────────────────────────────────────
`;

  html = html.replace('</script>\n</body>', patchScript + '</script>\n</body>');
  return html;
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════
function main() {
  if (!fs.existsSync(DB_FILE_EN)) { console.error('❌ db-en.json tidak ditemukan!'); process.exit(1); }

  if (!fs.existsSync(BASE_TMPL)) {
    if (!fs.existsSync(INDEX_FILE)) { console.error('❌ index.html dan index_base.html keduanya tidak ada!'); process.exit(1); }
    console.log('⚠️  index_base.html tidak ada → membuat dari index.html saat ini...');
    fs.copyFileSync(INDEX_FILE, BASE_TMPL);
    console.log('✅ index_base.html dibuat otomatis dari index.html');
  }

  // Hanya db-en.json yang di-generate jadi halaman statis
  const rawEN = JSON.parse(fs.readFileSync(DB_FILE_EN,'utf8'));
  const dbEN  = rawEN.filter(v=>v.slug&&v.youtubeId&&v.title);
  console.log(`📦 db-en.json: ${rawEN.length} total → ${dbEN.length} valid`);
  if (fs.existsSync(DB_FILE_ID)) {
    const rawID = JSON.parse(fs.readFileSync(DB_FILE_ID,'utf8'));
    console.log(`📦 db-id.json: ${rawID.length} video (noindex — tidak di-generate, hanya tampil di homepage)`);
  }

  console.log('🗑️  Hapus /video/ lama...');
  rmDir(VIDEO_DIR);
  fs.mkdirSync(VIDEO_DIR,{recursive:true});

  console.log('📄 Generate halaman statis dari db-en.json...');
  let created = 0;
  dbEN.forEach(v=>{
    const dir = path.join(VIDEO_DIR, v.slug);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), buildVideoPage(v,dbEN), 'utf8');
    created++;
    if (created%50===0) console.log(`  ✅ ${created}/${dbEN.length}`);
  });
  console.log(`✅ ${created} halaman video selesai`);

  console.log('🏠 Update index.html dari index_base.html...');
  const newIndex = buildHomepage(dbEN);
  fs.writeFileSync(INDEX_FILE, newIndex, 'utf8');
  console.log('✅ index.html diperbarui dengan 20 card random hardcoded');

  console.log(`\n🎉 Selesai! ${created} halaman statis (db-en) + homepage (EN+ID berbaur)`);
}

main();
