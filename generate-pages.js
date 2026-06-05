// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  v9
//  Fixes & improvements:
//    1. Native Banner di desktop: NB1 di ATAS related video
//    2. Tidak ada duplikat — NB1 & NB2 terpisah dengan switch sendiri
//    3. Mobile: NB1 bawah tombol, NB2 bawah summary
//    4. Footer kategori SEO rapi (6 kategori, dari db-en.json)
//    5. Container NB sidebar full-width & seimbang
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
//  KONFIGURASI ADS — HALAMAN STATIS (/video/slug/)
//  ─────────────────────────────────────────────────────────────
//  Setelah edit, jalankan ulang: node generate-pages.js
// ════════════════════════════════════════════════════════════════
const STATIC_AD = {

  // ── Master switch — false = semua ads mati ────────────────────
  allAds: true,

  // ── Direct Link (tombol More Info 🔥) ─────────────────────────
  useDirect:  true,
  directUrl:  'https://facebook.com',

  // ── Play Button Ads ───────────────────────────────────────────
  usePlayAds:       true,
  playAdsUrl:       'https://facebook.com',
  playAdsStartFrom: 2,           // mulai buka ads dari tap ke-N

  // ════════════════════════════════════════════════════════════
  //  NATIVE BANNER 1
  //  Desktop : tampil di ATAS list related video (sidebar kanan)
  //  Mobile  : tampil di bawah tombol HOME / More Info
  // ════════════════════════════════════════════════════════════
  useNativeBanner1: true,
  nativeBanner1HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#c00,#e00,#f52);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-shrink:0;color:#ffdd00;font-size:11px;font-weight:800;line-height:1.2">CONTOH<br>IKLAN</div><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">IKLAN NATIVE BANNER 1</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan native 1 Anda di sini</div></div><div style="flex-shrink:0;background:#ffdd00;color:#c00;font-size:11px;font-weight:900;padding:6px 10px;border-radius:6px;text-transform:uppercase">PELAJARI</div></div>`,

  // ════════════════════════════════════════════════════════════
  //  NATIVE BANNER 2
  //  Desktop : tampil di BAWAH list related video (sidebar kanan)
  //  Mobile  : tampil di bawah summary box
  // ════════════════════════════════════════════════════════════
  useNativeBanner2: true,
  nativeBanner2HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#003580,#0057d8,#1a8cff);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-shrink:0;color:#ffdd00;font-size:11px;font-weight:800;line-height:1.2">CONTOH<br>IKLAN</div><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">IKLAN NATIVE BANNER 2</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan native 2 Anda di sini</div></div><div style="flex-shrink:0;background:#ffdd00;color:#003580;font-size:11px;font-weight:900;padding:6px 10px;border-radius:6px;text-transform:uppercase">PELAJARI</div></div>`,
};

