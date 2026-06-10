// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  v11
//  Perubahan dari v10:
//    1. Badge "FULL WIDE SCREEN" di pojok kanan bawah judul
//       → hanya muncul jika pengunjung dari FB / X in-app browser
//    2. Klik badge:
//       - Android → intent:// buka URL sama di Chrome
//       - Intent gagal / iOS / lainnya → modal instruksi slide-up
//    3. Modal per-platform (FB Android, FB iOS, X/Twitter)
//       dengan tombol "Copy Link" → "✅ Copied!" 2 detik
// ══════════════════════════════════════════════════════════════════
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────
const DB_FILE_EN      = path.join(__dirname, 'db-en.json');
const DB_FILE_ID      = path.join(__dirname, 'db-id.json');
const BASE_TMPL       = path.join(__dirname, 'index_base.html');
const INDEX_FILE      = path.join(__dirname, 'index.html');
const VIDEO_DIR       = path.join(__dirname, 'video');
const ENTERTAIN_DIR   = path.join(__dirname, 'entertainment');
const BASE_URL        = 'https://trend4genz.fun';
const SITE_NAME       = 'Trend4GenZ';
const DESC_DEF        = 'Streaming video terbaru — teknologi, AI, lifestyle, dan tren global.';
const HOMEPAGE_CARDS  = 20;

// ── Helpers ────────────────────────────────────────────────────
function esc(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
                  .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function stripHtml(s='') { return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function trunc(s,n=160)  { const t=stripHtml(s); return t.length<=n?t:t.slice(0,n-1)+'…'; }
function rmDir(dir)      { if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true}); }
function shuffle(arr)    { return [...arr].sort(()=>0.5-Math.random()); }

// ── URL helper ─────────────────────────────────────────────────
function videoUrl(v) {
  return v.source === 'nofollow'
    ? `${BASE_URL}/entertainment/${v.slug}/`
    : `${BASE_URL}/video/${v.slug}/`;
}

// ════════════════════════════════════════════════════════════════
//  KONFIGURASI ADS
// ════════════════════════════════════════════════════════════════
const STATIC_AD = {
  allAds: true,
  useDirect:  true,
  directUrl:  'https://translate.google.com',
  usePlayAds:       true,
  playAdsUrl:       'https://google.com',
  playAdsStartFrom: 2,
  useNativeBanner1: true,
  nativeBanner1HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#c00,#e00,#f52);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-shrink:0;color:#ffdd00;font-size:11px;font-weight:800;line-height:1.2">CONTOH<br>IKLAN</div><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">IKLAN NATIVE BANNER 1</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan native 1 Anda di sini</div></div><div style="flex-shrink:0;background:#ffdd00;color:#c00;font-size:11px;font-weight:900;padding:6px 10px;border-radius:6px;text-transform:uppercase">PELAJARI</div></div>`,
  useNativeBanner2: false,
  nativeBanner2HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#003580,#0057d8,#1a8cff);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-shrink:0;color:#ffdd00;font-size:11px;font-weight:800;line-height:1.2">CONTOH<br>IKLAN</div><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">IKLAN NATIVE BANNER 2</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan native 2 Anda di sini</div></div><div style="flex-shrink:0;background:#ffdd00;color:#003580;font-size:11px;font-weight:900;padding:6px 10px;border-radius:6px;text-transform:uppercase">PELAJARI</div></div>`,
};

// ════════════════════════════════════════════════════════════════
//  KONFIGURASI KATEGORI FOOTER SEO
// ════════════════════════════════════════════════════════════════
const FOOTER_CATEGORIES = [
  {
    key: 'AI_ML_RESEARCH', label: 'AI & ML Research', icon: '✨',
    keywords: ['ai', 'ml', 'machine-learning', 'machinelearning', 'artificial-intelligence',
               'artificialintelligence', 'deep-learning', 'deeplearning', 'llm', 'gpt',
               'neural', 'ai-research', 'research', 'openai', 'gemini', 'claude', 'model']
  },
  {
    key: 'TUTORIAL_HOWTO', label: 'Tutorial & How-To', icon: '💻',
    keywords: ['tutorial', 'how-to', 'howto', 'guide', 'learn', 'course', 'coding',
               'code', 'programming', 'developer', 'dev', 'python', 'javascript',
               'beginner', 'step-by-step', 'tips', 'tricks', 'walkthrough']
  },
  {
    key: 'TECH_REVIEW', label: 'Tech Review', icon: '📊',
    keywords: ['review', 'tech', 'technology', 'gadget', 'hardware', 'software',
               'product', 'comparison', 'best', 'vs', 'unboxing', 'test', 'benchmark',
               'specs', 'iphone', 'android', 'laptop', 'phone', 'device', 'app']
  },
  {
    key: 'FINANCE_CRYPTO', label: 'Finance & Crypto', icon: '💰',
    keywords: ['finance', 'crypto', 'bitcoin', 'ethereum', 'blockchain', 'investment',
               'investing', 'stock', 'trading', 'money', 'wealth', 'defi', 'nft',
               'economy', 'market', 'passive-income', 'income', 'earn', 'profit']
  },
  {
    key: 'SCIENCE_EXPLAINER', label: 'Science Explainer', icon: '🔬',
    keywords: ['science', 'physics', 'biology', 'chemistry', 'space', 'nasa', 'quantum',
               'explained', 'explainer', 'how', 'why', 'what', 'facts', 'discovery',
               'research', 'experiment', 'nature', 'universe', 'brain', 'health']
  },
  {
    key: 'BUSINESS_STRATEGY', label: 'Business Strategy', icon: '📈',
    keywords: ['business', 'strategy', 'startup', 'entrepreneur', 'marketing', 'growth',
               'productivity', 'leadership', 'management', 'career', 'success', 'mindset',
               'ecommerce', 'saas', 'brand', 'sales', 'customer', 'company', 'ceo', 'founder']
  },
];

