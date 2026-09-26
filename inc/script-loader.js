function loadScripts() {
  // Helper to load a script with error handling
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  // Show error to user
  function showError(message) {
    console.error(message);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:20px;left:20px;right:20px;padding:20px;background:#fee;border:2px solid #c00;color:#900;font-family:sans-serif;z-index:99999;border-radius:8px;';
    errorDiv.innerHTML = '<strong>Presentation failed to load</strong><br>' + message + '<br><small>Check the browser console for details.</small>';
    document.body.appendChild(errorDiv);
  }

  // Load core script first
  loadScript(scriptConfig.core)
    .then(() => {
      // After core loads, load enabled plugins in parallel
      const enabledPlugins = Object.entries(scriptConfig.plugins)
        .filter(([_, plugin]) => plugin.enabled)
        .map(([_, plugin]) => plugin.path);

      return Promise.all(enabledPlugins.map(loadScript));
    })
    .then(() => {
      // Build metadata slides (title/closing placeholders) and expand
      // @-directives in external markdown before Reveal initialises
      // (both scripts load with the plugins above; the config script below
      // is what calls Reveal.initialize, so both must finish first)
      const pre = [];
      if (typeof buildMetaSlides === 'function') {
        pre.push(buildMetaSlides());
      }
      if (typeof expandMarkdownSections === 'function') {
        pre.push(expandMarkdownSections());
      }
      return Promise.all(pre);
    })
    .then(() => {
      // After all plugins load, load config
      return loadScript(scriptConfig.config);
    })
    .then(() => {
      return new Promise(resolve => {
        if (Reveal.isReady()) resolve(); else Reveal.on('ready', resolve);
      });
    })
    .then(() => {
      if (typeof syncNoteFragments === 'function') syncNoteFragments();
      setupThemeBasedElements();
      // Fit and position once now, again when webfonts settle (metrics
      // shift), and whenever the window changes size
      refitSlides();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refitSlides);
      }
      window.addEventListener('load', refitSlides);
      Reveal.on('overviewhidden', refitSlides);
      // Any webfont arriving later (a theme switch, a face first used on a
      // later slide) changes metrics: refit once each batch has loaded
      if (document.fonts && document.fonts.addEventListener) {
        let fontTimer = null;
        document.fonts.addEventListener('loadingdone', () => {
          clearTimeout(fontTimer);
          fontTimer = setTimeout(refitSlides, 50);
        });
      }
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refitSlides, 150);
      });
      // Offer the whole deck to the offline cache (see /sw.js)
      if (typeof cacheDeckForOffline === 'function') cacheDeckForOffline();
    })
    .catch(error => {
      showError(error.message);
    });
}

// Everything that depends on measured layout: @zoom boxes, the split-column
// autofit, and the text-slide autofit. Each pass resets before measuring,
// so running it again is always safe.
function refitSlides() {
  // In overview mode every slide is scaled and laid out differently, so
  // measurements would be wrong; overviewhidden (below) refits on exit
  if (window.Reveal && Reveal.isOverview && Reveal.isOverview()) return;
  // Measure final sizes, not mid-transition ones: reveal gives fragments
  // (every animated list item) 'transition: all', so after a theme change
  // their font size is still animating. Suspending transitions snaps
  // everything to its end state for the measurement.
  const root = document.documentElement;
  root.classList.add('mga-measuring');
  void root.offsetHeight;
  try {
    if (typeof positionZoomImages === 'function') positionZoomImages();
    if (typeof fitColumnHeadings === 'function') fitColumnHeadings();
    if (typeof autofitFillSlides === 'function') autofitFillSlides();
    if (typeof autofitTextSlides === 'function') autofitTextSlides();
    if (typeof alignSources === 'function') alignSources();
  } finally {
    root.classList.remove('mga-measuring');
  }
}

