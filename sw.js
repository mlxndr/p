/* sw.js — offline copies of the presentations on mga.is.

   Registered by inc/head.js (never on a local preview server). Opening a
   deck once online stores everything it needs: each deck, once ready,
   sends this worker the list of its files (see cacheDeckForOffline in
   inc/script-loader.js), including images on slides not yet shown.

   Text files (pages, markdown, JSON, scripts, stylesheets) are fetched
   from the network first, so edits appear straight away; if the network
   fails or takes longer than a few seconds (a captive-portal wifi, say),
   the stored copy is used. Images and fonts rarely change and are served
   from the store first.

   To throw every stored copy away, change VERSION. */
const VERSION = 'mga-v1';
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) { return k !== VERSION; })
                .map(function (k) { return caches.delete(k); }));
        }).then(function () { return self.clients.claim(); })
    );
});

function isStatic(url) {
    return /\.(woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico|mp4|webm)$/i.test(url.pathname) ||
           url.hostname === 'fonts.gstatic.com';
}

function store(request, response) {
    if (response && (response.ok || response.type === 'opaque')) {
        const copy = response.clone();
        caches.open(VERSION).then(function (c) { c.put(request, copy); });
    }
    return response;
}

function cacheFirst(request) {
    return caches.match(request).then(function (hit) {
        return hit || fetch(request).then(function (r) { return store(request, r); });
    });
}

function networkFirst(request) {
    const fallback = function () {
        return caches.match(request, { ignoreSearch: request.mode === 'navigate' })
            .then(function (hit) { return hit || Response.error(); });
    };
    return new Promise(function (resolve) {
        let settled = false;
        const timer = setTimeout(function () {
            fallback().then(function (r) {
                if (!settled && r.type !== 'error') { settled = true; resolve(r); }
            });
        }, NETWORK_TIMEOUT_MS);
        fetch(request).then(function (r) {
            clearTimeout(timer);
            store(request, r);
            if (!settled) { settled = true; resolve(r); }
        }).catch(function () {
            clearTimeout(timer);
            if (!settled) { settled = true; fallback().then(resolve); }
        });
    });
}

self.addEventListener('fetch', function (event) {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    const ours = url.origin === self.location.origin;
    const googleFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    if (!ours && !googleFonts) return;
    event.respondWith(isStatic(url) ? cacheFirst(request) : networkFirst(request));
});

/* A deck's list of files to keep. Anything already stored is left alone. */
self.addEventListener('message', function (event) {
    const data = event.data || {};
    if (data.type !== 'precache' || !Array.isArray(data.urls)) return;
    event.waitUntil(caches.open(VERSION).then(function (cache) {
        return Promise.all(data.urls.map(function (u) {
            return cache.match(u).then(function (hit) {
                if (hit) return;
                return fetch(u).then(function (r) {
                    if (r.ok || r.type === 'opaque') return cache.put(u, r);
                }).catch(function () {});
            });
        }));
    }));
});