// ════════════════════════════════════════════════════════════════
//  WIDE SCREEN BADGE + MODAL SCRIPT
//  Di-inject sekali per halaman video (static, inline)
// ════════════════════════════════════════════════════════════════
function wideScreenScript(pageUrl) {
  return `
<style>
.ws-badge{
  display:inline-flex;align-items:center;gap:4px;
  background:#98FB98;color:#000;
  font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;
  padding:3px 8px;border-radius:5px;cursor:pointer;
  vertical-align:middle;white-space:nowrap;
  border:none;outline:none;
  transition:background .15s,transform .1s;
  float:right;margin-left:8px;margin-top:2px;
  line-height:1.4;
}
.ws-badge:active{transform:scale(.96);}
.ws-badge svg{flex-shrink:0;}
#ws-modal-overlay{
  display:none;position:fixed;inset:0;
  background:rgba(0,0,0,.75);z-index:99999;
  align-items:flex-end;justify-content:center;
}
#ws-modal-overlay.show{display:flex;}
#ws-modal-box{
  background:#1a1a1a;border-radius:18px 18px 0 0;
  padding:22px 20px 36px;width:100%;max-width:480px;
  border-top:3px solid #98FB98;
  transform:translateY(100%);
  transition:transform .32s cubic-bezier(.22,1,.36,1);
}
#ws-modal-overlay.show #ws-modal-box{transform:translateY(0);}
.ws-modal-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;
}
.ws-modal-title{
  font-size:1rem;font-weight:900;color:#98FB98;
  display:flex;align-items:center;gap:7px;
}
.ws-modal-close{
  background:rgba(255,255,255,.1);border:none;color:#fff;
  width:28px;height:28px;border-radius:50%;font-size:14px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
}
.ws-modal-subtitle{
  font-size:.82rem;color:#aaa;margin-bottom:22px;line-height:1.5;
}
.ws-modal-subtitle strong{color:#fff;}
.ws-open-label{
  font-size:.7rem;font-weight:800;color:#555;
  text-transform:uppercase;letter-spacing:.1em;
  text-align:center;margin-bottom:12px;
}
.ws-browser-btns{
  display:flex;gap:12px;justify-content:center;
}
.ws-browser-btn{
  flex:1;max-width:160px;
  display:flex;flex-direction:column;align-items:center;
  gap:8px;padding:16px 10px;
  background:rgba(255,255,255,.06);
  border:2px solid rgba(255,255,255,.12);
  border-radius:14px;cursor:pointer;
  transition:background .15s,border-color .15s,transform .1s;
  color:#fff;font-size:.82rem;font-weight:800;
  text-transform:uppercase;
}
.ws-browser-btn:hover{
  background:rgba(152,251,152,.12);
  border-color:#98FB98;color:#98FB98;
}
.ws-browser-btn:active{transform:scale(.97);}
.ws-browser-btn img{
  width:40px;height:40px;border-radius:10px;object-fit:contain;
}
</style>

<div id="ws-modal-overlay" onclick="wsCloseModal(event)">
  <div id="ws-modal-box">
    <div class="ws-modal-header">
      <div class="ws-modal-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#98FB98" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>
        Full Wide Screen
      </div>
      <button class="ws-modal-close" onclick="wsCloseModal(null)">&#x2715;</button>
    </div>
    <p class="ws-modal-subtitle" id="ws-modal-subtitle"></p>
    <p class="ws-open-label">Open in your browser</p>
    <div class="ws-browser-btns" id="ws-browser-btns"></div>
  </div>
</div>

<script>
(function(){
  var PAGE_URL  = '${pageUrl}';
  var ua        = navigator.userAgent || '';
  var ref       = document.referrer   || '';
  var qs        = location.search     || '';

  var isFB = (
    /FBAN|FBAV|FB_IAB|FBIOS|FBANDROID|FBLC|FBCR|FBSV|Instagram/.test(ua) ||
    /facebook/.test(ref) ||
    /ref=fb|utm_source=facebook/.test(qs)
  );

  var isX = (
    /Twitter|TwitterAndroid|TwitteriPhone/.test(ua) ||
    /twitter|t\.co|x\.com/.test(ref) ||
    /ref=x|utm_source=twitter|utm_source=x/.test(qs)
  );

  var isAndroid = /Android/.test(ua);
  var isIOS     = /iPhone|iPad|iPod/.test(ua);
  var isInApp   = isFB || isX;

  if (!isInApp) return;

  function injectBadge() {
    var h1 = document.querySelector('.info-section h1');
    if (!h1) return;
    var badge       = document.createElement('button');
    badge.className = 'ws-badge';
    badge.innerHTML = 'FULL WIDE SCREEN';
    badge.onclick   = wsHandleClick;
    h1.insertBefore(badge, h1.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBadge);
  } else {
    injectBadge();
  }

  window.wsHandleClick = function() {
    var subtitle = document.getElementById('ws-modal-subtitle');
    var btnsWrap = document.getElementById('ws-browser-btns');

    subtitle.innerHTML = 'Your <strong>' +
      (isFB ? 'Facebook' : 'X (Twitter)') +
      '</strong> browser does not support full wide screen.';

    btnsWrap.innerHTML = '';

    if (!isIOS) {
      var btnC       = document.createElement('button');
      btnC.className = 'ws-browser-btn';
      btnC.innerHTML =
        '<img src="https://www.google.com/s2/favicons?domain=google.com&sz=64" ' +
        'width="40" height="40" alt="Chrome" ' +
        'style="border-radius:8px;object-fit:contain;" />' +
        'Chrome';
      btnC.onclick = wsOpenChrome;
      btnsWrap.appendChild(btnC);
    }

    if (isIOS) {
      var btnS       = document.createElement('button');
      btnS.className = 'ws-browser-btn';
      btnS.innerHTML =
        '<img src="https://www.google.com/s2/favicons?domain=apple.com&sz=64" ' +
        'width="44" height="44" alt="Safari" ' +
        'style="border-radius:10px;object-fit:contain;" />' +
        'Safari';
      btnS.onclick = wsOpenSafari;
      btnsWrap.appendChild(btnS);
    }

    if (!isAndroid && !isIOS) {
      var btnC2       = document.createElement('button');
      btnC2.className = 'ws-browser-btn';
      btnC2.innerHTML =
        '<img src="https://www.google.com/s2/favicons?domain=google.com&sz=64" ' +
        'width="44" height="44" alt="Chrome" ' +
        'style="border-radius:10px;object-fit:contain;" />' +
        'Chrome';
      btnC2.onclick = wsOpenChrome;
      btnsWrap.appendChild(btnC2);

      var btnS2       = document.createElement('button');
      btnS2.className = 'ws-browser-btn';
      btnS2.innerHTML =
        '<img src="https://www.google.com/s2/favicons?domain=apple.com&sz=64" ' +
        'width="44" height="44" alt="Safari" ' +
        'style="border-radius:10px;object-fit:contain;" />' +
        'Safari';
      btnS2.onclick = wsOpenSafari;
      btnsWrap.appendChild(btnS2);
    }

    document.getElementById('ws-modal-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  window.wsOpenChrome = function() {
    var host = PAGE_URL.replace('https://', '').replace('http://', '');
    var enc  = encodeURIComponent(PAGE_URL);
    window.location.href =
      'intent://' + host +
      '#Intent;scheme=https;package=com.android.chrome;' +
      'S.browser_fallback_url=' + enc + ';end';
  };

  window.wsOpenSafari = function() {
    window.location.href = PAGE_URL;
  };

  window.wsCloseModal = function(e) {
    if (e && e.target !== document.getElementById('ws-modal-overlay')) return;
    document.getElementById('ws-modal-overlay').classList.remove('show');
    document.body.style.overflow = '';
  };

})();
<\/script>`;
}

