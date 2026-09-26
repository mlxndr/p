/* head.js — the shared <head> for every deck, written synchronously.

   Loaded as a plain blocking <script> in each deck's <head>, so the
   stylesheets (and the right theme) are in place before the first paint:
   no flash of a default theme, and no race with the scripts that follow.

   It also owns the theme catalogue (the menu in revconfig.js reads
   window.MGA_THEMES) and decides which theme a deck opens in:

     1. ?theme=slate in the URL           (this visit only, never saved)
     2. the visitor's saved choice         (script-loader.js saves menu picks)
     3. "theme": "burgundy" in meta.json   (a deck's own default, optional;
                                            <html data-theme> also works)
     4. DEFAULT_THEME below                (Terracotta)

   Theme keys are the short names in the catalogue. Filenames stay fixed
   because saved choices in visitors' browsers point at them; a saved
   theme that is no longer in the catalogue is forgotten. */
(function () {
    'use strict';

    var CSS = '../inc/css/';
    var DEFAULT_THEME = 'terracotta';

    /* Theme catalogue, grouped into menu sections. Headers in the menu are
       generated from this, so entries can be added or reordered freely. */
    var THEMES = [
        { name: 'Colourful', themes: [
            { key: 'terracotta', name: 'Terracotta', file: 'th-l-terracotta.css' },
            { key: 'burgundy',   name: 'Burgundy',   file: 'th-l-burgundy.css' },
            { key: 'slate',      name: 'Slate',      file: 'th-l-slate.css' },
            { key: 'petrol',     name: 'Petrol',     file: 'th-l-petrol.css' }
        ]},
        { name: 'Classic', themes: [
            { key: 'cream',      name: 'Cream',      file: 'th-l-cr.css' },
            { key: 'cream-sans', name: 'Cream Sans', file: 'th-l-cr-m-thin.css' },
            { key: 'manuscript', name: 'Manuscript', file: 'th-l-e-cr-invert.css' },
            { key: 'twilight',   name: 'Twilight',   file: 'th-d-bg-twilight.css' }
        ]},
        { name: 'Other', themes: [
            { key: 'accessible',    name: 'High Accessibility', file: 'th-l-acc.css' }
        ]},
        { name: 'Institutional', themes: [
            { key: 'uog',      name: 'University of Glasgow',      file: 'th-l-uog.css' },
            { key: 'ht',       name: 'Historical Thesaurus',       file: 'th-l-ht.css' },
            { key: 'ht-cream', name: 'Historical Thesaurus Cream', file: 'th-l-bg-ht-cr.css' }
        ]}
    ];

    /* Layouts: a second, independent choice. A layout is a small
       stylesheet loaded after the theme that rearranges the same slides
       (running heads, a colour spine, a masthead...), using whatever
       palette the theme provides. */
    var DEFAULT_LAYOUT = 'standard';
    /* Each layout's picker icon: a thin line diagram of the slide */
    var ICON_FRAME = '<svg viewBox="0 0 28 20" aria-hidden="true">' +
        '<rect x=".6" y=".6" width="26.8" height="18.8" rx="1.5"/>';
    var LAYOUTS = [
        { key: 'standard',  name: 'Standard',
          icon: ICON_FRAME + '<path d="M5 6h12M5 10h16M5 14h10"/></svg>' },
        { key: 'spine',     name: 'Spine',
          icon: ICON_FRAME + '<path class="fill" d="M1 1h8v18H1z"/><path d="M9 .6v18.8M13 6h10M13 10h11M13 14h8"/></svg>' },
        { key: 'masthead',  name: 'Masthead',
          icon: ICON_FRAME + '<path class="fill" d="M1 1h26v4.5H1z"/><path d="M.6 5.5h26.8M5 10h16M5 14h12"/></svg>' },
        { key: 'classical', name: 'Classical',
          icon: ICON_FRAME + '<path d="M8 5.5h12M7 11h14M9 14.5h10"/><circle class="dot" cx="14" cy="8.2" r=".7"/></svg>' }
    ];
    LAYOUTS.forEach(function (l) { l.href = CSS + 'layout-' + l.key + '.css'; });
    function layoutByKey(k) {
        k = (k || '').toLowerCase();
        for (var i = 0; i < LAYOUTS.length; i++) if (LAYOUTS[i].key === k) return LAYOUTS[i];
        return null;
    }

    var all = [];
    THEMES.forEach(function (s) {
        s.themes.forEach(function (t) { t.href = CSS + t.file; all.push(t); });
    });
    function byKey(k) {
        k = (k || '').toLowerCase();
        for (var i = 0; i < all.length; i++) if (all[i].key === k) return all[i];
        return null;
    }
    function byHref(h) {
        for (var i = 0; i < all.length; i++) if (all[i].href === h) return all[i];
        return null;
    }

    /* Decide the opening theme */
    var fromUrl = null, saved = null;
    try { fromUrl = byKey(new URLSearchParams(location.search).get('theme')); } catch (e) {}
    try {
        var s = localStorage.getItem('theme');
        if (s) {
            saved = byHref(s);
            if (!saved) localStorage.removeItem('theme');   // retired theme
        }
    } catch (e) {}
    /* The deck's own defaults, from "theme"/"layout" in its meta.json.
       Read synchronously (a tiny local file) because the theme must be
       known before the page is first drawn; browsers log a deprecation
       note about synchronous requests, which is harmless here. */
    var meta = {};
    try {
        var x = new XMLHttpRequest();
        x.open('GET', './meta.json', false);
        x.send(null);
        if ((x.status >= 200 && x.status < 300) || (x.status === 0 && x.responseText)) {
            meta = JSON.parse(x.responseText) || {};
        }
    } catch (e) {}
    var deck = byKey(meta.theme) || byKey(document.documentElement.getAttribute('data-theme'));
    var chosen = fromUrl || saved || deck || byKey(DEFAULT_THEME);

    /* Same order for the layout: ?layout=, saved, <html data-layout>, default */
    var layoutUrl = null, layoutSaved = null;
    try { layoutUrl = layoutByKey(new URLSearchParams(location.search).get('layout')); } catch (e) {}
    try {
        var ls = localStorage.getItem('layout');
        if (ls) {
            layoutSaved = layoutByKey(ls);
            if (!layoutSaved) localStorage.removeItem('layout');
        }
    } catch (e) {}
    var layout = layoutUrl || layoutSaved ||
        layoutByKey(meta.layout) ||
        layoutByKey(document.documentElement.getAttribute('data-layout')) ||
        layoutByKey(DEFAULT_LAYOUT);

    window.MGA_THEMES = THEMES;
    window.MGA_LAYOUTS = LAYOUTS;
    window.MGA_LAYOUT = layout.key;
    window.MGA_THEME_FROM_URL = !!fromUrl;

    /* The head itself */
    var h = [
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta name="author" content="Marc Alexander">',
        '<link rel="stylesheet" href="../inc/reveal.js/dist/reveal.css">',
        '<link rel="stylesheet" href="' + CSS + 'fonts.css">',
        '<link rel="stylesheet" href="' + CSS + 'base.css">',
        '<link rel="stylesheet" href="' + CSS + 'animations.css">',
        '<link rel="stylesheet" href="../inc/reveal.js/plugin/highlight/monokai.css">',
        /* Noto Sans/Serif: glyph-coverage fallback only (IPA, non-Latin).
           Loaded without blocking the page, so a slow or absent network
           never holds up the slides. */
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap">',
        '<link rel="icon" type="image/png" href="../favicon-96x96.png" sizes="96x96">',
        '<link rel="icon" type="image/svg+xml" href="../favicon.svg">',
        '<link rel="shortcut icon" href="../favicon.ico">',
        '<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">',
        '<meta name="apple-mobile-web-app-title" content="mga.is">',
        '<link rel="manifest" href="../site.webmanifest">',
        '<link rel="stylesheet" href="' + chosen.href + '" id="theme">',
        '<link rel="stylesheet" href="' + layout.href + '" id="layout">'
    ];
    document.write(h.join('\n'));

    /* Offline copies (see /sw.js). Not on a local preview server, where a
       cache would only get in the way of editing. */
    var local = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) ||
                location.protocol === 'file:';
    if ('serviceWorker' in navigator && !local) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').catch(function (e) {
                console.warn('[offline] service worker not registered:', e);
            });
        });
    }
    window.MGA_LOCAL_PREVIEW = local;
    if (local) document.documentElement.classList.add('mga-preview');
})();
