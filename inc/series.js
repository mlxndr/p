/* series.js: the index page of a series (mga.is/1a/, /2a/, /2a/words/, /uog/).
   Not linked from the landing page; the decks themselves are "unlisted".
   The page's <main data-series="2a/words:English Words,2a/sol:The Story of Linguistics">
   names the series folders to look in, as paths from the site root
   (folder:heading, comma-separated).
   Decks come from the "series" lists in manifest.json (CI writes them on
   every push); where it has none, decks are numbered folders (2a/words/2/),
   each found by fetching its meta.json, 1 to 20. */
(function () {
    'use strict';
    const MAX = 20;
    const root = (function () {
        const me = document.currentScript && document.currentScript.getAttribute('src');
        return (me && /inc\/series\.js/.test(me)) ? me.replace(/inc\/series\.js.*$/, '') : '../';
    })();
    function fmt(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/\^\^(.+?)\^\^/g, '<span class="text-sc">$1</span>')
            .replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\s*\|\s*/g, ' ');
    }
    // the CI manifest lists every deck of a series folder (numbered or
    // named, e.g. uog/20260819-ets); without it, numbered folders are
    // found by probing 1 to MAX
    let manifest = null;
    async function fromManifest(folder) {
        if (manifest === null) {
            manifest = await fetch(root + 'manifest.json').then(function (r) { return r.ok ? r.json() : {}; })
                .catch(function () { return {}; });
        }
        const list = manifest.series && manifest.series[folder];
        if (!list || !list.length) return null;
        return list.map(function (m) {
            const leaf = m.dirName.split('/').pop();
            return { n: /^\d+$/.test(leaf) ? +leaf : null, base: root + m.dirName + '/', meta: m };
        });
    }
    async function series(folder) {
        const listed = await fromManifest(folder);
        if (listed) return listed;
        const found = await Promise.all(Array.from({ length: MAX }, function (_, i) {
            const n = i + 1, base = root + folder + '/' + n + '/';
            return fetch(base + 'meta.json').then(function (r) { return r.ok ? r.json() : null; })
                .then(function (m) { return m ? { n: n, base: base, meta: m } : null; })
                .catch(function () { return null; });
        }));
        return found.filter(Boolean);
    }
    async function render() {
        const main = document.querySelector('main[data-series]');
        if (!main) return;
        const groups = main.getAttribute('data-series').split(',').map(function (g) {
            const p = g.split(':'); return { folder: p[0].trim(), heading: (p[1] || p[0]).trim() };
        });
        for (const g of groups) {
            const sec = document.createElement('section');
            sec.className = 'fade-in';
            sec.innerHTML = '<h2>' + fmt(g.heading) + '</h2><ul class="link-list"><li class="loading">…</li></ul>';
            main.appendChild(sec);
            const list = sec.querySelector('ul');
            const decks = await series(g.folder);
            list.innerHTML = decks.length ? '' : '<li class="error">Nothing here yet.</li>';
            decks.forEach(function (d) {
                const m = d.meta, li = document.createElement('li');
                const meta = [m.date, m.event].filter(Boolean).map(fmt).join(', ');
                const sub = d.n === null && m.subtitle ? '<span class="presentation-meta">' + fmt(m.subtitle) + '</span>' : '';
                li.innerHTML = '<a href="' + d.base + '" class="presentation-rich">' +
                    (d.n !== null ? '<span class="link-sc">' + d.n + '</span> ' : '') + fmt(m.title || (g.folder + ' ' + d.n)) + '</a>' +
                    sub + (meta ? '<span class="presentation-meta">' + meta + '</span>' : '') +
                    '<span class="presentation-meta"><a href="' + d.base + '?export">PDFs and handouts</a></span>';
                list.appendChild(li);
            });
        }
    }
    document.addEventListener('DOMContentLoaded', render);
})();