// ════════════════════════════════════════════════════════════════
//  HALAMAN VIDEO STATIS
// ════════════════════════════════════════════════════════════════
function buildVideoPage(v, allVideos, isNoIndex) {

  const canonical  = videoUrl(v);
  const thumb      = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const thumbOg    = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const desc       = trunc(v.summary||DESC_DEF, 160);
  const uploadDate = v.uploadDate||new Date().toISOString();
  const tags       = v.tags||[];

  const related = shuffle(allVideos.filter(r => r.slug !== v.slug)).slice(0, 30);

  const robotsContent = isNoIndex
    ? 'noindex, nofollow, noarchive, noimageindex'
    : 'index, follow';

  const canonicalTag = isNoIndex
    ? '<!-- noindex: canonical dihapus -->'
    : `<link rel="canonical" href="${canonical}"/>`;

  const jsonLdTag = isNoIndex ? '' : `
  <script type="application/ld+json">${JSON.stringify({
    '@context':'https://schema.org','@type':'VideoObject',
    'name':v.title,'description':desc,'thumbnailUrl':[thumb],
    'uploadDate':uploadDate,
    'embedUrl':`https://www.youtube.com/embed/${v.youtubeId}`,
    'url':canonical,
    'publisher':{'@type':'Organization','name':SITE_NAME,'url':BASE_URL}
  })}<\/script>`;

  const faqTag = (!isNoIndex && v.faqSchema)
    ? `<script type="application/ld+json">${JSON.stringify(v.faqSchema).replace(/<\/script>/gi,'<\\/script>')}<\/script>`
    : '';

  const tagsHtml = tags.length
    ? `<div class="seo-tags-container">${tags.map(t =>
        isNoIndex
          ? `<span class="seo-tag-badge">#${esc(t)}</span>`
          : `<a href="${BASE_URL}/?tag=${encodeURIComponent(t)}" class="seo-tag-badge">#${esc(t)}</a>`
      ).join('')}</div>`
    : '';

  const mobileRelatedHtml = related.slice(0, 8).map(r => `
    <a href="${videoUrl(r)}" class="slider-item" style="text-decoration:none;color:inherit;display:block"
       ${r.source==='nofollow' ? 'rel="nofollow noopener"' : ''}>
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="160" height="90"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  const sideRelatedHtml = related.slice(0, 20).map(r => `
    <a href="${videoUrl(r)}" class="side-slider-item"
       ${r.source==='nofollow' ? 'rel="nofollow noopener"' : ''}>
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg"
           alt="${esc(r.title)}" loading="lazy" width="108" height="60"
           onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:108px;height:60px;object-fit:cover;flex-shrink:0"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  const sliderDataJson = JSON.stringify(
    allVideos
      .filter(r => r.slug !== v.slug)
      .map(r => ({
        slug:     r.slug,
        youtubeId:r.youtubeId,
        title:    r.title,
        source:   r.source || 'seo'
      }))
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

  // ── Wide Screen badge + modal (di-inject per halaman) ────────
  const wsBlock = wideScreenScript(canonical);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(v.title)} | ${SITE_NAME}</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="robots" content="${robotsContent}"/>
  ${canonicalTag}
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
  ${jsonLdTag}
  ${faqTag}
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
      .video-side-col{width:280px;flex-shrink:0;position:sticky;top:calc(var(--nav-h) + 10px);display:flex;flex-direction:column;gap:0}
      .side-related-label{color:var(--green);font-size:.8rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:8px 0 8px;flex-shrink:0}
      .side-slider{display:flex;flex-direction:column;gap:8px;max-height:calc(100vh - var(--nav-h) - 220px);overflow-y:auto;scrollbar-width:none;flex-shrink:0}
      .side-slider::-webkit-scrollbar{display:none}
      .side-slider-item{display:flex;gap:8px;background:var(--dark);border-radius:8px;overflow:hidden;cursor:pointer;text-decoration:none;color:inherit;border:1px solid transparent;transition:.2s;flex-shrink:0}
      .side-slider-item:hover{border-color:var(--green)}
      .side-slider-item img{width:108px;height:60px;object-fit:cover;flex-shrink:0}
      .side-slider-item p{font-size:.72rem;padding:6px 8px;margin:0;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:#f1f1f1}
      .side-nb-block{width:100%;flex-shrink:0;margin:8px 0}
      .side-nb-block .native-banner-wrap{margin:0;border-radius:10px}
      .nb-mobile-only{display:none}
      .recommendation-slider-wrap{display:none}
    }
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
    h1{font-size:1.2rem;font-weight:800;line-height:1.4;margin:15px 0;overflow:hidden}
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

${wsBlock}

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

    <!-- ═══════════════════════════ KOLOM KIRI ═══════════════════════════ -->
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
            More Info
          </button>
        </div>

        <!-- Native Banner 1 — MOBILE ONLY -->
        <div class="nb-mobile-only">${nb1Mobile}</div>

        <div class="summary-box">
          <div class="summary-text">${v.summary||'<p>'+esc(desc)+'</p>'}</div>
          ${tagsHtml}
        </div>

        <!-- Native Banner 2 — MOBILE ONLY -->
        <div class="nb-mobile-only">${nb2Mobile}</div>

        <!-- Mobile horizontal slider -->
        <div class="recommendation-slider-wrap">
          <p class="more-videos-label">MORE VIDEOS</p>
          <div class="recommendation-slider" id="rec-slider">${mobileRelatedHtml}</div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════ KOLOM KANAN DESKTOP ══════════════════ -->
    <div class="video-side-col">
      ${nb1Desktop ? `<div class="side-nb-block">${nb1Desktop}</div>` : ''}
      <div class="side-related-label">🎬 Related Videos</div>
      <div class="side-slider" id="side-slider-desktop">${sideRelatedHtml}</div>
      ${nb2Desktop ? `<div class="side-nb-block">${nb2Desktop}</div>` : ''}
    </div>

  </div>
</div>
</main>

${isNoIndex ? `
<footer class="footer-seo">
  <p class="footer-copy">© 2026 ${SITE_NAME}. All rights reserved.</p>
</footer>` : `
<footer class="footer-seo">
  <p class="footer-seo-title">Jelajahi Kategori</p>
  <nav class="footer-cat-grid" aria-label="Kategori konten">
    ${footerCatHtml}
  </nav>
  <p class="footer-copy">© 2026 ${SITE_NAME}. All rights reserved.</p>
</footer>`}

<script>
// ── Ads config ────────────────────────────────────────────────
var STATIC_AD = {
  allAds:          ${STATIC_AD.allAds},
  useDirect:       ${STATIC_AD.useDirect},
  directUrl:       '${STATIC_AD.directUrl}',
  usePlayAds:      ${STATIC_AD.usePlayAds},
  playAdsUrl:      '${STATIC_AD.playAdsUrl}',
  playAdsStartFrom:${STATIC_AD.playAdsStartFrom}
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

// ── Search ─────────────────────────────────────────────────────
var _db = ${sliderDataJson};
(function(){
  var inp=document.getElementById('searchInput'),
      btn=document.getElementById('searchBtn'),
      sug=document.getElementById('searchSuggestions'),
      ai=-1;
  function hl(t,q){
    var e=q.replace(/[.*+?^$\\x7B\\x7D()|[\\]\\\\]/g,'\\\\$&');
    return t.replace(new RegExp('('+e+')','gi'),'<em>$1</em>');
  }
  function hide(){sug.classList.remove('show');sug.innerHTML='';ai=-1;}
  function getUrl(v){return v.source==='nofollow'?'${BASE_URL}/entertainment/'+v.slug+'/':'${BASE_URL}/video/'+v.slug+'/';}
  inp.addEventListener('input',function(){
    var val=inp.value.trim().toLowerCase();ai=-1;
    if(!val){hide();return;}
    var m=_db.filter(function(v){return v.title.toLowerCase().indexOf(val)!==-1;}).slice(0,7);
    if(!m.length){sug.innerHTML='<div class="suggestion-empty">No results for "<b>'+val+'</b>"</div>';sug.classList.add('show');return;}
    sug.innerHTML=m.map(function(v){
      return '<div class="suggestion-item" data-url="'+getUrl(v)+'">'+
        '<img src="https://img.youtube.com/vi/'+v.youtubeId+'/mqdefault.jpg" loading="lazy" alt=""/>'+
        '<span>'+hl(v.title,val)+'</span></div>';
    }).join('');
    sug.classList.add('show');
    sug.querySelectorAll('.suggestion-item').forEach(function(el){
      el.addEventListener('mousedown',function(e){e.preventDefault();window.location.href=el.dataset.url;});
    });
  });
  inp.addEventListener('keydown',function(e){
    var items=sug.querySelectorAll('.suggestion-item');
    if(e.key==='ArrowDown'){e.preventDefault();ai=Math.min(ai+1,items.length-1);upA(items);}
    else if(e.key==='ArrowUp'){e.preventDefault();ai=Math.max(ai-1,-1);upA(items);}
    else if(e.key==='Enter'){
      if(ai>=0&&items[ai])window.location.href=items[ai].dataset.url;
      else{var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);}
    }else if(e.key==='Escape'){hide();inp.blur();}
  });
  function upA(items){items.forEach(function(el,i){el.classList.toggle('active',i===ai);});}
  btn.addEventListener('click',function(){var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);});
  document.addEventListener('click',function(e){if(!e.target.closest('.search-wrapper'))hide();});
})();

// ── Infinite scroll mobile ────────────────────────────────────
var _loaded=8;
document.getElementById('rec-slider').addEventListener('scroll',function(){
  if(this.scrollLeft+this.clientWidth>=this.scrollWidth-120){
    var next=_db.slice(_loaded,_loaded+8);
    if(!next.length){_loaded=0;next=_db.slice(0,8);}
    next.forEach(function(r){
      var url=r.source==='nofollow'?'${BASE_URL}/entertainment/'+r.slug+'/':'${BASE_URL}/video/'+r.slug+'/';
      var a=document.createElement('a');
      a.className='slider-item';a.href=url;a.setAttribute('rel',r.source==='nofollow'?'nofollow noopener':'');
      a.style.cssText='text-decoration:none;color:inherit;display:block';
      a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
      document.getElementById('rec-slider').appendChild(a);
    });
    _loaded+=next.length;
  }
});

// ── Infinite scroll desktop sidebar ──────────────────────────
(function(){
  var side=document.getElementById('side-slider-desktop');
  if(!side)return;
  var sideLoaded=20;
  side.addEventListener('scroll',function(){
    if(this.scrollTop+this.clientHeight>=this.scrollHeight-100){
      var next=_db.slice(sideLoaded,sideLoaded+10);
      if(!next.length){sideLoaded=0;next=_db.slice(0,10);}
      next.forEach(function(r){
        var url=r.source==='nofollow'?'${BASE_URL}/entertainment/'+r.slug+'/':'${BASE_URL}/video/'+r.slug+'/';
        var a=document.createElement('a');
        a.className='side-slider-item';a.href=url;
        if(r.source==='nofollow')a.setAttribute('rel','nofollow noopener');
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
function buildHomepage(dbEN, dbID) {
  const allVideos = [...dbEN, ...dbID];
  const featured       = shuffle(allVideos).slice(0, HOMEPAGE_CARDS);
  const hardcodedSlugs = JSON.stringify(featured.map(v => v.slug));
  const allVideosMini = JSON.stringify(
    allVideos.map(v => ({
      slug:     v.slug,
      youtubeId:v.youtubeId,
      title:    v.title,
      tags:     v.tags || [],
      source:   v.source || 'seo'
    }))
  );

  let html = fs.readFileSync(BASE_TMPL, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const APP_START = '  <div class="main-content" id="app">';
  const APP_END   = '  </div>\n  </main>\n\n<script>';
  const startIdx  = html.indexOf(APP_START);
  let   endIdx    = html.indexOf(APP_END);
  if (endIdx === -1) endIdx = html.indexOf('  </div>\n\n<script>');
  if (startIdx === -1 || endIdx === -1) {
    console.error('❌ Tidak bisa menemukan #app block di template!');
    process.exit(1);
  }

  function cardHtml(v, idx) {
    const loading = idx < 4 ? 'eager' : 'lazy';
    const fp      = idx < 4 ? ' fetchpriority="high"' : '';
    const href    = v.source === 'nofollow'
      ? `/entertainment/${v.slug}/`
      : `/video/${v.slug}/`;
    const rel     = v.source === 'nofollow' ? ' rel="nofollow noopener"' : '';
    return `<a href="${href}"${rel} class="video-card-link" style="text-decoration:none;color:inherit">
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

  const footerHtml = `
<footer style="margin-top:60px;padding:20px 16px;background:#0d0d0d;border-top:1px solid #1e1e1e;text-align:center">
  <p style="color:#333;font-size:10px;letter-spacing:.5px">© 2026 Trend4GenZ. All rights reserved.</p>
</footer>`;
  html = html.replace('</body>', footerHtml + '\n</body>');

  const patchScript = `
// ══════════════════════════════════════════════════════════════════
//  PATCH v11
// ══════════════════════════════════════════════════════════════════
var _ALL_VIDEOS  = ${allVideosMini};
var _SHOWN_SLUGS = new Set(${hardcodedSlugs});

window._navigateTo_override = function(slug) {
  var video = _ALL_VIDEOS.find(function(v){ return v.slug === slug; });
  if(!video) return;
  if(video.source === 'nofollow') {
    window.location.href = '/entertainment/' + video.slug + '/';
  } else {
    window.location.href = '/video/' + video.slug + '/';
  }
};

(function() {
  var _origAEL = window.addEventListener.bind(window);
  window.addEventListener = function(type, fn, opts) {
    if (type === 'load') {
      _origAEL('load', async function() {
        videoDatabaseEN = _ALL_VIDEOS
          .filter(function(v){ return v.source !== 'nofollow'; })
          .map(function(v){ return {slug:v.slug,youtubeId:v.youtubeId,title:v.title,tags:v.tags||[],source:'seo'}; });
        videoDatabaseID = _ALL_VIDEOS
          .filter(function(v){ return v.source === 'nofollow'; })
          .map(function(v){ return {slug:v.slug,youtubeId:v.youtubeId,title:v.title,tags:v.tags||[],source:'nofollow'}; });
        videoDatabaseALL = _ALL_VIDEOS.map(function(v){
          return {slug:v.slug,youtubeId:v.youtubeId,title:v.title,tags:v.tags||[],source:v.source||'seo'};
        });
        currentData = videoDatabaseALL.filter(function(v){
          return !_SHOWN_SLUGS.has(v.slug);
        });
        currentPage = 0;
        if (typeof navigateTo === 'function') {
          window.navigateTo = window._navigateTo_override;
        }
        if (typeof initSearch === 'function') initSearch();
        var params = new URLSearchParams(location.search);
        if (params.get('tag') || params.get('search')) {
          if (typeof router === 'function') await router();
        }
      }, opts);
    } else {
      _origAEL(type, fn, opts);
    }
  };
})();
`;

  const TMPL_SCRIPT_START = '\n<script>\n';
  const afterMain = html.indexOf('</main>');
  const scriptPos = html.indexOf(TMPL_SCRIPT_START, afterMain);

  if (scriptPos !== -1) {
    html = html.slice(0, scriptPos) +
           '\n<script>\n' + patchScript + '\n<\/script>' +
           html.slice(scriptPos);
  } else {
    html = html.replace('<script>\n// ════', '<script>\n' + patchScript + '\n// ════');
  }

  return html;
}

