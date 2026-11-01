/* series.js: the index page of a teaching series (mga.is/1a/, /2a/, /words/).
   Not linked from the landing page; the decks themselves are "unlisted".
   The page's <main data-series="words:English Words,sol:The Story of Linguistics">
   names the series folders to look in (folder:heading, comma-separated).
   Decks are numbered folders (words/2/); each is found by fetching its
   meta.json, 1 to 20, so nothing has to be generated or kept up to date. */
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
    async function series(folder) {
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
            list.innerHTML = decks.length ? '' : '<li class="error">No lectures here yet.</li>';
            decks.forEach(function (d) {
                const m = d.meta, li = document.createElement('li');
                const meta = [m.date, m.event].filter(Boolean).map(fmt).join(', ');
                li.innerHTML = '<a href="' + d.base + '" class="presentation-rich">' +
                    '<span class="link-sc">' + d.n + '</span> ' + fmt(m.title || (g.folder + ' ' + d.n)) + '</a>' +
                    (meta ? '<span class="presentation-meta">' + meta + '</span>' : '') +
                    '<span class="presentation-meta"><a href="' + d.base + '?export">PDFs and handouts</a></span>';
                list.appendChild(li);
            });
        }
    }
    document.addEventListener('DOMContentLoaded', render);
})();
