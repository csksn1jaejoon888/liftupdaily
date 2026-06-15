// ══════════════════════════════════════════════════════════════════
//  generate-pages.js  — LiftUpDaily edition
//
//  3 Kategori:
//    1. Personal Growth  (self improvement, productivity, mindset, mental health)
//    2. Business Growth  (entrepreneurship, marketing, finance, startup)
//    3. Home Design      (interior, decor, renovation, architecture)
//
//  SWITCH nama web: ubah BASE_URL dan SITE_NAME di bagian CONFIG
// ══════════════════════════════════════════════════════════════════
'use strict';

const fs   = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════════
//  ★ CONFIG — SWITCH NAMA WEB DI SINI ★
// ════════════════════════════════════════════════════════════════
const BASE_URL   = 'https://www.liftupdaily.com';   // ← ganti
const SITE_NAME  = 'LiftUpDaily';                   // ← ganti
const BRAND_HTML = '<span style="color:#F5A623">LiftUp</span><span style="color:#fff">Daily</span>';
const ACCENT     = '#F5A623';
const DESC_DEF   = 'Daily inspiration on personal growth, business strategies, and home design ideas.';

const DB_FILE_EN    = path.join(__dirname, 'db-en.json');
const DB_FILE_ID    = path.join(__dirname, 'db-id.json');
const BASE_TMPL     = path.join(__dirname, 'index_base.html');
const INDEX_FILE    = path.join(__dirname, 'index.html');
const VIDEO_DIR     = path.join(__dirname, 'video');
const ENTERTAIN_DIR = path.join(__dirname, 'entertainment');
const HOMEPAGE_CARDS = 20;