// ════════════════════════════════════════════════════════════════
//  HALAMAN KATEGORI STATIS
// ════════════════════════════════════════════════════════════════
function buildCategoryPage(cat, videos) {
  const catSlug    = cat.key.toLowerCase().replace(/_/g, '-');
  const canonical  = `${BASE_URL}/category/${catSlug}/`;
  const pageTitle  = `${cat.label} — ${SITE_NAME}`;
  const pageDesc   = `Kumpulan video ${cat.label} terbaru — teknologi, AI, lifestyle, dan tren global di ${SITE_NAME}.`;

  const breadcrumbLd = JSON.stringify({
    '@context':'https://schema.org','@type':'BreadcrumbList',
    'itemListElement':[
      {'@type':'ListItem','position':1,'name':'Home','item':BASE_URL+'/'},
      {'@type':'ListItem','position':2,'name':cat.label,'item':canonical}
    ]
  });
  const itemListLd = JSON.stringify({
    '@context':'https://schema.org','@type':'ItemList',
    'name':cat.label,'url':canonical,'numberOfItems':videos.length,
    'itemListElement':videos.slice(0,10).map((v,i)=>({
      '@type':'ListItem','position':i+1,
      'url':`${BASE_URL}/video/${v.slug}/`,'name':v.title
    }))
  });

  const footerCatHtml = FOOTER_CATEGORIES.map(c => {
    const cSlug  = c.key.toLowerCase().replace(/_/g,'-');
    const active = cSlug === catSlug;
    return `<a href="${BASE_URL}/category/${cSlug}/" class="footer-cat-link${active?' active':''}">${c.icon} ${c.label}</a>`;
  }).join('');

  const cardsHtml = videos.length
    ? videos.map((v,i)=>{
        const loading = i<6?'eager':'lazy';
        const fp      = i<6?' fetchpriority="high"':'';
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
  <script type="application/ld+json">${breadcrumbLd}<\/script>
  <script type="application/ld+json">${itemListLd}<\/script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--green:#98FB98;--dark:#1a1a1a}
    body{background:#212122;color:#f1f1f1;font-family:'Segoe UI',sans-serif;overflow-x:hidden}
    .navbar-custom{background:#000;padding:8px 15px;position:sticky;top:0;z-index:1000;display:flex;align-items:center;gap:12px}
    .nav-home-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;border:1px solid var(--green);color:var(--green);text-decoration:none;font-size:.8rem;font-weight:700;white-space:nowrap;transition:.2s}
    .nav-home-btn:hover{background:rgba(152,251,152,.1)}
    .nav-title{color:#fff;font-size:.9rem;font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1}
    .cat-page{max-width:1100px;margin:0 auto;padding:20px 15px}
    .breadcrumb{display:flex;align-items:center;gap:6px;margin-bottom:18px;font-size:.78rem;color:#666;flex-wrap:wrap}
    .breadcrumb a{color:#888;text-decoration:none;transition:.15s}
    .breadcrumb a:hover{color:var(--green)}
    .breadcrumb-sep{color:#444}
    .cat-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #2a2a2a}
    .cat-icon-big{font-size:1.8rem;line-height:1}
    .cat-header-text h1{font-size:1.25rem;font-weight:800;color:#fff}
    .cat-header-text p{font-size:.8rem;color:#888;margin-top:4px}
    .cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
    @media(min-width:600px){.cat-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}}
    @media(min-width:900px){.cat-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}
    .cat-card{display:block;text-decoration:none;color:inherit;background:var(--dark);border-radius:10px;overflow:hidden;border:1px solid transparent;transition:.2s}
    .cat-card:hover{border-color:var(--green);transform:translateY(-2px)}
    .cat-thumb{width:100%;aspect-ratio:16/9;background:#111;overflow:hidden}
    .cat-thumb img{width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity .3s}
    .cat-title{font-size:.75rem;font-weight:600;padding:8px 10px 10px;line-height:1.35;color:#e0e0e0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .cat-empty{color:#555;font-size:.9rem;padding:40px;text-align:center;grid-column:1/-1}
    .footer-seo{margin-top:60px;padding:24px 16px 28px;background:#0d0d0d;border-top:1px solid #1e1e1e}
    .footer-seo-title{color:#555;font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;text-align:center;margin-bottom:14px}
    .footer-cat-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:18px}
    .footer-cat-link{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border:1px solid #2a2a2a;border-radius:20px;text-decoration:none;color:#888;font-size:11px;font-weight:600;background:#111;transition:.2s;white-space:nowrap}
    .footer-cat-link:hover,.footer-cat-link.active{color:var(--green);border-color:#3a3a3a;background:#161616}
    .footer-copy{color:#333;font-size:10px;text-align:center;letter-spacing:.5px}
  </style>
</head>
<body>
<nav class="navbar-custom">
  <a href="${BASE_URL}/" class="nav-home-btn">
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    HOME
  </a>
  <span class="nav-title">${cat.icon} ${esc(cat.label)}</span>
</nav>
<main class="cat-page">
  <nav class="breadcrumb"><a href="${BASE_URL}/">Home</a><span class="breadcrumb-sep">›</span><span>${esc(cat.label)}</span></nav>
  <div class="cat-header">
    <div class="cat-icon-big">${cat.icon}</div>
    <div class="cat-header-text"><h1>${esc(cat.label)}</h1><p>${videos.length} video ditemukan</p></div>
  </div>
  <div class="cat-grid">${cardsHtml}</div>
</main>
<footer class="footer-seo">
  <p class="footer-seo-title">Jelajahi Kategori</p>
  <nav class="footer-cat-grid">${footerCatHtml}</nav>
  <p class="footer-copy">© 2026 ${SITE_NAME}. All rights reserved.</p>
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
    console.log('⚠️  index_base.html tidak ada → membuat dari index.html...');
    fs.copyFileSync(INDEX_FILE, BASE_TMPL);
  }

  const rawEN = JSON.parse(fs.readFileSync(DB_FILE_EN,'utf8'));
  const dbEN  = rawEN.filter(v=>v.slug&&v.youtubeId&&v.title).map(v=>({...v, source:'seo'}));
  console.log(`📦 db-en.json: ${rawEN.length} total → ${dbEN.length} valid`);

  let dbID = [];
  if (fs.existsSync(DB_FILE_ID)) {
    const rawID = JSON.parse(fs.readFileSync(DB_FILE_ID,'utf8'));
    dbID = rawID.filter(v=>v.slug&&v.youtubeId&&v.title).map(v=>({...v, source:'nofollow'}));
    console.log(`📦 db-id.json: ${rawID.length} total → ${dbID.length} valid`);
  } else {
    console.log('⚠️  db-id.json tidak ditemukan — skip');
  }

  const allVideos = [...dbEN, ...dbID];

  console.log('\n🗑️  Hapus /video/ lama...');
  rmDir(VIDEO_DIR);
  fs.mkdirSync(VIDEO_DIR, {recursive:true});
  console.log('📄 Generate halaman statis db-en → /video/...');
  let createdEN = 0;
  dbEN.forEach(v => {
    const dir = path.join(VIDEO_DIR, v.slug);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), buildVideoPage(v, allVideos, false), 'utf8');
    createdEN++;
    if (createdEN % 50 === 0) console.log(`  ✅ ${createdEN}/${dbEN.length}`);
  });
  console.log(`✅ ${createdEN} halaman /video/ selesai`);

  console.log('\n🗑️  Hapus /entertainment/ lama...');
  rmDir(ENTERTAIN_DIR);

  if (dbID.length) {
    fs.mkdirSync(ENTERTAIN_DIR, {recursive:true});
    console.log('📄 Generate halaman statis db-id → /entertainment/...');
    let createdID = 0;
    dbID.forEach(v => {
      const dir = path.join(ENTERTAIN_DIR, v.slug);
      fs.mkdirSync(dir, {recursive:true});
      fs.writeFileSync(path.join(dir,'index.html'), buildVideoPage(v, allVideos, true), 'utf8');
      createdID++;
      if (createdID % 50 === 0) console.log(`  ✅ ${createdID}/${dbID.length}`);
    });
    console.log(`✅ ${createdID} halaman /entertainment/ selesai (noindex)`);
  }

  console.log('\n📂 Generate halaman kategori dari db-en.json...');
  const CAT_DIR = path.join(__dirname, 'category');
  rmDir(CAT_DIR);
  fs.mkdirSync(CAT_DIR, {recursive:true});
  const normalize = s => s.toLowerCase().replace(/[\s_\-]/g,'');
  FOOTER_CATEGORIES.forEach(cat => {
    const catSlug = cat.key.toLowerCase().replace(/_/g,'-');
    const kws = cat.keywords.map(k => normalize(k));
    const matchTag   = t => { const nt=normalize(t); return kws.some(k=>nt===k||nt.includes(k)||k.includes(nt)); };
    const matchTitle = title => { const nt=title.toLowerCase(); return cat.keywords.some(k=>nt.includes(k.replace(/-/g,' '))); };
    const catVideos = dbEN.filter(v => {
      if (v.tags && v.tags.length) return v.tags.some(t => matchTag(t));
      return matchTitle(v.title);
    });
    const dir = path.join(CAT_DIR, catSlug);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), buildCategoryPage(cat, catVideos), 'utf8');
    console.log(`  📁 /category/${catSlug}/ — ${catVideos.length} video`);
  });
  console.log(`✅ ${FOOTER_CATEGORIES.length} halaman kategori selesai`);

  console.log('\n🏠 Update index.html...');
  fs.writeFileSync(INDEX_FILE, buildHomepage(dbEN, dbID), 'utf8');
  console.log('✅ index.html diperbarui');

  console.log(`\n🎉 Selesai!`);
  console.log(`   /video/         : ${createdEN} halaman (index, follow)`);
  if (dbID.length) console.log(`   /entertainment/ : ${dbID.length} halaman (noindex, nofollow)`);
  console.log(`   /category/      : ${FOOTER_CATEGORIES.length} halaman`);
  console.log(`\n📋 robots.txt yang disarankan:`);
  console.log(`   User-agent: *`);
  console.log(`   Allow: /`);
  console.log(`   Disallow: /entertainment/`);
  console.log(`   Sitemap: https://www.trend4genz.fun/sitemap.xml`);
  console.log(`\n📋 Status Ads (STATIC_AD):`);
  console.log(`   allAds           : ${STATIC_AD.allAds}`);
  console.log(`   useDirect        : ${STATIC_AD.useDirect}`);
  console.log(`   usePlayAds       : ${STATIC_AD.usePlayAds}  (mulai tap ke-${STATIC_AD.playAdsStartFrom})`);
  console.log(`   useNativeBanner1 : ${STATIC_AD.useNativeBanner1}`);
  console.log(`   useNativeBanner2 : ${STATIC_AD.useNativeBanner2}`);
}

main();