// ════════════════════════════════════════════════════════════════
//  KONFIGURASI KATEGORI FOOTER SEO
//  Thumbnail diambil dari db-en.json berdasarkan tag
// ════════════════════════════════════════════════════════════════
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

  // Mobile horizontal slider
  const mobileRelatedHtml = related.slice(0,8).map(r=>`
    <a href="${BASE_URL}/video/${r.slug}/" class="slider-item" style="text-decoration:none;color:inherit;display:block">
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="160" height="90"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  // Desktop sidebar related (20 awal)
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

  // ── Buat blok native banner (dengan ID unik agar close tidak konflik) ──
  function makeBanner(uid, htmlContent) {
    return `<div class="native-banner-wrap" id="nb-${uid}">` +
      `<div class="close-btn" onclick="this.closest('.native-banner-wrap').style.display='none'">✕</div>` +
      `<div class="native-banner-inner">${htmlContent}</div>` +
      `</div>`;
  }

  // Buat 4 instance terpisah — mobile x2, desktop x2 — tanpa duplikat
  const nb1Mobile  = STATIC_AD.allAds && STATIC_AD.useNativeBanner1 ? makeBanner('1m', STATIC_AD.nativeBanner1HTML) : '';
  const nb2Mobile  = STATIC_AD.allAds && STATIC_AD.useNativeBanner2 ? makeBanner('2m', STATIC_AD.nativeBanner2HTML) : '';
  const nb1Desktop = STATIC_AD.allAds && STATIC_AD.useNativeBanner1 ? makeBanner('1d', STATIC_AD.nativeBanner1HTML) : '';
  const nb2Desktop = STATIC_AD.allAds && STATIC_AD.useNativeBanner2 ? makeBanner('2d', STATIC_AD.nativeBanner2HTML) : '';

  // ── Footer kategori untuk halaman video ──
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
//  HOMEPAGE STATIS  v10
//  - Tidak ada footer kategori di homepage
//  - loadMore() self-contained, tidak bergantung renderGrid template
//  - router() diperbaiki: slug kosong = homepage statis, bukan SPA
//  - tag/?search tetap pakai SPA renderGrid (dari template)
// ════════════════════════════════════════════════════════════════
function buildHomepage(dbEN) {
  // 20 kartu awal di-hardcode ke HTML (SEO + LCP cepat)
  const featured       = shuffle(dbEN).slice(0, HOMEPAGE_CARDS);
  const hardcodedSlugs = JSON.stringify(featured.map(v => v.slug));

  // Semua video (EN + ID) untuk loadMore & search — di-embed sebagai JSON
  // Hanya field minimal agar tidak membengkakkan HTML
  const allVideosMini = JSON.stringify(
    dbEN.map(v => ({ slug: v.slug, youtubeId: v.youtubeId, title: v.title, tags: v.tags || [] }))
  );

  let html = fs.readFileSync(BASE_TMPL, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Cari posisi #app di template ──────────────────────────────
  const APP_START = '  <div class="main-content" id="app">';
  const APP_END   = '  </div>\n  </main>\n\n<script>';
  const startIdx  = html.indexOf(APP_START);
  let   endIdx    = html.indexOf(APP_END);
  if (endIdx === -1) endIdx = html.indexOf('  </div>\n\n<script>');
  if (startIdx === -1 || endIdx === -1) {
    console.error('❌ Tidak bisa menemukan #app block di template! Cek index_base.html');
    process.exit(1);
  }

  // ── Fungsi buat satu kartu video ──────────────────────────────
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

  const cardsHtml = featured.map((v, i) => cardHtml(v, i)).join('\n');

  // ── Inject kartu awal ke dalam #app ───────────────────────────
  const newApp = `${APP_START}
    <h5 id="grid-label" style="color:#98FB98;margin-bottom:12px">🔥 TRENDING VIDEO</h5>
    <div class="video-grid" id="video-grid-inner">
${cardsHtml}
    </div>
    <div class="load-more-wrap">
      <button class="btn-load-more" id="btn-load-more" onclick="loadMore()">Load More</button>
    </div>
  </div>\n  </main>\n\n<script>`;

  html = html.slice(0, startIdx) + newApp + html.slice(endIdx + APP_END.length);

  // ── Footer homepage — hanya copyright, tanpa kategori ─────────
  const footerHtml = `
<footer style="margin-top:60px;padding:20px 16px;background:#0d0d0d;border-top:1px solid #1e1e1e;text-align:center">
  <p style="color:#333;font-size:10px;letter-spacing:.5px">© 2026 Trend4GenZ. All rights reserved.</p>
</footer>`;
  html = html.replace('</body>', footerHtml + '\n</body>');

  // ── Patch script: loadMore + router (self-contained) ──────────
  const patchScript = `
// ══════════════════════════════════════════════════════════════
//  PATCH homepage statis v10
//  loadMore: self-contained, append kartu langsung ke DOM
//  router: tag/search pakai SPA; slug kosong = homepage statis
// ══════════════════════════════════════════════════════════════

// ── Data semua video (EN, minimal fields) ─────────────────────
var _ALL_VIDEOS  = ${allVideosMini};
var _SHOWN_SLUGS = new Set(${hardcodedSlugs});

// Pool untuk loadMore — mulai dari video yang belum ditampilkan
// Urutannya sudah di-shuffle saat generate, tampil sequentially
var _loadPool  = _ALL_VIDEOS.filter(function(v){ return !_SHOWN_SLUGS.has(v.slug); });
var _loadIndex = 0;       // posisi berikutnya di _loadPool
var _PAGE_SIZE = 20;      // jumlah kartu per klik Load More
var _isLoading = false;

// ── Buat satu elemen kartu video ─────────────────────────────
function _makeCard(v) {
  var a = document.createElement('a');
  a.href  = '/video/' + v.slug + '/';
  a.className = 'video-card-link';
  a.style.cssText = 'text-decoration:none;color:inherit';
  a.innerHTML =
    '<div class="video-card">' +
      '<div class="thumb-wrap">' +
        '<img src="https://img.youtube.com/vi/' + v.youtubeId + '/mqdefault.jpg"' +
             ' alt="' + v.title.replace(/"/g,'&quot;') + '"' +
             ' loading="lazy" decoding="async" width="320" height="180"' +
             ' onload="this.classList.add(\'loaded\')"' +
             ' onerror="this.src=\'https://img.youtube.com/vi/' + v.youtubeId + '/hqdefault.jpg\';this.classList.add(\'loaded\')"/>' +
      '</div>' +
      '<div class="video-card-title">' + v.title.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>' +
    '</div>';
  return a;
}

// ── loadMore: append _PAGE_SIZE kartu berikutnya ──────────────
function loadMore() {
  if (_isLoading) return;
  var grid = document.getElementById('video-grid-inner');
  var btn  = document.getElementById('btn-load-more');
  if (!grid) return;

  // Kalau pool habis, mulai ulang dari awal pool (loop)
  if (_loadIndex >= _loadPool.length) {
    _loadIndex = 0;
  }

  var batch = _loadPool.slice(_loadIndex, _loadIndex + _PAGE_SIZE);
  if (!batch.length) return;

  _isLoading = true;
  if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }

  // Append kartu ke grid
  var frag = document.createDocumentFragment();
  batch.forEach(function(v) { frag.appendChild(_makeCard(v)); });
  grid.appendChild(frag);

  _loadIndex += batch.length;
  _isLoading  = false;

  if (btn) {
    btn.textContent = 'Load More';
    btn.disabled    = false;
    // Sembunyikan tombol kalau semua sudah ditampilkan
    if (_loadIndex >= _loadPool.length) {
      btn.style.display = 'none';
    }
  }
}

// ── Helper: cari slug dari URL path ───────────────────────────
function _getSlug() {
  var p = location.pathname.replace(/\\/+$/, '');
  var parts = p.split('/').filter(Boolean);
  // Path /video/slug → biarkan redirect ke halaman statis
  // Path / atau kosong → homepage
  if (!parts.length || parts[0] === '') return '';
  if (parts[0] === 'video' && parts[1]) return parts[1];
  return parts[parts.length - 1] || '';
}

// ── Helper: render grid kartu (untuk tag/search SPA mode) ─────
function _renderFilteredGrid(videos, label) {
  var grid  = document.getElementById('video-grid-inner');
  var lbl   = document.getElementById('grid-label');
  var btn   = document.getElementById('btn-load-more');
  if (!grid) return;

  // Reset grid
  grid.innerHTML = '';
  var frag = document.createDocumentFragment();
  videos.slice(0, _PAGE_SIZE).forEach(function(v) { frag.appendChild(_makeCard(v)); });
  grid.appendChild(frag);

  // Sisa untuk loadMore dalam mode filter
  var rest = videos.slice(_PAGE_SIZE);
  _loadPool  = rest;
  _loadIndex = 0;
  if (lbl) lbl.textContent = label;
  if (btn) btn.style.display = rest.length ? '' : 'none';
}

// ── router: hanya handle tag & search di homepage ─────────────
// Slug non-kosong → langsung redirect ke halaman statis /video/
// Ini homepage statis, jadi SPA hanya untuk filter tag/search
async function router() {
  var slug   = _getSlug();
  var params = new URLSearchParams(location.search);
  var tag    = params.get('tag');
  var search = params.get('search');

  // Kalau ada slug video → redirect ke halaman statis
  if (slug && slug !== 'home' && slug !== 'index') {
    window.location.replace('/video/' + slug + '/');
    return;
  }

  // Ambil navbar dari template jika ada
  var navbar = document.getElementById('main-navbar');

  if (tag || search) {
    // Mode filter — gunakan _ALL_VIDEOS (sudah ada di halaman)
    if (navbar) navbar.classList.remove('video-mode');

    var q = (search || '').toLowerCase();
    var t = (tag    || '').toLowerCase();

    var filtered = _ALL_VIDEOS.filter(function(v) {
      if (t) return v.tags && v.tags.some(function(tg){ return tg.toLowerCase() === t; });
      if (q) return v.title.toLowerCase().indexOf(q) !== -1;
      return true;
    });

    var rest = _ALL_VIDEOS.filter(function(v) {
      return filtered.indexOf(v) === -1;
    });

    var combined = filtered.length ? filtered.concat(rest) : _ALL_VIDEOS;

    var label = t
      ? ('🏷️ Tag: #' + tag + ' — ' + filtered.length + ' video')
      : ('🔍 "' + search + '" — ' + filtered.length + ' hasil');

    _renderFilteredGrid(combined, label);

    // Tambah tombol back ke home jika belum ada
    var lbl = document.getElementById('grid-label');
    if (lbl && !document.getElementById('btn-back-home')) {
      var backBtn = document.createElement('button');
      backBtn.id = 'btn-back-home';
      backBtn.onclick = function() {
        history.pushState({}, '', '/');
        router();
      };
      backBtn.style.cssText = 'background:transparent;color:#98FB98;border:1px solid #98FB98;' +
        'padding:4px 12px;border-radius:14px;font-weight:700;font-size:.75rem;cursor:pointer;' +
        'margin-bottom:10px;display:inline-flex;align-items:center;gap:5px;line-height:1';
      backBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" ' +
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
        '<polyline points="9 22 9 12 15 12 15 22"/></svg> HOME';
      lbl.parentNode.insertBefore(backBtn, lbl);
    }

  } else {
    // Mode homepage normal — reset ke pool awal, tampilkan tombol Load More
    if (navbar) navbar.classList.remove('video-mode');

    var oldBtn = document.getElementById('btn-back-home');
    if (oldBtn) oldBtn.remove();

    var lbl2 = document.getElementById('grid-label');
    if (lbl2) lbl2.textContent = '🔥 TRENDING VIDEO';

    // Reset loadMore pool ke video yang belum di-hardcode
    _loadPool  = _ALL_VIDEOS.filter(function(v){ return !_SHOWN_SLUGS.has(v.slug); });
    _loadIndex = 0;

    var btn2 = document.getElementById('btn-load-more');
    if (btn2) {
      btn2.style.display = _loadPool.length ? '' : 'none';
      btn2.textContent   = 'Load More';
      btn2.disabled      = false;
    }

    // Grid sudah berisi kartu hardcode dari HTML — tidak perlu re-render
  }

  window.scrollTo(0, 0);
}

// ── Override fungsi loadMore dari template jika ada ───────────
// (template mungkin punya loadMore sendiri yang tidak kompatibel)
window.loadMore = loadMore;

// ── Jalankan router saat popstate (back/forward browser) ───────
window.addEventListener('popstate', function() { router(); });

// ── Init: jalankan router sekali saat halaman dimuat ──────────
(function init() {
  var params = new URLSearchParams(location.search);
  if (params.get('tag') || params.get('search')) {
    router();
  }
  // Kalau tidak ada tag/search, grid hardcode sudah siap — tidak perlu apa-apa
})();
`;

  // Inject patch script sebelum </script> terakhir sebelum </body>
  html = html.replace('<\/script>\n</body>', patchScript + '<\/script>\n</body>');
  return html;
}

// ════════════════════════════════════════════════════════════════
//  HALAMAN KATEGORI STATIS — /category/{slug}/index.html
//  Sumber: HANYA db-en.json
// ════════════════════════════════════════════════════════════════
function buildCategoryPage(cat, videos) {
  const catSlug    = cat.key.toLowerCase().replace(/_/g, '-');
  const canonical  = `${BASE_URL}/category/${catSlug}/`;
  const pageTitle  = `${cat.label} — ${SITE_NAME}`;
  const pageDesc   = `Kumpulan video ${cat.label} terbaru — teknologi, AI, lifestyle, dan tren global di ${SITE_NAME}.`;

  // Schema BreadcrumbList
  const breadcrumbLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home',       'item': BASE_URL + '/'          },
      { '@type': 'ListItem', 'position': 2, 'name': cat.label,    'item': canonical               },
    ]
  });

  // Schema ItemList (max 10 untuk SEO)
  const itemListLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': cat.label,
    'url': canonical,
    'numberOfItems': videos.length,
    'itemListElement': videos.slice(0, 10).map((v, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'url': `${BASE_URL}/video/${v.slug}/`,
      'name': v.title,
    }))
  });

  // Footer kategori (semua 6, aktif ditandai)
  const footerCatHtml = FOOTER_CATEGORIES.map(c => {
    const cSlug  = c.key.toLowerCase().replace(/_/g, '-');
    const active = cSlug === catSlug;
    return `<a href="${BASE_URL}/category/${cSlug}/" class="footer-cat-link${active ? ' active' : ''}">${c.icon} ${c.label}</a>`;
  }).join('');

  // Grid kartu video
  const cardsHtml = videos.length
    ? videos.map((v, i) => {
        const loading = i < 6 ? 'eager' : 'lazy';
        const fp      = i < 6 ? ' fetchpriority="high"' : '';
        return `<a href="${BASE_URL}/video/${v.slug}/" class="cat-card">
  <div class="cat-thumb">
    <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg"
         alt="${esc(v.title)}" loading="${loading}"${fp} decoding="async"
         width="320" height="180"
         onload="this.style.opacity=1"
         onerror="this.src='https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg'"/>
  </div>
  <div class="cat-title">${esc(v.title)}</div>
</a>`;
      }).join('\n')
    : `<div class="cat-empty">Belum ada video untuk kategori ini.</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(pageDesc)}"/>
  <meta name="robots" content="index, follow"/>
  <link rel="canonical" href="${canonical}"/>
  <link rel="icon" href="${BASE_URL}/logo.png" sizes="96x96" type="image/png"/>
  <meta property="og:type"        content="website"/>
  <meta property="og:title"       content="${esc(pageTitle)}"/>
  <meta property="og:description" content="${esc(pageDesc)}"/>
  <meta property="og:url"         content="${canonical}"/>
  <meta property="og:site_name"   content="${SITE_NAME}"/>
  <script type="application/ld+json">${breadcrumbLd}<\/script>
  <script type="application/ld+json">${itemListLd}<\/script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--green:#98FB98;--dark:#1a1a1a;--nav-h:52px}
    body{background:#212122;color:#f1f1f1;font-family:'Segoe UI',sans-serif;overflow-x:hidden}

    /* ── Navbar ── */
    .navbar-custom{background:#000;padding:8px 15px;position:sticky;top:0;z-index:1000;
      display:flex;align-items:center;gap:12px;border-bottom:0}
    .nav-home-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;
      border-radius:20px;border:1px solid var(--green);color:var(--green);
      text-decoration:none;font-size:.8rem;font-weight:700;white-space:nowrap;transition:.2s}
    .nav-home-btn:hover{background:rgba(152,251,152,.1)}
    .nav-title{color:#fff;font-size:.9rem;font-weight:700;overflow:hidden;
      white-space:nowrap;text-overflow:ellipsis;flex:1}

    /* ── Wrapper ── */
    .cat-page{max-width:1100px;margin:0 auto;padding:20px 15px}

    /* ── Breadcrumb ── */
    .breadcrumb{display:flex;align-items:center;gap:6px;margin-bottom:18px;
      font-size:.78rem;color:#666;flex-wrap:wrap}
    .breadcrumb a{color:#888;text-decoration:none;transition:.15s}
    .breadcrumb a:hover{color:var(--green)}
    .breadcrumb-sep{color:#444}

    /* ── Header kategori ── */
    .cat-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;
      padding-bottom:14px;border-bottom:1px solid #2a2a2a}
    .cat-icon-big{font-size:1.8rem;line-height:1}
    .cat-header-text h1{font-size:1.25rem;font-weight:800;color:#fff;line-height:1.2}
    .cat-header-text p{font-size:.8rem;color:#888;margin-top:4px}

    /* ── Grid kartu video ── */
    .cat-grid{display:grid;
      grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
      gap:12px}
    @media(min-width:600px){.cat-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}}
    @media(min-width:900px){.cat-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}

    .cat-card{display:block;text-decoration:none;color:inherit;
      background:var(--dark);border-radius:10px;overflow:hidden;
      border:1px solid transparent;transition:.2s}
    .cat-card:hover{border-color:var(--green);transform:translateY(-2px)}
    .cat-thumb{position:relative;width:100%;aspect-ratio:16/9;background:#111;overflow:hidden}
    .cat-thumb img{width:100%;height:100%;object-fit:cover;display:block;
      opacity:0;transition:opacity .3s}
    .cat-title{font-size:.75rem;font-weight:600;padding:8px 10px 10px;
      line-height:1.35;color:#e0e0e0;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .cat-empty{color:#555;font-size:.9rem;padding:40px;text-align:center;grid-column:1/-1}

    /* ── Footer SEO ── */
    .footer-seo{margin-top:60px;padding:24px 16px 28px;
      background:#0d0d0d;border-top:1px solid #1e1e1e}
    .footer-seo-title{color:#555;font-size:10px;letter-spacing:2px;font-weight:700;
      text-transform:uppercase;text-align:center;margin-bottom:14px}
    .footer-cat-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:18px}
    .footer-cat-link{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;
      border:1px solid #2a2a2a;border-radius:20px;text-decoration:none;
      color:#888;font-size:11px;font-weight:600;background:#111;
      transition:.2s;white-space:nowrap}
    .footer-cat-link:hover,.footer-cat-link.active{color:var(--green);
      border-color:#3a3a3a;background:#161616}
    .footer-copy{color:#333;font-size:10px;text-align:center;letter-spacing:.5px}
  </style>
</head>
<body>
<nav class="navbar-custom">
  <a href="${BASE_URL}/" class="nav-home-btn" aria-label="Kembali ke Home">
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    HOME
  </a>
  <span class="nav-title">${cat.icon} ${esc(cat.label)}</span>
</nav>

<main class="cat-page">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="${BASE_URL}/">Home</a>
    <span class="breadcrumb-sep">›</span>
    <span>${esc(cat.label)}</span>
  </nav>

  <div class="cat-header">
    <div class="cat-icon-big">${cat.icon}</div>
    <div class="cat-header-text">
      <h1>${esc(cat.label)}</h1>
      <p>${videos.length} video ditemukan</p>
    </div>
  </div>

  <div class="cat-grid">
    ${cardsHtml}
  </div>
</main>

<footer class="footer-seo">
  <p class="footer-seo-title">Jelajahi Kategori</p>
  <nav class="footer-cat-grid" aria-label="Kategori konten">
    ${footerCatHtml}
  </nav>
  <p class="footer-copy">© 2026 Trend4GenZ. All rights reserved.</p>
</footer>
</body>
</html>`;
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
  console.log(`✅ ${created} halaman video selesai`);

  // ── Generate halaman kategori statis ─────────────────────────
  console.log('📂 Generate halaman kategori dari db-en.json...');
  const CAT_DIR = path.join(__dirname, 'category');
  rmDir(CAT_DIR);
  fs.mkdirSync(CAT_DIR, { recursive: true });

  FOOTER_CATEGORIES.forEach(cat => {
    const catSlug  = cat.key.toLowerCase().replace(/_/g, '-');
    const normalize = s => s.toLowerCase().replace(/[\s_\-]/g, '');
    const catNorm   = normalize(cat.tag);
    const catVideos = dbEN.filter(v =>
      v.tags && v.tags.some(t =>
        normalize(t) === catNorm ||
        normalize(t).includes(catNorm) ||
        catNorm.includes(normalize(t))
      )
    );
    const dir = path.join(CAT_DIR, catSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildCategoryPage(cat, catVideos), 'utf8');
    console.log(`  📁 /category/${catSlug}/ — ${catVideos.length} video`);
  });
  console.log(`✅ ${FOOTER_CATEGORIES.length} halaman kategori selesai`);

  console.log('🏠 Update index.html dari index_base.html...');
  const newIndex = buildHomepage(dbEN);
  fs.writeFileSync(INDEX_FILE, newIndex, 'utf8');
  console.log('✅ index.html diperbarui');

  console.log(`\n🎉 Selesai! ${created} halaman statis (db-en) + homepage (EN+ID berbaur)`);
  console.log('\n📋 Status Ads (STATIC_AD):');
  console.log(`   allAds           : ${STATIC_AD.allAds}`);
  console.log(`   useDirect        : ${STATIC_AD.useDirect}   → tombol More Info 🔥`);
  console.log(`   usePlayAds       : ${STATIC_AD.usePlayAds}   → play button ads (mulai tap ke-${STATIC_AD.playAdsStartFrom})`);
  console.log(`   useNativeBanner1 : ${STATIC_AD.useNativeBanner1}   → NB1 (atas related video / bawah tombol mobile)`);
  console.log(`   useNativeBanner2 : ${STATIC_AD.useNativeBanner2}   → NB2 (bawah related video / bawah summary mobile)`);
}

main();