// Theme-dependent elements: logos (mono/white variants) and QR codes.
// Each theme says what its title and closing slides need with one CSS
// variable, --title-logos: white (dark or coloured grounds) or mono.
// light.css and dark.css set the defaults.
function setupThemeBasedElements() {
  function wantsWhite() {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--title-logos').trim().replace(/['"]/g, '');
    return v === 'white';
  }

  const LOGO_PAIRS = [
    ['.uog-logo', 'uog_mono.png', 'uog_white.png'],
    ['.ht-logo', 'ht-black-colour.png', 'ht-white.png'],
    ['.leverhulme-logo', 'leverhulme_cmyk_black2.png', 'leverhulme_cmyk_white2.png']
  ];

  function switchLogos(white) {
    LOGO_PAIRS.forEach(function ([sel, mono, whiteFile]) {
      document.querySelectorAll(sel).forEach(function (logo) {
        const src = logo.getAttribute('src');
        logo.setAttribute('src', white ? src.replace(mono, whiteFile) : src.replace(whiteFile, mono));
      });
    });
  }

  function updateQRCodes(white) {
    if (typeof QRCode === 'undefined') return;
    document.querySelectorAll('canvas.qr-code').forEach(function (canvas) {
      const url = canvas.getAttribute('data-url') || 'https://mga.is/';
      const size = parseInt(canvas.getAttribute('width') || '140');
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      while (canvas.firstChild) canvas.removeChild(canvas.firstChild);
      new QRCode(canvas.id, {
        text: url,
        size: size,
        background: 'transparent',
        foreground: white ? '#ffffff' : '#000000',
        typeNumber: 4,
        errorCorrectLevel: 'H'
      });
    });
  }

  function updateThemeElements() {
    const white = wantsWhite();
    switchLogos(white);
    updateQRCodes(white);
    // Themes change font metrics. A new theme's faces only start loading
    // once its styles are applied, so fit now (which also triggers those
    // loads) and again when they have arrived.
    refitSlides();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refitSlides);
    }
  }
  window.updateThemeElements = updateThemeElements;

  // Run once the given theme stylesheet has loaded (its @imports included).
  // A stylesheet that has already loaded exposes its rules; otherwise wait
  // for the load event, with a late fallback in case it never fires.
  function whenLoaded(link) {
    let done = false;
    const run = () => { if (!done) { done = true; updateThemeElements(); } };
    let ready = false;
    try { ready = !!(link.sheet && link.sheet.cssRules); } catch (e) {}
    if (ready) { run(); return; }
    link.addEventListener('load', run, { once: true });
    setTimeout(run, 2000);
  }

  function saveChoice(link) {
    try { localStorage.setItem('theme', link.getAttribute('href')); } catch (e) {}
  }

  // Watch the theme link: the menu either changes its href or replaces
  // the element outright. Only genuine changes are saved (the opening
  // theme, including a ?theme= override, is never written back).
  let current = null;
  function observe(link) {
    if (!link || link === current) return;
    current = link;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'href') { saveChoice(link); whenLoaded(link); }
      });
    }).observe(link, { attributes: true, attributeFilter: ['href'] });
  }

  const initial = document.getElementById('theme');
  observe(initial);
  if (initial) whenLoaded(initial);

  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeName === 'LINK' && node.id === 'theme') {
          saveChoice(node);
          observe(node);
          whenLoaded(node);
        }
      });
    });
  }).observe(document.head, { childList: true });
}

// Offline: hand the service worker (see /sw.js, registered in head.js) the
// full list of files this deck uses, so one visit while online is enough
// to present it later without a connection: every image in the deck (not
// only those on slides already shown), everything loaded so far (scripts,
// stylesheets, fonts), and the stylesheets and faces of the Colourful
// themes so the menu can still switch between them offline.
function cacheDeckForOffline() {
  if (!('serviceWorker' in navigator) || window.MGA_LOCAL_PREVIEW) return;
  navigator.serviceWorker.ready.then(function (reg) {
    const urls = new Set();
    const add = function (u) {
      if (!u || u.startsWith('data:')) return;
      try { urls.add(new URL(u, location.href).href.split('#')[0]); } catch (e) {}
    };
    add(location.pathname);
    add('./content.md'); add('./meta.json'); add('./title.md');
    add('../inc/site.json');
    document.querySelectorAll('img[src]').forEach(function (i) { add(i.getAttribute('src')); });
    document.querySelectorAll('[data-background-image]').forEach(function (e) { add(e.getAttribute('data-background-image')); });
    document.querySelectorAll('[data-src]').forEach(function (e) { add(e.getAttribute('data-src')); });
    performance.getEntriesByType('resource').forEach(function (r) { add(r.name); });
    (window.MGA_THEMES || []).forEach(function (s) {
      s.themes.forEach(function (t) { add(t.href); });
    });
    (window.MGA_LAYOUTS || []).forEach(function (l) { add(l.href); });
    ['colourful.css', 'light.css', 'dark.css',
     'woff2/century_supra_ot_b_regular.woff2', 'woff2/century_supra_ot_b_italic.woff2',
     'woff2/century_supra_ot_b_bold.woff2', 'woff2/century_supra_ot_b_bold_italic.woff2',
     'woff2/Premiera-Book.woff2', 'woff2/Premiera-Italic.woff2', 'woff2/Premiera-Bold.woff2',
     'woff2/Bitter[wght].woff2', 'woff2/Bitter-Italic[wght].woff2'
    ].forEach(function (f) { add('../inc/css/' + f); });
    const worker = reg.active || navigator.serviceWorker.controller;
    if (worker) worker.postMessage({ type: 'precache', urls: Array.from(urls) });
  }).catch(function () {});
}
