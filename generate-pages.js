// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  v11 (Perfect Integration with SPA index_base)
//  Fixes & improvements:
//    1. Native Banner di desktop: NB1 di ATAS related video
//    2. Mobile: NB1 bawah tombol, NB2 bawah summary
//    3. Footer kategori SEO rapi (6 kategori, dari db-en.json)
//    4. Kategori Router disisipkan langsung ke script bawaan user
//    5. Load More 100% Fix (karena menggunakan renderGrid bawaan)
//    6. Footer di homepage DIHILANGKAN sepenuhnya.
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
const CATEGORY_DIR = path.join(__dirname, 'category');
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
//  KONFIGURASI ADS — HALAMAN STATIS (/video/slug/)
// ════════════════════════════════════════════════════════════════
const STATIC_AD = {
  allAds: true,
  useDirect:  true,
  directUrl:  'https://facebook.com',
  usePlayAds:       true,
  playAdsUrl:       'https://facebook.com',
  playAdsStartFrom: 2,

  useNativeBanner1: true,
  nativeBanner1HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#c00,#e00,#f52);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-shrink:0;color:#ffdd00;font-size:11px;font-weight:800;line-height:1.2">CONTOH<br>IKLAN</div><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">IKLAN NATIVE BANNER 1</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan native 1 Anda di sini</div></div><div style="flex-shrink:0;background:#ffdd00;color:#c00;font-size:11px;font-weight:900;padding:6px 10px;border-radius:6px;text-transform:uppercase">PELAJARI</div></div>`,

  useNativeBanner2: true,
  nativeBanner2HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#003580,#0057d8,#1a8cff);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-shrink:0;color:#ffdd00;font-size:11px;font-weight:800;line-height:1.2">CONTOH<br>IKLAN</div><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">IKLAN NATIVE BANNER 2</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan native 2 Anda di sini</div></div><div style="flex-shrink:0;background:#ffdd00;color:#003580;font-size:11px;font-weight:900;padding:6px 10px;border-radius:6px;text-transform:uppercase">PELAJARI</div></div>`,
};

const FOOTER_CATEGORIES = [
  { key: 'AI_ML_RESEARCH',    label: 'AI & ML Research',  icon: '✨', tag: 'ai-research'  },
  { key: 'TUTORIAL_HOWTO',    label: 'Tutorial & How-To', icon: '💻', tag: 'tutorial'      },
  { key: 'TECH_REVIEW',       label: 'Tech Review',       icon: '📊', tag: 'tech-review'   },
  { key: 'FINANCE_CRYPTO',    label: 'Finance & Crypto',  icon: '💰', tag: 'finance'       },
  { key: 'SCIENCE_EXPLAINER', label: 'Science Explainer', icon: '🔬', tag: 'science'       },
  { key: 'BUSINESS_STRATEGY', label: 'Business Strategy', icon: '📈', tag: 'business'      },
];