// ── Helpers ────────────────────────────────────────────────────
function esc(s=''){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function stripHtml(s=''){return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function trunc(s,n=160){const t=stripHtml(s);return t.length<=n?t:t.slice(0,n-1)+'…';}
function rmDir(dir){if(fs.existsSync(dir))fs.rmSync(dir,{recursive:true,force:true});}
function shuffle(arr){return [...arr].sort(()=>0.5-Math.random());}
function videoUrl(v){return v.source==='nofollow'?`${BASE_URL}/entertainment/${v.slug}/`:`${BASE_URL}/video/${v.slug}/`;}

// ════════════════════════════════════════════════════════════════
//  KONFIGURASI ADS
// ════════════════════════════════════════════════════════════════
const STATIC_AD = {
  allAds: false,
  useDirect:        true,
  directUrl:        'https://google.com',
  usePlayAds:       true,
  playAdsUrl:       'https://google.com',
  playAdsStartFrom: 2,
  useNativeBanner1: true,
  nativeBanner1HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#F5A623,#E8724A);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">NATIVE BANNER 1</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan Anda di sini</div></div></div>`,
  useNativeBanner2: false,
  nativeBanner2HTML: `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#1a6b3c,#2ea05a);padding:14px 40px 14px 14px;border-radius:10px;min-height:90px;cursor:pointer;width:100%;" onclick="window.open('https://google.com','_blank')"><div style="flex-grow:1"><div style="color:#fff;font-size:18px;font-weight:900;text-transform:uppercase">NATIVE BANNER 2</div><div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px">Pasang kode iklan Anda di sini</div></div></div>`,
};

// ════════════════════════════════════════════════════════════════
//  3 KATEGORI LiftUpDaily
// ════════════════════════════════════════════════════════════════
const CATEGORIES = [
  {
    key: 'PERSONAL_GROWTH', label: 'Personal Growth', icon: '🌱', slug: 'personal-growth',
    desc: 'Self improvement, productivity, mindset, and mental health videos to help you grow every day.',
    keywords: [
      'self improvement','self-improvement','personal growth','personal development',
      'productivity','mindset','mental health','motivation','habits','discipline',
      'morning routine','success','confidence','anxiety','stress','meditation',
      'focus','goal setting','positive thinking','emotional intelligence','resilience',
      'leadership','communication','self care','self-care','mindfulness','happiness',
      'life skills','overthinking','procrastination','consistency','atomic habits',
      'stoicism','psychology','behavior','dopamine','brain','willpower'
    ]
  },
  {
    key: 'BUSINESS_GROWTH', label: 'Business Growth', icon: '📈', slug: 'business-growth',
    desc: 'Entrepreneurship, marketing, finance, and startup strategies to scale your business.',
    keywords: [
      'business','entrepreneur','entrepreneurship','startup','marketing','sales',
      'finance','investing','passive income','side hustle','money','wealth',
      'stock market','real estate','e-commerce','ecommerce','dropshipping',
      'digital marketing','social media marketing','branding','SEO','content marketing',
      'copywriting','freelancing','remote work','business strategy','leadership',
      'negotiation','networking','personal finance','budgeting','saving','cash flow',
      'venture capital','fundraising','profit','revenue','scaling','growth hacking',
      'amazon fba','shopify','saas','b2b','b2c','roi','kpi'
    ]
  },
  {
    key: 'HOME_DESIGN', label: 'Home Design', icon: '🏡', slug: 'home-design',
    desc: 'Interior design, home decor, renovation ideas, and architecture inspiration for your space.',
    keywords: [
      'home design','interior design','home decor','decoration','renovate','renovation',
      'architecture','modern home','minimalist','living room','bedroom','kitchen',
      'bathroom','furniture','diy home','home improvement','small space','apartment',
      'house tour','home makeover','aesthetic','boho','scandinavian','farmhouse',
      'color palette','lighting','flooring','wallpaper','organizing','storage',
      'garden','landscaping','outdoor','patio','studio apartment','tiny house',
      'open plan','ceiling','tile','wood','concrete','home staging'
    ]
  }
];

// ════════════════════════════════════════════════════════════════
//  SHARED CSS
// ════════════════════════════════════════════════════════════════
function sharedNavbarCSS(){
  return `
    :root{--accent:#F5A623;--accent2:#E8724A;--bg:#0d0d0d;--dark:#1c1c1e;--nav-h-mobile:48px;--nav-h-desktop:60px;--nav-h:var(--nav-h-mobile)}
    @media(min-width:768px){:root{--nav-h:var(--nav-h-desktop)}}
    .navbar-custom{background:#0d0d0d;height:var(--nav-h-mobile);padding:0 14px;position:sticky;top:0;z-index:1000;display:flex;align-items:center;gap:10px;border-bottom:2px solid var(--accent)}
    @media(min-width:768px){.navbar-custom{height:var(--nav-h-desktop);padding:0 22px;gap:16px}}
    .nav-hamburger{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;justify-content:center;gap:5px;padding:6px;flex-shrink:0}
    .nav-hamburger span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:all .25s}
    @media(min-width:768px){.nav-hamburger span{width:26px}}
    .nav-hamburger.active span:nth-child(1){transform:translateY(7px) rotate(45deg)}
    .nav-hamburger.active span:nth-child(2){opacity:0}
    .nav-hamburger.active span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
    .nav-brand{font-weight:900;font-size:.95rem;letter-spacing:-.02em;text-decoration:none;flex-shrink:0}
    @media(min-width:768px){.nav-brand{font-size:1.18rem}}
    .navbar-right-group{display:flex;align-items:center;margin-left:auto;gap:8px}
    .search-wrapper{position:relative;display:flex;align-items:center;z-index:9999}
    .search-container{display:flex;align-items:center;gap:6px;background:#1c1c1e;border-radius:20px;padding:5px 10px;border:1px solid #2a2a2a;transition:border-color .2s}
    .search-container:focus-within{border-color:var(--accent)}
    .search-container input{background:transparent;border:none;color:#fff;outline:none;font-size:.8rem;width:45px;transition:.3s;font-family:inherit}
    .search-container input:focus{width:100px}
    @media(min-width:768px){.search-container input{width:70px}.search-container input:focus{width:140px}}
    .search-icon-btn{background:none;border:none;cursor:pointer;display:flex;align-items:center;padding:0;flex-shrink:0}
    .search-suggestions{position:absolute;top:calc(100% + 6px);right:0;width:265px;background:#1c1c1e;border:1px solid var(--accent);border-radius:10px;overflow:hidden;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.7);display:none}
    .search-suggestions.show{display:block}
    .suggestion-item{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:background .15s;border-bottom:1px solid rgba(255,255,255,.05)}
    .suggestion-item:last-child{border-bottom:none}
    .suggestion-item:hover,.suggestion-item.active{background:rgba(245,166,35,.1)}
    .suggestion-item img{width:52px;height:30px;object-fit:cover;border-radius:4px;flex-shrink:0}
    .suggestion-item span{font-size:.75rem;color:#f1f1f1;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .suggestion-item span em{color:var(--accent);font-style:normal;font-weight:bold}
    .suggestion-empty{padding:12px;text-align:center;font-size:.75rem;color:#888}
    /* Drawer */
    .ham-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1998;opacity:0;pointer-events:none;transition:opacity .25s}
    .ham-overlay.show{opacity:1;pointer-events:all}
    .ham-drawer{position:fixed;top:0;left:0;width:min(290px,84vw);height:100vh;background:#111;z-index:1999;transform:translateX(-100%);transition:transform .28s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;border-right:1px solid #1e1e1e;overflow-y:auto}
    .ham-drawer.show{transform:translateX(0)}
    .ham-header{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #1e1e1e;flex-shrink:0}
    .ham-brand{font-size:1rem;font-weight:900;letter-spacing:-.02em}
    .ham-close{background:none;border:none;color:#666;font-size:1.3rem;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background .15s,color .15s}
    .ham-close:hover{background:#1e1e1e;color:#fff}
    .ham-search{padding:14px 18px;border-bottom:1px solid #1e1e1e;flex-shrink:0}
    .ham-search-inner{display:flex;align-items:center;gap:8px;background:#1c1c1e;border-radius:8px;padding:8px 12px;border:1px solid #2a2a2a}
    .ham-search-inner:focus-within{border-color:var(--accent)}
    .ham-search-inner input{flex:1;background:transparent;border:none;color:#fff;outline:none;font-size:.85rem;font-family:inherit}
    .ham-search-inner input::placeholder{color:#555}
    .ham-nav{flex:1;padding:10px 0}
    .ham-nav-label{font-size:.65rem;font-weight:700;letter-spacing:.12em;color:#444;text-transform:uppercase;padding:14px 18px 6px}
    .ham-nav-item{display:flex;align-items:center;padding:13px 18px;cursor:pointer;color:#bbb;font-size:.88rem;font-weight:600;text-decoration:none;border-left:3px solid transparent;transition:all .15s}
    .ham-nav-item:hover,.ham-nav-item.active{background:rgba(245,166,35,.08);color:#fff;border-left-color:var(--accent)}
    .ham-nav-item-icon{font-size:1.05rem;width:24px;flex-shrink:0}
    .ham-nav-item-label{flex:1;margin-left:10px}
    .ham-nav-item-arrow{font-size:.7rem;color:#333;transition:transform .15s}
    .ham-nav-item:hover .ham-nav-item-arrow{transform:translateX(3px);color:var(--accent)}
    .ham-divider{height:1px;background:#1e1e1e;margin:6px 0}
  `;
}

function sharedFooterCSS(){
  return `
    .site-footer{margin-top:60px;background:#000;border-top:1px solid #1a1a1a}
    .footer-inner{max-width:1200px;margin:0 auto;padding:32px 20px 24px}
    .footer-top{display:grid;gap:28px;grid-template-columns:1fr;margin-bottom:28px}
    @media(min-width:600px){.footer-top{grid-template-columns:1.5fr 1fr 1fr}}
    .footer-brand{font-size:1.05rem;font-weight:900;letter-spacing:-.02em;display:inline-block;margin-bottom:10px}
    .footer-tagline{font-size:.8rem;color:#555;line-height:1.6;max-width:230px}
    .footer-col-title{font-size:.65rem;font-weight:700;letter-spacing:.12em;color:#444;text-transform:uppercase;margin-bottom:12px}
    .footer-links{list-style:none;display:flex;flex-direction:column;gap:8px}
    .footer-links a{font-size:.82rem;color:#666;text-decoration:none;transition:color .15s;display:flex;align-items:center;gap:6px}
    .footer-links a:hover{color:var(--accent)}
    .footer-links a::before{content:'›';color:#333}
    .footer-bottom{padding-top:20px;border-top:1px solid #1a1a1a;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
    .footer-copy{font-size:.72rem;color:#333;letter-spacing:.04em}
    .footer-legal{display:flex;gap:16px}
    .footer-legal a{font-size:.72rem;color:#333;text-decoration:none;transition:color .15s}
    .footer-legal a:hover{color:var(--accent)}
  `;
}

function sharedNavbarHTML(activeCatSlug=''){
  const navItems = CATEGORIES.map(c =>
    `<a href="/category/${c.slug}/" class="ham-nav-item${activeCatSlug===c.slug?' active':''}" onclick="closeHamMenu()">
      <span class="ham-nav-item-icon">${c.icon}</span>
      <span class="ham-nav-item-label">${c.label}</span>
      <span class="ham-nav-item-arrow">›</span>
    </a>`
  ).join('');

  return `
<div class="ham-overlay" id="ham-overlay" onclick="closeHamMenu()"></div>
<div class="ham-drawer" id="ham-drawer">
  <div class="ham-header">
    <div class="ham-brand">${BRAND_HTML}</div>
    <button class="ham-close" onclick="closeHamMenu()">&#x2715;</button>
  </div>
  <div class="ham-search">
    <div class="ham-search-inner">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#555" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="hamSearchInput" placeholder="Search topics..." type="text" autocomplete="off"/>
    </div>
  </div>
  <nav class="ham-nav">
    <div class="ham-nav-label">Browse</div>
    <a href="/" class="ham-nav-item" onclick="closeHamMenu()">
      <span class="ham-nav-item-icon">🏠</span>
      <span class="ham-nav-item-label">Home</span>
      <span class="ham-nav-item-arrow">›</span>
    </a>
    <div class="ham-divider"></div>
    <div class="ham-nav-label">Categories</div>
    ${navItems}
  </nav>
</div>
<nav class="navbar-custom">
  <button class="nav-hamburger" id="nav-hamburger" onclick="toggleHamMenu()" aria-label="Open menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
  <a href="${BASE_URL}/" class="nav-brand">${BRAND_HTML}</a>
  <div class="navbar-right-group">
    <div class="search-wrapper">
      <div class="search-container">
        <input id="searchInput" placeholder="Search..." type="text" autocomplete="off"/>
        <button class="search-icon-btn" id="searchBtn" aria-label="Search">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>
      <div class="search-suggestions" id="searchSuggestions"></div>
    </div>
  </div>
</nav>`;
}

function sharedFooterHTML(isNoIndex){
  const year = new Date().getFullYear();
  if(isNoIndex){
    return `<footer class="site-footer"><div class="footer-inner"><div class="footer-bottom"><p class="footer-copy">© ${year} ${SITE_NAME}. All rights reserved.</p></div></div></footer>`;
  }
  const catLinks = CATEGORIES.map(c =>
    `<li><a href="/category/${c.slug}/">${c.icon} ${c.label}</a></li>`
  ).join('');
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-brand">${BRAND_HTML}</div>
        <p class="footer-tagline">Daily inspiration on personal growth, business strategies, and home design. Watch and level up every day.</p>
      </div>
      <div>
        <div class="footer-col-title">Categories</div>
        <ul class="footer-links">${catLinks}</ul>
      </div>
      <div>
        <div class="footer-col-title">Site</div>
        <ul class="footer-links">
          <li><a href="${BASE_URL}/">Home</a></li>
          <li><a href="/about/">About</a></li>
          <li><a href="/privacy-policy/">Privacy Policy</a></li>
          <li><a href="${BASE_URL}/contact/">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© ${year} ${SITE_NAME}. All rights reserved.</p>
      <nav class="footer-legal">
        <a href="/privacy-policy/">Privacy</a>
        <a href="${BASE_URL}/terms/">Terms</a>
        <a href="${BASE_URL}/sitemap.xml">Sitemap</a>
      </nav>
    </div>
  </div>
</footer>`;
}

function sharedHamJS(){
  return `
function toggleHamMenu(){
  var d=document.getElementById('ham-drawer'),o=document.getElementById('ham-overlay'),b=document.getElementById('nav-hamburger');
  if(d.classList.contains('show')){closeHamMenu();}
  else{d.classList.add('show');o.classList.add('show');b.classList.add('active');b.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
}
function closeHamMenu(){
  document.getElementById('ham-drawer').classList.remove('show');
  document.getElementById('ham-overlay').classList.remove('show');
  document.getElementById('nav-hamburger').classList.remove('active');
  document.getElementById('nav-hamburger').setAttribute('aria-expanded','false');
  document.body.style.overflow='';
}
(function(){
  var hi=document.getElementById('hamSearchInput');if(!hi)return;
  hi.addEventListener('keydown',function(e){if(e.key==='Enter'){var v=this.value.trim();if(v){closeHamMenu();window.location.href='/?search='+encodeURIComponent(v);}}});
})();`;
}

// ════════════════════════════════════════════════════════════════
//  WIDE SCREEN BADGE
// ════════════════════════════════════════════════════════════════
function wideScreenScript(pageUrl){
  return `
<style>
.ws-badge{display:inline-flex;align-items:center;gap:4px;background:${ACCENT};color:#000;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:5px;cursor:pointer;vertical-align:middle;white-space:nowrap;border:none;outline:none;transition:background .15s,transform .1s;float:right;margin-left:8px;margin-top:2px;line-height:1.4}
.ws-badge:active{transform:scale(.96)}
#ws-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;align-items:flex-end;justify-content:center}
#ws-modal-overlay.show{display:flex}
#ws-modal-box{background:#1c1c1e;border-radius:18px 18px 0 0;padding:22px 20px 36px;width:100%;max-width:480px;border-top:3px solid ${ACCENT};transform:translateY(100%);transition:transform .32s cubic-bezier(.22,1,.36,1)}
#ws-modal-overlay.show #ws-modal-box{transform:translateY(0)}
.ws-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.ws-modal-title{font-size:1rem;font-weight:900;color:${ACCENT};display:flex;align-items:center;gap:7px}
.ws-modal-close{background:rgba(255,255,255,.1);border:none;color:#fff;width:28px;height:28px;border-radius:50%;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ws-modal-subtitle{font-size:.82rem;color:#aaa;margin-bottom:22px;line-height:1.5}
.ws-modal-subtitle strong{color:#fff}
.ws-open-label{font-size:.7rem;font-weight:800;color:#555;text-transform:uppercase;letter-spacing:.1em;text-align:center;margin-bottom:12px}
.ws-browser-btns{display:flex;gap:12px;justify-content:center}
.ws-browser-btn{flex:1;max-width:160px;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 10px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:14px;cursor:pointer;transition:background .15s,border-color .15s,transform .1s;color:#fff;font-size:.82rem;font-weight:800;text-transform:uppercase}
.ws-browser-btn:hover{background:rgba(245,166,35,.12);border-color:${ACCENT};color:${ACCENT}}
.ws-browser-btn:active{transform:scale(.97)}
.ws-browser-btn img{width:40px;height:40px;border-radius:10px;object-fit:contain}
</style>
<div id="ws-modal-overlay" onclick="wsCloseModal(event)">
  <div id="ws-modal-box">
    <div class="ws-modal-header">
      <div class="ws-modal-title">🖥️ Full Wide Screen</div>
      <button class="ws-modal-close" onclick="wsCloseModal(null)">&#x2715;</button>
    </div>
    <p class="ws-modal-subtitle" id="ws-modal-subtitle"></p>
    <p class="ws-open-label">Open in your browser</p>
    <div class="ws-browser-btns" id="ws-browser-btns"></div>
  </div>
</div>
<script>
(function(){
  var PAGE_URL='${pageUrl}';
  var ua=navigator.userAgent||'',ref=document.referrer||'',qs=location.search||'';
  var isFB=(/FBAN|FBAV|FB_IAB|FBIOS|FBANDROID|Instagram/.test(ua)||/facebook/.test(ref)||/ref=fb|utm_source=facebook/.test(qs));
  var isX=(/Twitter|TwitterAndroid|TwitteriPhone/.test(ua)||/twitter|t\\.co|x\\.com/.test(ref)||/ref=x|utm_source=twitter|utm_source=x/.test(qs));
  var isAndroid=/Android/.test(ua),isIOS=/iPhone|iPad|iPod/.test(ua);
  if(!isFB&&!isX)return;
  function injectBadge(){var h1=document.querySelector('.info-section h1');if(!h1)return;var b=document.createElement('button');b.className='ws-badge';b.textContent='FULL WIDE SCREEN';b.onclick=wsHandleClick;h1.insertBefore(b,h1.firstChild);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectBadge);else injectBadge();
  window.wsHandleClick=function(){
    var sub=document.getElementById('ws-modal-subtitle'),bw=document.getElementById('ws-browser-btns');
    sub.innerHTML='Your <strong>'+(isFB?'Facebook':'X (Twitter)')+'</strong> browser does not support full wide screen.';
    bw.innerHTML='';
    if(!isIOS){var bc=document.createElement('button');bc.className='ws-browser-btn';bc.innerHTML='<img src="https://www.google.com/s2/favicons?domain=google.com&sz=64" width="40" height="40" alt="Chrome"/>Chrome';bc.onclick=wsOpenChrome;bw.appendChild(bc);}
    if(isIOS){var bs=document.createElement('button');bs.className='ws-browser-btn';bs.innerHTML='<img src="https://www.google.com/s2/favicons?domain=apple.com&sz=64" width="44" height="44" alt="Safari"/>Safari';bs.onclick=wsOpenSafari;bw.appendChild(bs);}
    if(!isAndroid&&!isIOS){var bc2=document.createElement('button');bc2.className='ws-browser-btn';bc2.innerHTML='<img src="https://www.google.com/s2/favicons?domain=google.com&sz=64" width="44" height="44" alt="Chrome"/>Chrome';bc2.onclick=wsOpenChrome;bw.appendChild(bc2);var bs2=document.createElement('button');bs2.className='ws-browser-btn';bs2.innerHTML='<img src="https://www.google.com/s2/favicons?domain=apple.com&sz=64" width="44" height="44" alt="Safari"/>Safari';bs2.onclick=wsOpenSafari;bw.appendChild(bs2);}
    document.getElementById('ws-modal-overlay').classList.add('show');document.body.style.overflow='hidden';
  };
  window.wsOpenChrome=function(){var h=PAGE_URL.replace('https://','').replace('http://','');window.location.href='intent://'+h+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(PAGE_URL)+';end';};
  window.wsOpenSafari=function(){window.location.href=PAGE_URL;};
  window.wsCloseModal=function(e){if(e&&e.target!==document.getElementById('ws-modal-overlay'))return;document.getElementById('ws-modal-overlay').classList.remove('show');document.body.style.overflow='';};
})();
<\/script>`;
}

// ════════════════════════════════════════════════════════════════
//  BUILD HALAMAN VIDEO STATIS
// ════════════════════════════════════════════════════════════════
function buildVideoPage(v, allVideos, isNoIndex){
  const canonical  = videoUrl(v);
  const thumb      = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const thumbOg    = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const desc       = trunc(v.summary||DESC_DEF, 160);
  const uploadDate = v.uploadDate||new Date().toISOString();
  const tags       = v.tags||[];
  const related    = shuffle(allVideos.filter(r=>r.slug!==v.slug)).slice(0,30);
  const robotsContent = isNoIndex?'noindex,nofollow,noarchive,noimageindex':'index,follow';
  const canonicalTag  = isNoIndex?'':`<link rel="canonical" href="${canonical}"/>`;
  const jsonLdTag     = isNoIndex?'':`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'VideoObject','name':v.title,'description':desc,'thumbnailUrl':[thumb],'uploadDate':uploadDate,'embedUrl':`https://www.youtube.com/embed/${v.youtubeId}`,'url':canonical,'publisher':{'@type':'Organization','name':SITE_NAME,'url':BASE_URL,'logo':{'@type':'ImageObject','url':BASE_URL+'/logo.png'}}})}<\/script>`;
  const faqTag        = (!isNoIndex&&v.faqSchema)?`<script type="application/ld+json">${JSON.stringify(v.faqSchema).replace(/<\/script>/gi,'<\\/script>')}<\/script>`:'';

  const tagsHtml = tags.length
    ? `<div class="seo-tags-container">${tags.map(t=>isNoIndex?`<span class="seo-tag-badge">#${esc(t)}</span>`:`<a href="${BASE_URL}/?tag=${encodeURIComponent(t)}" class="seo-tag-badge">#${esc(t)}</a>`).join('')}</div>`
    : '';

  const mobileRelatedHtml = related.slice(0,8).map(r=>
    `<a href="${videoUrl(r)}" class="slider-item" style="text-decoration:none;color:inherit;display:block" ${r.source==='nofollow'?'rel="nofollow noopener"':''}>
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg" alt="${esc(r.title)}" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  const sideRelatedHtml = related.slice(0,20).map(r=>
    `<a href="${videoUrl(r)}" class="side-slider-item" ${r.source==='nofollow'?'rel="nofollow noopener"':''}>
      <img src="https://img.youtube.com/vi/${r.youtubeId}/mqdefault.jpg" alt="${esc(r.title)}" loading="lazy" width="108" height="60" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:108px;height:60px;object-fit:cover;flex-shrink:0"/>
      <p>${esc(r.title)}</p>
    </a>`).join('');

  const sliderDataJson = JSON.stringify(
    allVideos.filter(r=>r.slug!==v.slug).map(r=>({slug:r.slug,youtubeId:r.youtubeId,title:r.title,source:r.source||'seo'}))
  );

  function makeBanner(uid,html){return `<div class="native-banner-wrap" id="nb-${uid}"><div class="close-btn" onclick="this.closest('.native-banner-wrap').style.display='none'">✕</div><div class="native-banner-inner">${html}</div></div>`;}
  const nb1Mobile  = STATIC_AD.allAds&&STATIC_AD.useNativeBanner1?makeBanner('1m',STATIC_AD.nativeBanner1HTML):'';
  const nb2Mobile  = STATIC_AD.allAds&&STATIC_AD.useNativeBanner2?makeBanner('2m',STATIC_AD.nativeBanner2HTML):'';
  const nb1Desktop = STATIC_AD.allAds&&STATIC_AD.useNativeBanner1?makeBanner('1d',STATIC_AD.nativeBanner1HTML):'';
  const nb2Desktop = STATIC_AD.allAds&&STATIC_AD.useNativeBanner2?makeBanner('2d',STATIC_AD.nativeBanner2HTML):'';

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
  <meta name="twitter:card"       content="summary_large_image"/>
  <meta name="twitter:title"      content="${esc(v.title)}"/>
  <meta name="twitter:image"      content="${thumbOg}"/>
  <!-- Pinterest rich pin -->
  <meta name="pinterest:description" content="${esc(desc)}"/>
  ${jsonLdTag}
  ${faqTag}
  <link rel="preload" as="image" href="${thumb}" fetchpriority="high"/>
  <link rel="preconnect" href="https://img.youtube.com"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d0d0d;color:#f1f1f1;font-family:'Inter','Segoe UI',sans-serif;overflow-x:hidden}
    ${sharedNavbarCSS()}
    ${sharedFooterCSS()}

    .video-page-container{width:100%;max-width:860px;margin:0 auto;padding:14px}
    @media(max-width:600px){.video-page-container{padding:0}}
    @media(min-width:992px){
      .video-page-container{max-width:1200px}
      .video-desktop-layout{display:flex;gap:22px;align-items:flex-start}
      .video-main-col{flex:1 1 0;min-width:0}
      .video-side-col{width:290px;flex-shrink:0;position:sticky;top:calc(var(--nav-h-desktop)+10px);display:flex;flex-direction:column;gap:0}
      .side-related-label{color:var(--accent);font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 0;flex-shrink:0}
      .side-slider{display:flex;flex-direction:column;gap:8px;max-height:calc(100vh - var(--nav-h-desktop) - 220px);overflow-y:auto;scrollbar-width:none;flex-shrink:0}
      .side-slider::-webkit-scrollbar{display:none}
      .side-slider-item{display:flex;gap:8px;background:#1c1c1e;border-radius:8px;overflow:hidden;text-decoration:none;color:inherit;border:1px solid transparent;transition:.2s;flex-shrink:0}
      .side-slider-item:hover{border-color:var(--accent)}
      .side-slider-item img{width:108px;height:60px;object-fit:cover;flex-shrink:0}
      .side-slider-item p{font-size:.72rem;padding:6px 8px;margin:0;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:#ccc}
      .side-nb-block{width:100%;flex-shrink:0;margin:8px 0}
      .nb-mobile-only{display:none}
      .recommendation-slider-wrap{display:none}
    }
    @media(max-width:991px){.video-desktop-layout{display:block}.video-side-col{display:none}}

    .player-container{position:relative;width:100%;background:#000;border-radius:12px;overflow:hidden;aspect-ratio:16/9}
    @media(max-width:600px){.player-container{border-radius:0}}
    .player-container iframe{position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1}
    .player-container>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2}
    .play-overlay{position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;gap:10px}
    .play-btn-svg{width:68px;height:68px;filter:drop-shadow(0 0 14px rgba(245,166,35,.8));transition:transform .15s}
    .play-overlay:hover .play-btn-svg{transform:scale(1.1)}
    .play-overlay-label{font-size:.95rem;font-weight:800;color:#fff;letter-spacing:.08em;text-shadow:0 2px 8px rgba(0,0,0,.8)}
    .video-mask{position:absolute;z-index:99999;background:transparent;pointer-events:all;touch-action:none}
    .mask-top{top:0;left:0;width:55%;height:94px}
    .mask-bottom{bottom:0;left:40%;width:100%;height:43px}
    .btn-fs-custom{position:absolute;bottom:16px;right:16px;z-index:2147483647;cursor:pointer;background:transparent;color:#fff;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:0 0 16px var(--accent);border:2px solid var(--accent)}

    .info-section{padding:14px}
    .info-section h1{font-size:1.15rem;font-weight:800;line-height:1.4;margin:12px 0}
    @media(min-width:768px){.info-section h1{font-size:1.3rem}}
    .dual-action-wrap{display:flex;gap:10px;margin-bottom:16px}
    .home-split-btn{width:50%;border:none;padding:10px 6px;border-radius:10px;font-weight:800;background:var(--accent);color:#000;font-size:.8rem;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s;font-family:inherit}
    .home-split-btn:hover{filter:brightness(1.1);transform:translateY(-2px)}
    .offer-split-btn{width:50%;border:none;padding:10px 6px;border-radius:10px;font-weight:800;color:#fff;font-size:.8rem;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,var(--accent),var(--accent2));animation:pulse-offer 2s infinite;font-family:inherit}
    @keyframes pulse-offer{0%,100%{box-shadow:0 0 14px rgba(245,166,35,.4)}50%{box-shadow:0 0 24px rgba(245,166,35,.75)}}

    .summary-box{background:#000;padding:20px;border-radius:10px}
    .summary-text{font-size:.9rem;line-height:1.7;color:#ccc}
    .summary-text h2{font-size:1.05rem;font-weight:700;margin:20px 0 8px;color:#fff}
    .summary-text h3{font-size:.95rem;font-weight:600;margin:16px 0 6px;color:#fff}
    .summary-text p{font-size:.9rem;line-height:1.7;margin-bottom:12px;color:#ccc}
    .summary-text ul{margin-bottom:12px;padding-left:20px}
    .summary-text li{font-size:.9rem;line-height:1.5;margin-bottom:5px;color:#ccc}
    .summary-text strong{color:#fff}

    .seo-tags-container{margin-top:15px;padding-top:14px;border-top:1px solid #1e1e1e;display:flex;flex-wrap:wrap;gap:6px}
    .seo-tag-badge{background:#111;color:var(--accent);border:1px solid #2a2a2a;padding:4px 10px;border-radius:4px;font-size:.75rem;font-weight:500;text-decoration:none;transition:.15s;display:inline-block}
    .seo-tag-badge:hover{background:#1e1e1e;border-color:var(--accent);color:#fff}
    .more-videos-label{color:var(--accent);margin:20px 0 10px;font-size:.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}

    .recommendation-slider{display:flex;overflow-x:auto;gap:10px;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
    .recommendation-slider::-webkit-scrollbar{display:none}
    .slider-item{min-width:150px;max-width:150px;background:#1c1c1e;border-radius:8px;overflow:hidden;flex-shrink:0;transition:.2s;border:1px solid transparent;text-decoration:none;color:inherit;display:block}
    .slider-item:hover{border-color:var(--accent);transform:translateY(-2px)}
    .slider-item img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
    .slider-item p{font-size:.7rem;padding:6px 8px 8px;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35;min-height:42px;color:#ccc}

    .native-banner-wrap{position:relative;width:100%;margin:10px 0;border-radius:10px;overflow:hidden;min-height:90px}
    .native-banner-wrap .close-btn{position:absolute;top:6px;right:6px;width:26px;height:26px;background:rgba(0,0,0,.65);color:#fff;border:2px solid #fff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;cursor:pointer;z-index:10}
    .native-banner-inner{width:100%;min-height:90px;display:flex;flex-direction:column;justify-content:center}
  </style>
</head>
<body>
${wideScreenScript(canonical)}
${sharedNavbarHTML()}
<main>
<div class="video-page-container">
  <div class="video-desktop-layout">
    <div class="video-main-col">
      <div class="player-container" id="player-box">
        <img src="${thumb}" alt="${esc(v.title)}" width="480" height="270" fetchpriority="high" decoding="sync"/>
        <div class="play-overlay" onclick="startPlay()">
          <svg class="play-btn-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,.55)" stroke="${ACCENT}" stroke-width="3"/>
            <polygon points="32,24 60,40 32,56" fill="${ACCENT}"/>
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
        <div class="nb-mobile-only">${nb1Mobile}</div>
        <div class="summary-box">
          <div class="summary-text">${v.summary||'<p>'+esc(desc)+'</p>'}</div>
          ${tagsHtml}
        </div>
        <div class="nb-mobile-only">${nb2Mobile}</div>
        <div class="recommendation-slider-wrap">
          <p class="more-videos-label">MORE VIDEOS</p>
          <div class="recommendation-slider" id="rec-slider">${mobileRelatedHtml}</div>
        </div>
      </div>
    </div>
    <div class="video-side-col">
      ${nb1Desktop?`<div class="side-nb-block">${nb1Desktop}</div>`:''}
      <div class="side-related-label">✨ Related Videos</div>
      <div class="side-slider" id="side-slider-desktop">${sideRelatedHtml}</div>
      ${nb2Desktop?`<div class="side-nb-block">${nb2Desktop}</div>`:''}
    </div>
  </div>
</div>
</main>
${sharedFooterHTML(isNoIndex)}
<script>
var STATIC_AD={allAds:${STATIC_AD.allAds},useDirect:${STATIC_AD.useDirect},directUrl:'${STATIC_AD.directUrl}',usePlayAds:${STATIC_AD.usePlayAds},playAdsUrl:'${STATIC_AD.playAdsUrl}',playAdsStartFrom:${STATIC_AD.playAdsStartFrom}};
var _playCount=0;
function handleMoreInfo(){if(STATIC_AD.allAds&&STATIC_AD.useDirect)window.open(STATIC_AD.directUrl,'_blank');}
function startPlay(){
  _playCount++;
  if(STATIC_AD.allAds&&STATIC_AD.usePlayAds&&_playCount>=STATIC_AD.playAdsStartFrom)window.open(STATIC_AD.playAdsUrl,'_blank');
  var pb=document.getElementById('player-box');
  pb.innerHTML='<iframe src="https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&fs=0&controls=1&playsinline=1" allow="autoplay;encrypted-media;fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:none;z-index:1"></iframe><div class="video-mask mask-top"></div><div class="video-mask mask-bottom"></div><div id="fs-btn" class="btn-fs-custom" onclick="toggleFS()"><svg id="fs-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></svg></div>';
}
function toggleFS(){var el=document.getElementById('player-box'),svg=document.getElementById('fs-icon');if(!document.fullscreenElement&&!document.webkitFullscreenElement){(el.requestFullscreen||el.webkitRequestFullscreen).call(el);if(svg)svg.innerHTML='<polyline points="8 3 3 3 3 8"/><line x1="3" y1="3" x2="10" y2="10"/><polyline points="21 8 21 3 16 3"/><line x1="21" y1="3" x2="14" y2="10"/><polyline points="3 16 3 21 8 21"/><line x1="3" y1="21" x2="10" y2="14"/><polyline points="16 21 21 21 21 16"/><line x1="21" y1="21" x2="14" y2="14"/>';}else{(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(svg)svg.innerHTML='<polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/>'; }}
${sharedHamJS()}
var _db=${sliderDataJson};
(function(){
  var inp=document.getElementById('searchInput'),btn=document.getElementById('searchBtn'),sug=document.getElementById('searchSuggestions'),ai=-1;
  function hl(t,q){return t.split(q).join('<em>'+q+'</em>');}
  function hide(){sug.classList.remove('show');sug.innerHTML='';ai=-1;}
  function getUrl(r){return r.source==='nofollow'?'${BASE_URL}/entertainment/'+r.slug+'/':'${BASE_URL}/video/'+r.slug+'/';}
  function upA(items){items.forEach(function(el,i){el.classList.toggle('active',i===ai);});}
  inp.addEventListener('input',function(){
    var val=inp.value.trim().toLowerCase();ai=-1;if(!val){hide();return;}
    var m=_db.filter(function(r){return r.title.toLowerCase().indexOf(val)!==-1;}).slice(0,7);
    if(!m.length){sug.innerHTML='<div class="suggestion-empty">No results for "<b>'+val+'</b>"</div>';sug.classList.add('show');return;}
    sug.innerHTML=m.map(function(r){return'<div class="suggestion-item" data-url="'+getUrl(r)+'"><img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" alt=""/><span>'+hl(r.title,val)+'</span></div>';}).join('');
    sug.classList.add('show');
    sug.querySelectorAll('.suggestion-item').forEach(function(el){el.addEventListener('mousedown',function(e){e.preventDefault();window.location.href=el.dataset.url;});});
  });
  inp.addEventListener('keydown',function(e){
    var items=sug.querySelectorAll('.suggestion-item');
    if(e.key==='ArrowDown'){e.preventDefault();ai=Math.min(ai+1,items.length-1);upA(items);}
    else if(e.key==='ArrowUp'){e.preventDefault();ai=Math.max(ai-1,-1);upA(items);}
    else if(e.key==='Enter'){if(ai>=0&&items[ai])window.location.href=items[ai].dataset.url;else{var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);}}
    else if(e.key==='Escape'){hide();inp.blur();}
  });
  btn.addEventListener('click',function(){var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);});
  document.addEventListener('click',function(e){if(!e.target.closest('.search-wrapper'))hide();});
})();
var _loaded=8;
document.getElementById('rec-slider').addEventListener('scroll',function(){
  if(this.scrollLeft+this.clientWidth>=this.scrollWidth-120){
    var next=_db.slice(_loaded,_loaded+8);if(!next.length){_loaded=0;next=_db.slice(0,8);}
    next.forEach(function(r){
      var url=r.source==='nofollow'?'${BASE_URL}/entertainment/'+r.slug+'/':'${BASE_URL}/video/'+r.slug+'/';
      var a=document.createElement('a');a.className='slider-item';a.href=url;if(r.source==='nofollow')a.setAttribute('rel','nofollow noopener');
      a.style.cssText='text-decoration:none;color:inherit;display:block';
      a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="160" height="90" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
      document.getElementById('rec-slider').appendChild(a);
    });_loaded+=next.length;
  }
});
(function(){
  var side=document.getElementById('side-slider-desktop');if(!side)return;
  var sl=20;
  side.addEventListener('scroll',function(){
    if(this.scrollTop+this.clientHeight>=this.scrollHeight-100){
      var next=_db.slice(sl,sl+10);if(!next.length){sl=0;next=_db.slice(0,10);}
      next.forEach(function(r){
        var url=r.source==='nofollow'?'${BASE_URL}/entertainment/'+r.slug+'/':'${BASE_URL}/video/'+r.slug+'/';
        var a=document.createElement('a');a.className='side-slider-item';a.href=url;if(r.source==='nofollow')a.setAttribute('rel','nofollow noopener');
        a.innerHTML='<img src="https://img.youtube.com/vi/'+r.youtubeId+'/mqdefault.jpg" loading="lazy" width="108" height="60" onload="this.style.opacity=1" style="opacity:0;transition:opacity .3s;width:108px;height:60px;object-fit:cover;flex-shrink:0"/><p>'+r.title.replace(/</g,'&lt;')+'</p>';
        side.appendChild(a);
      });sl+=next.length;
    }
  });
})();
<\/script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  BUILD HOMEPAGE
// ════════════════════════════════════════════════════════════════
function buildHomepage(dbEN, dbID){
  const allVideos = [...dbEN,...dbID];
  const featured  = shuffle(allVideos).slice(0,HOMEPAGE_CARDS);
  const hardcodedSlugs = JSON.stringify(featured.map(v=>v.slug));
  const allVideosMini  = JSON.stringify(allVideos.map(v=>({slug:v.slug,youtubeId:v.youtubeId,title:v.title,tags:v.tags||[],source:v.source||'seo'})));
  let html = fs.readFileSync(BASE_TMPL,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n');

  const APP_START = '    <div class="main-content" id="app">';
  const APP_END   = '  </main>';
  const startIdx  = html.indexOf(APP_START);
  const endIdx    = html.indexOf(APP_END);
  if(startIdx===-1||endIdx===-1){console.error('❌ Tidak bisa menemukan #app block di index_base.html');process.exit(1);}

  function cardHtml(v,idx){
    const loading=idx<4?'eager':'lazy';
    const fp=idx<4?' fetchpriority="high"':'';
    const href=v.source==='nofollow'?`/entertainment/${v.slug}/`:`/video/${v.slug}/`;
    const rel=v.source==='nofollow'?' rel="nofollow noopener"':'';
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

  const newApp = `    <div class="main-content" id="app">
      <p class="section-label">✨ Trending Now</p>
      <div class="video-grid" id="video-grid-inner">
${featured.map((v,i)=>cardHtml(v,i)).join('\n')}
      </div>
      <div class="load-more-wrap">
        <button class="btn-load-more" id="btn-load-more" onclick="loadMore()">Load More</button>
      </div>
    </div>
  </main>`;

  html = html.slice(0,startIdx) + newApp + html.slice(endIdx+APP_END.length);

  const patchScript=`
var _ALL_VIDEOS=${allVideosMini};
var _SHOWN_SLUGS=new Set(${hardcodedSlugs});
window._navigateTo_override=function(slug){
  var video=_ALL_VIDEOS.find(function(v){return v.slug===slug;});
  if(!video)return;
  window.location.href=video.source==='nofollow'?'/entertainment/'+video.slug+'/':'/video/'+video.slug+'/';
};
(function(){
  var _origAEL=window.addEventListener.bind(window);
  window.addEventListener=function(type,fn,opts){
    if(type==='load'){
      _origAEL('load',async function(){
        videoDatabaseEN=_ALL_VIDEOS.filter(function(v){return v.source!=='nofollow';});
        videoDatabaseID=_ALL_VIDEOS.filter(function(v){return v.source==='nofollow';});
        videoDatabaseALL=_ALL_VIDEOS.slice();
        currentData=videoDatabaseALL.filter(function(v){return!_SHOWN_SLUGS.has(v.slug);});
        currentPage=0;
        if(typeof navigateTo==='function')window.navigateTo=window._navigateTo_override;
        if(typeof initSearch==='function')initSearch();
        var params=new URLSearchParams(location.search);
        if(params.get('tag')||params.get('search')){if(typeof router==='function')await router();}
      },opts);
    }else{_origAEL(type,fn,opts);}
  };
})();`;

  const TMPL_SCRIPT_START='\n<script>\n';
  const afterMain=html.indexOf('</main>');
  const scriptPos=html.indexOf(TMPL_SCRIPT_START,afterMain);
  if(scriptPos!==-1){
    html=html.slice(0,scriptPos)+'\n<script>\n'+patchScript+'\n<\/script>'+html.slice(scriptPos);
  }else{
    html=html.replace('</body>','<script>\n'+patchScript+'\n<\/script>\n</body>');
  }
  return html;
}

// ════════════════════════════════════════════════════════════════
//  BUILD KATEGORI
// ════════════════════════════════════════════════════════════════
function buildCategoryPage(cat, videos){
  const canonical = `${BASE_URL}/category/${cat.slug}/`;
  const pageTitle = `${cat.label} Videos — ${SITE_NAME}`;
  const pageDesc  = cat.desc;
  const breadcrumbLd=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':BASE_URL+'/'},{'@type':'ListItem','position':2,'name':cat.label,'item':canonical}]});
  const itemListLd=JSON.stringify({'@context':'https://schema.org','@type':'ItemList','name':cat.label,'url':canonical,'numberOfItems':videos.length,'itemListElement':videos.slice(0,10).map((v,i)=>({'@type':'ListItem','position':i+1,'url':`${BASE_URL}/video/${v.slug}/`,'name':v.title}))});
  const cardsHtml=videos.length
    ?videos.map((v,i)=>{const loading=i<6?'eager':'lazy';const fp=i<6?' fetchpriority="high"':'';return`<a href="${BASE_URL}/video/${v.slug}/" class="cat-card"><div class="cat-thumb"><img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" alt="${esc(v.title)}" loading="${loading}"${fp} decoding="async" width="320" height="180" onload="this.style.opacity=1" onerror="this.src='https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg'"/></div><div class="cat-title">${esc(v.title)}</div></a>`;}).join('\n')
    :`<div class="cat-empty">No videos found for this category yet. Check back soon!</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(pageDesc)}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="${canonical}"/>
  <link rel="icon" href="${BASE_URL}/logo.png" sizes="96x96" type="image/png"/>
  <!-- Pinterest -->
  <meta name="pinterest:description" content="${esc(pageDesc)}"/>
  <script type="application/ld+json">${breadcrumbLd}<\/script>
  <script type="application/ld+json">${itemListLd}<\/script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d0d0d;color:#f1f1f1;font-family:'Inter','Segoe UI',sans-serif;overflow-x:hidden}
    ${sharedNavbarCSS()}
    ${sharedFooterCSS()}
    .cat-page{max-width:1200px;margin:0 auto;padding:20px 16px}
    .breadcrumb{display:flex;align-items:center;gap:6px;margin-bottom:18px;font-size:.78rem;color:#555;flex-wrap:wrap}
    .breadcrumb a{color:#777;text-decoration:none;transition:.15s}
    .breadcrumb a:hover{color:var(--accent)}
    .breadcrumb-sep{color:#333}
    .cat-header{display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #1e1e1e}
    .cat-icon-big{font-size:2.2rem;line-height:1}
    .cat-header-text h1{font-size:1.3rem;font-weight:900;color:#fff}
    .cat-header-text p{font-size:.8rem;color:#666;margin-top:4px}
    .cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
    @media(min-width:600px){.cat-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}}
    @media(min-width:900px){.cat-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}
    .cat-card{display:block;text-decoration:none;color:inherit;background:#1c1c1e;border-radius:10px;overflow:hidden;border:1px solid transparent;transition:.2s}
    .cat-card:hover{border-color:var(--accent);transform:translateY(-2px)}
    .cat-thumb{width:100%;aspect-ratio:16/9;background:#111;overflow:hidden}
    .cat-thumb img{width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity .3s}
    .cat-title{font-size:.75rem;font-weight:600;padding:8px 10px 10px;line-height:1.4;color:#e0e0e0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .cat-empty{color:#555;font-size:.9rem;padding:60px;text-align:center;grid-column:1/-1}
  </style>
</head>
<body>
${sharedNavbarHTML(cat.slug)}
<main>
<div class="cat-page">
  <nav class="breadcrumb">
    <a href="${BASE_URL}/">Home</a>
    <span class="breadcrumb-sep">›</span>
    <span>${esc(cat.label)}</span>
  </nav>
  <div class="cat-header">
    <div class="cat-icon-big">${cat.icon}</div>
    <div class="cat-header-text">
      <h1>${esc(cat.label)}</h1>
      <p>${videos.length} videos</p>
    </div>
  </div>
  <div class="cat-grid">${cardsHtml}</div>
</div>
</main>
${sharedFooterHTML(false)}
<script>
${sharedHamJS()}
(function(){
  var inp=document.getElementById('searchInput'),btn=document.getElementById('searchBtn');
  function doSearch(){var q=inp.value.trim();if(q)window.location.href='${BASE_URL}/?search='+encodeURIComponent(q);}
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
  btn.addEventListener('click',doSearch);
})();
<\/script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════
function main(){
  if(!fs.existsSync(DB_FILE_EN)){console.error('❌ db-en.json tidak ditemukan!');process.exit(1);}
  if(!fs.existsSync(BASE_TMPL)){
    if(!fs.existsSync(INDEX_FILE)){console.error('❌ index_base.html dan index.html keduanya tidak ada!');process.exit(1);}
    console.log('⚠️  index_base.html tidak ada → copy dari index.html...');
    fs.copyFileSync(INDEX_FILE,BASE_TMPL);
  }

  const rawEN=JSON.parse(fs.readFileSync(DB_FILE_EN,'utf8'));
  const dbEN=rawEN.filter(v=>v.slug&&v.youtubeId&&v.title).map(v=>({...v,source:'seo'}));
  console.log(`📦 db-en.json: ${rawEN.length} total → ${dbEN.length} valid`);

  let dbID=[];
  if(fs.existsSync(DB_FILE_ID)){
    const rawID=JSON.parse(fs.readFileSync(DB_FILE_ID,'utf8'));
    dbID=rawID.filter(v=>v.slug&&v.youtubeId&&v.title).map(v=>({...v,source:'nofollow'}));
    console.log(`📦 db-id.json: ${rawID.length} total → ${dbID.length} valid`);
  }else{console.log('⚠️  db-id.json tidak ditemukan — skip');}

  const allVideos=[...dbEN,...dbID];

  // /video/
  console.log('\n🗑️  Hapus /video/ lama...');
  rmDir(VIDEO_DIR);fs.mkdirSync(VIDEO_DIR,{recursive:true});
  console.log('📄 Generate /video/...');
  let createdEN=0;
  dbEN.forEach(v=>{
    const dir=path.join(VIDEO_DIR,v.slug);fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'),buildVideoPage(v,allVideos,false),'utf8');
    createdEN++;if(createdEN%50===0)console.log(`  ✅ ${createdEN}/${dbEN.length}`);
  });
  console.log(`✅ ${createdEN} halaman /video/`);

  // /entertainment/
  if(dbID.length){
    console.log('\n🗑️  Hapus /entertainment/ lama...');
    rmDir(ENTERTAIN_DIR);fs.mkdirSync(ENTERTAIN_DIR,{recursive:true});
    console.log('📄 Generate /entertainment/...');
    let createdID=0;
    dbID.forEach(v=>{
      const dir=path.join(ENTERTAIN_DIR,v.slug);fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,'index.html'),buildVideoPage(v,allVideos,true),'utf8');
      createdID++;if(createdID%50===0)console.log(`  ✅ ${createdID}/${dbID.length}`);
    });
    console.log(`✅ ${createdID} halaman /entertainment/ (noindex)`);
  }

  // /category/
  console.log('\n📂 Generate /category/...');
  const CAT_DIR=path.join(__dirname,'category');
  rmDir(CAT_DIR);fs.mkdirSync(CAT_DIR,{recursive:true});
  const normalize=s=>s.toLowerCase().replace(/[\s_\-]/g,'');
  CATEGORIES.forEach(cat=>{
    const kws=cat.keywords.map(k=>normalize(k));
    const matchTag=t=>{const nt=normalize(t);return kws.some(k=>nt===k||nt.includes(k)||k.includes(nt));};
    const matchTitle=title=>{const nt=title.toLowerCase();return cat.keywords.some(k=>nt.includes(k.replace(/-/g,' ')));};
    const catVideos=dbEN.filter(v=>{
      if(v.tags&&v.tags.length)return v.tags.some(t=>matchTag(t));
      return matchTitle(v.title);
    });
    const dir=path.join(CAT_DIR,cat.slug);fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'),buildCategoryPage(cat,catVideos),'utf8');
    console.log(`  📁 /category/${cat.slug}/ — ${catVideos.length} video`);
  });
  console.log(`✅ ${CATEGORIES.length} halaman kategori`);

  // index.html
  console.log('\n🏠 Update index.html...');
  fs.writeFileSync(INDEX_FILE,buildHomepage(dbEN,dbID),'utf8');
  console.log('✅ index.html diperbarui');

  const year=new Date().getFullYear();
  console.log(`\n🎉 ${SITE_NAME} — Build Selesai!`);
  console.log(`   /video/         : ${createdEN} halaman`);
  if(dbID.length)console.log(`   /entertainment/ : ${dbID.length} halaman (noindex)`);
  console.log(`   /category/      : ${CATEGORIES.length} halaman`);
  console.log(`\n📋 Sarankan robots.txt:`);
  console.log(`   User-agent: *\n   Allow: /\n   Disallow: /entertainment/\n   Sitemap: ${BASE_URL}/sitemap.xml`);
  console.log(`\n📋 Ads: allAds=${STATIC_AD.allAds} | useDirect=${STATIC_AD.useDirect} | usePlayAds=${STATIC_AD.usePlayAds}(mulai tap ke-${STATIC_AD.playAdsStartFrom})`);
}

main();