// ════════════════════════════════════════════════════════════════
//  HALAMAN VIDEO STATIS — DESKTOP 2-KOLOM
// ════════════════════════════════════════════════════════════════
function buildVideoPage(v, allVideos) {
  const canonical  = `${BASE_URL}/video/${v.slug}/`;
  const thumb      = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const thumbOg    = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const desc       = trunc(v.summary||DESC_DEF, 160);
  const uploadDate = v.uploadDate||new Date().toISOString();
  const tags       = v.tags||[];
  const related    = shuffle(allVideos.filter(r=>r.slug!==v.slug)).slice(0,30);

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

  const mobileRelatedHtml = related.slice(0,8).map(r=>`
    <a href="${BASE_URL}/video/${r.slug}/" class="slider-item" style="text-decoration:none;color:inherit;display:block">
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="160" height="90"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  const sideRelatedHtml = related.slice(0,20).map(r=>`
    <a href="${BASE_URL}/video/${r.slug}/" class="side-slider-item">
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="108" height="60"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:108px;height:60px;object-fit:cover;flex-shrink:0"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  const sliderDataJson = JSON.stringify(
    allVideos.filter(r=>r.slug!==v.slug).map(r=>({slug:r.slug,youtubeId:r.youtubeId,title:r.title}))
  );

  function makeBanner(uid, htmlContent) {
    return `<div class="native-banner-wrap" id="nb-${uid}">` +
      `<div class="close-btn" onclick="this.closest('.native-banner-wrap').style.display='none'">✕</div>` +
      `<div class="native-banner-inner">${htmlContent}</div>` +
      `</div>`;
  }

  const nb1Mobile  = STATIC_AD.allAds && STATIC_AD.useNativeBanner1 ? makeBanner('1m', STATIC_AD.nativeBanner1HTML) : '';
  const nb2Mobile  = STATIC_AD.allAds && STATIC_AD.useNativeBanner2 ? makeBanner('2m', STATIC_AD.nativeBanner2HTML) : '';
  const nb1Desktop = STATIC_AD.allAds && STATIC_AD.useNativeBanner1 ? makeBanner('1d', STATIC_AD.nativeBanner1HTML) : '';
  const nb2Desktop = STATIC_AD.allAds && STATIC_AD.useNativeBanner2 ? makeBanner('2d', STATIC_AD.nativeBanner2HTML) : '';

  const footerCatHtml = FOOTER_CATEGORIES.map(cat =>
    `<a href="${BASE_URL}/category/${cat.key.toLowerCase().replace(/_/g,'-')}/" class="footer-cat-link">` +
    `<span>${cat.icon}</span><span>${cat.label}</span></a>`
  ).join('');

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
  <script type="application/ld+json">${jsonLd}<\/script>
  ${v.faqSchema ? `<script type="application/ld+json">${JSON.stringify(v.faqSchema).replace(/<\/script>/gi,'<\\/script>')}<\/script>` : ''}
  <link rel="preload" as="image" href="${thumb}" fetchpriority="high"/>
  <link rel="preconnect" href="https://img.youtube.com"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--green:#98FB98;--red:#ff032d;--dark:#1a1a1a;--nav-h:52px}
    body{background:#212122;color:#f1f1f1;font-family:'Segoe UI',sans-serif;overflow-x:hidden}
    html,body{overflow-x:hidden;max-width:100%}

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

    /* ── Wrapper utama ── */
    .video-page-container{width:100%;max-width:800px;margin:0 auto;padding:15px}
    @media(max-width:600px){.video-page-container{padding:0}}

    /* ═══════════════════════════════════════════════
       DESKTOP 2-KOLOM (≥992px)
    ═══════════════════════════════════════════════ */
    @media(min-width:992px){
      .video-page-container{max-width:1100px}
      .video-desktop-layout{display:flex;gap:20px;align-items:flex-start}
      .video-main-col{flex:1 1 0;min-width:0}

      /* Sidebar kanan — sticky, flex column */
      .video-side-col{
        width:280px;flex-shrink:0;
        position:sticky;top:calc(var(--nav-h) + 10px);
        display:flex;flex-direction:column;gap:0;
      }

      /* Label related */
      .side-related-label{
        color:var(--green);font-size:.8rem;font-weight:700;
        letter-spacing:.05em;text-transform:uppercase;
        padding:8px 0 8px;flex-shrink:0;
      }

      /* Daftar related video — scrollable */
      .side-slider{
        display:flex;flex-direction:column;gap:8px;
        max-height:calc(100vh - var(--nav-h) - 300px);
        overflow-y:auto;scrollbar-width:none;flex-shrink:0;
      }
      .side-slider::-webkit-scrollbar{display:none}

      .side-slider-item{
        display:flex;gap:8px;background:var(--dark);border-radius:8px;
        overflow:hidden;cursor:pointer;text-decoration:none;color:inherit;
        border:1px solid transparent;transition:.2s;flex-shrink:0;
      }
      .side-slider-item:hover{border-color:var(--green)}
      .side-slider-item img{width:108px;height:60px;object-fit:cover;flex-shrink:0}
      .side-slider-item p{
        font-size:.72rem;padding:6px 8px;margin:0;line-height:1.35;
        display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;
        overflow:hidden;color:#f1f1f1;
      }

      /* Native banner di sidebar — full width */
      .side-nb-block{width:100%;flex-shrink:0;margin:8px 0}
      .side-nb-block .native-banner-wrap{margin:0;border-radius:10px}

      /* Sembunyikan elemen mobile-only */
      .nb-mobile-only{display:none}
      .recommendation-slider-wrap{display:none}
    }

    /* Mobile: sembunyikan kolom kanan */
    @media(max-width:991px){
      .video-desktop-layout{display:block}
      .video-side-col{display:none}
    }

    /* ── Player ── */
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

    /* ── Info section ── */
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

    /* ── Mobile horizontal slider ── */
    .recommendation-slider{display:flex;overflow-x:auto;gap:10px;padding-bottom:8px;scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
    .recommendation-slider::-webkit-scrollbar{display:none}
    .slider-item{min-width:160px;max-width:160px;background:var(--dark);border-radius:8px;overflow:hidden;cursor:pointer;flex-shrink:0;transition:.2s;border:1px solid transparent;text-decoration:none;color:inherit;display:block}
    .slider-item:hover{border-color:var(--green);transform:translateY(-2px)}
    .slider-item img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
    .slider-item p{font-size:.72rem;padding:6px 8px 8px;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35;min-height:42px;color:#f1f1f1}

    /* ── Native Banner ── */
    .native-banner-wrap{position:relative;width:100%;margin:10px 0;border-radius:10px;overflow:hidden;min-height:90px}
    .native-banner-wrap .close-btn{position:absolute;top:6px;right:6px;width:26px;height:26px;background:rgba(0,0,0,.65);color:#fff;border:2px solid #fff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;cursor:pointer;z-index:10}
    .native-banner-inner{width:100%;min-height:90px;display:flex;flex-direction:column;justify-content:center}

    /* ── Footer SEO ── */
    .footer-seo{margin-top:60px;padding:24px 16px 28px;background:#0d0d0d;border-top:1px solid #1e1e1e}
    .footer-seo-title{color:#555;font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;text-align:center;margin-bottom:14px}
    .footer-cat-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:18px}
    .footer-cat-link{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border:1px solid #2a2a2a;border-radius:20px;text-decoration:none;color:#888;font-size:11px;font-weight:600;background:#111;transition:.2s;white-space:nowrap}
    .footer-cat-link:hover{color:var(--green);border-color:#3a3a3a;background:#161616}
    .footer-copy{color:#333;font-size:10px;text-align:center;letter-spacing:.5px}
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
  <div class="video-desktop-layout">

    <!-- ═════════════════════════════════════════
         KOLOM KIRI: player + info
    ════════════════════════════════════════════ -->
    <div class="video-main-col">
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

        <!-- Native Banner 1 — MOBILE ONLY -->
        <div class="nb-mobile-only">${nb1Mobile}</div>

        <div class="summary-box">
          <div class="summary-text">${v.summary||'<p>'+esc(desc)+'</p>'}</div>
          ${tagsHtml}
        </div>

        <!-- Native Banner 2 — MOBILE ONLY (di bawah summary) -->
        <div class="nb-mobile-only">${nb2Mobile}</div>

        <!-- Mobile horizontal slider -->
        <div class="recommendation-slider-wrap">
          <p class="more-videos-label">MORE VIDEOS</p>
          <div class="recommendation-slider" id="rec-slider">${mobileRelatedHtml}</div>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════
         KOLOM KANAN DESKTOP
         Urutan: NB1 → Label → Related → NB2
    ════════════════════════════════════════════ -->
    <div class="video-side-col">

      <!-- NB1: di ATAS related video -->
      ${nb1Desktop ? `<div class="side-nb-block">${nb1Desktop}</div>` : ''}

      <!-- Label -->
      <div class="side-related-label">🎬 Related Videos</div>

      <!-- Daftar related video -->
      <div class="side-slider" id="side-slider-desktop">${sideRelatedHtml}</div>

      <!-- NB2: di BAWAH related video -->
      ${nb2Desktop ? `<div class="side-nb-block">${nb2Desktop}</div>` : ''}

    </div>

  </div><!-- end video-desktop-layout -->
</div>
</main>

<!-- ══════════════════════════════════════════════
     FOOTER SEO KATEGORI
     Sumber: db-en.json (HANYA)
════════════════════════════════════════════════ -->
<footer class="footer-seo">
  <p class="footer-seo-title">Jelajahi Kategori</p>
  <nav class="footer-cat-grid" aria-label="Kategori konten">
    ${footerCatHtml}
  </nav>
  <p class="footer-copy">© 2026 Trend4GenZ. All rights reserved.</p>
</footer>

<script>
// ── Ads config (injected at build time) ────────────────────────
var STATIC_AD = {
  allAds:          ${STATIC_AD.allAds},
  useDirect:       ${STATIC_AD.useDirect},
  directUrl:       '${STATIC_AD.directUrl}',
  usePlayAds:      ${STATIC_AD.usePlayAds},
  playAdsUrl:      '${STATIC_AD.playAdsUrl}',
  playAdsStartFrom:${STATIC_AD.playAdsStartFrom},
  useNativeBanner1:${STATIC_AD.useNativeBanner1},
  useNativeBanner2:${STATIC_AD.useNativeBanner2}
};
var _playCount = 0;

function handleMoreInfo() {
  if (STATIC_AD.allAds && STATIC_AD.useDirect) window.open(STATIC_AD.directUrl,'_blank');
}

function startPlay() {
  _playCount++;
  if (STATIC_AD.allAds && STATIC_AD.usePlayAds && _playCount >= STATIC_AD.playAdsStartFrom) {
    window.open(STATIC_AD.playAdsUrl,'_blank');
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

// ── Search ───────────────────────────────────────────────────────
var _db = ${sliderDataJson};
(function(){
  var inp=document.getElementById('searchInput'),
      btn=document.getElementById('searchBtn'),
      sug=document.getElementById('searchSuggestions'),
      ai=-1;
  function hl(t,q){
    var e=q.replace(/[.*+?^$\x7B\x7D()|[\]\\]/g,'\\$&');
    return t.replace(new RegExp('('+e+')','gi'),'<em>$1</em>');
  }
  function hide(){sug.classList.remove('show');sug.innerHTML='';ai=-1;}
  inp.addEventListener('input',function(){
    var val=inp.value.trim().toLowerCase();ai=-1;
    if(!val){hide();return;}
    var m=_db.filter(function(v){return v.title.toLowerCase().indexOf(val)!==-1;}).slice(0,7);
    if(!m.length){sug.innerHTML='<div class="suggestion-empty">No results for "<b>'+val+'</b>"</div>';sug.classList.add('show');return;}
    sug.innerHTML=m.map(function(v){
      return '<div class="suggestion-item" data-slug="'+v.slug+'">'+
        '<img src="https://img.youtube.com/vi/'+v.youtubeId+'/mqdefault.jpg" loading="lazy" alt=""/>'+
        '<span>'+hl(v.title,val)+'</span></div>';
    }).join('');
    sug.classList.add('show');
    sug.querySelectorAll('.suggestion-item').forEach(function(el){
      el.addEventListener('mousedown',function(e){e.preventDefault();window.location.href='${BASE_URL}/video/'+el.dataset.slug+'/';});
    });
  });
  inp.addEventListener('keydown',function(e){
    var items=sug.querySelectorAll('.suggestion-item');
    if(e.key==='ArrowDown'){e.preventDefault();ai=Math.min(ai+1,items.length-1);upA(items);}
    else if(e.key==='ArrowUp'){e.preventDefault();ai=Math.max(ai-1,-1);upA(items);}
    else if(e.key==='Enter'){
      if(ai>=0&&items[ai])window.location.href='${BASE_URL}/video/'+items[ai].dataset.slug+'/';
      else{var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);}
    }else if(e.key==='Escape'){hide();inp.blur();}
  });
  function upA(items){items.forEach(function(el,i){el.classList.toggle('active',i===ai);});}
  btn.addEventListener('click',function(){var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);});
  document.addEventListener('click',function(e){if(!e.target.closest('.search-wrapper'))hide();});
})();

// ── Infinite scroll: mobile ──────────────────────────────────────
var _loaded=8;
document.getElementById('rec-slider').addEventListener('scroll',function(){
  if(this.scrollLeft+this.clientWidth>=this.scrollWidth-120){
    var next=_db.slice(_loaded,_loaded+8);
    if(!next.length){_loaded=0;next=_db.slice(0,8);}
    next.forEach(function(r){
      var a=document.createElement('a');
      a.className='slider-item';a.href='${BASE_URL}/video/'+r.slug+'/';
      a.style.cssText='text-decoration:none;color:inherit;display:block';
      a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
      document.getElementById('rec-slider').appendChild(a);
    });
    _loaded+=next.length;
  }
});

// ── Infinite scroll: desktop sidebar ────────────────────────────
(function(){
  var side=document.getElementById('side-slider-desktop');
  if(!side)return;
  var sideLoaded=20;
  side.addEventListener('scroll',function(){
    if(this.scrollTop+this.clientHeight>=this.scrollHeight-100){
      var next=_db.slice(sideLoaded,sideLoaded+10);
      if(!next.length){sideLoaded=0;next=_db.slice(0,10);}
      next.forEach(function(r){
        var a=document.createElement('a');
        a.className='side-slider-item';a.href='${BASE_URL}/video/'+r.slug+'/';
        a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="108" height="60" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:108px;height:60px;object-fit:cover;flex-shrink:0"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
        side.appendChild(a);
      });
      sideLoaded+=next.length;
    }
  });
})();
<\/script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  HOMEPAGE STATIS
// ════════════════════════════════════════════════════════════════
function buildHomepage(dbEN) {
  const featured = shuffle(dbEN).slice(0, HOMEPAGE_CARDS);
  let html = fs.readFileSync(BASE_TMPL, 'utf8');

  // 1. INJECT STATIC CARDS KE DALAM <div class="main-content" id="app">
  const cardsHtml = featured.map((v, i) => {
    const loading = i < 4 ? 'eager' : 'lazy';
    const fp      = i < 4 ? ' fetchpriority="high"' : '';
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
  }).join('\n');

  const staticGrid = `<h5 style="color:#98FB98;margin-bottom:12px">🔥 TRENDING VIDEO</h5>
<div class="video-grid" id="video-grid-inner">\n${cardsHtml}\n</div>
<div class="load-more-wrap"><button class="btn-load-more" id="btn-load-more" onclick="loadMore()">Load More</button></div>`;

  // Ganti isi dari #app dengan grid static
  html = html.replace(/<div class="main-content" id="app">([\s\S]*?)<\/div>\s*<\/main>/i, 
    `<div class="main-content" id="app">\n${staticGrid}\n</div>\n  </main>`
  );


  // 2. SISIPKAN LOGIKA KATEGORI LANGSUNG KE DALAM SCRIPT ASLI INDEX_BASE
  // Agar tidak bentrok, kita string replace kode asli di dalam router()

  // a. Ambil parameter URL category
  html = html.replace(/const tag\s*=\s*getUrlParams\(\)\.get\('tag'\);/g, 
    "const tag   = getUrlParams().get('tag');\n  const category = getUrlParams().get('category');"
  );

  // b. Override "if(tag)" bawaan index_base.html dengan logika kategori terlebih dahulu
  const categoryLogic = `if(category) {
    navbar.classList.remove('video-mode');
    if(!videoDatabaseALL.length) await loadDatabases();
    
    const catKey = category.toUpperCase().replace(/[-_\\s]+/g, ' ');
    const rel = videoDatabaseEN.filter(v => {
      if (!v) return false;
      let c = (v.category || '').toUpperCase().replace(/[-_\\s]+/g, ' ');
      if (c === catKey) return true;
      let tgs = (v.tags || []).map(t => typeof t === 'string' ? t.toUpperCase() : '');
      let keywords = catKey.split(' '); 
      return keywords.some(kw => c.includes(kw) || tgs.some(t => t.includes(kw)));
    });
    
    renderGrid(app, rel); // Panggil renderGrid bawaan index_base, Load More akan otomatis work!
    updateCanonical('home','seo');
    _insertHomeBtn(app, '📁 Kategori: ' + category.replace(/[-_]/g, ' ').toUpperCase() + ' (' + rel.length + ' video)');
  } else if(tag) {`;

  html = html.replace(/if\s*\(\s*tag\s*\)\s*\{/, categoryLogic);

  // (Catatan: Footer TIDAK ditambahkan ke html di sini sesuai instruksi agar homepage bersih)

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
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), buildVideoPage(v,dbEN), 'utf8');
    created++;
    if (created%50===0) console.log(`  ✅ ${created}/${dbEN.length}`);
  });
  console.log(`✅ ${created} halaman video statis selesai`);

  console.log('🏠 Update index.html dari index_base.html...');
  const newIndex = buildHomepage(dbEN);
  fs.writeFileSync(INDEX_FILE, newIndex, 'utf8');
  console.log('✅ index.html diperbarui (Homepage Tanpa Footer)');

  // --- PEMBUAT FOLDER KATEGORI SEO STATIS ---
  console.log('📂 Generate folder kategori statis...');
  rmDir(CATEGORY_DIR); 
  fs.mkdirSync(CATEGORY_DIR, { recursive: true });

  FOOTER_CATEGORIES.forEach(cat => {
    const catSlug = cat.key.toLowerCase().replace(/_/g, '-');
    const dirPath = path.join(CATEGORY_DIR, catSlug);
    fs.mkdirSync(dirPath, { recursive: true });

    // HTML Statis yang otomatis redirect / memanggil router category yang telah kita patch di atas
    const catHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Kategori: ${cat.label} | ${SITE_NAME}</title>
  <meta name="robots" content="index, follow">
  <meta http-equiv="refresh" content="0; url=${BASE_URL}/?category=${cat.key}">
  <script>window.location.replace("${BASE_URL}/?category=${cat.key}");</script>
</head>
<body style="background:#212122; color:#fff; text-align:center; padding-top:20vh; font-family:'Segoe UI', sans-serif;">
  <h2>${cat.icon} Membuka Kategori ${cat.label}...</h2>
  <p>Jika tidak dialihkan secara otomatis, <a href="${BASE_URL}/?category=${cat.key}" style="color:#98FB98;">klik di sini</a>.</p>
</body>
</html>`;

    fs.writeFileSync(path.join(dirPath, 'index.html'), catHtml, 'utf8');
  });
  console.log(`✅ ${FOOTER_CATEGORIES.length} folder kategori berhasil dibuat`);
  
  console.log(`\n🎉 Selesai! ${created} halaman video (db-en) + homepage statis`);
}

main();
