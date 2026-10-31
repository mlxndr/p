/* export.js — the export page and the print views it opens (SPEC 10).

   ?export on a deck's address shows this page in place of the slides
   (script-loader.js calls mgaExportPage). It builds addresses for
   reveal's print mode (?print-pdf), which this file also handles when
   it is loaded into a print view:

     - a bar at the top of the screen with the Print button, enabled once
       every page is laid out, fonts loaded and images decoded (the bar
       is not printed);
     - handouts (handout=1|2|3|6): reveal's one-slide pages are moved
       onto A4 sheets, framed and numbered, with lines for notes if
       asked (lines=1), and the page number at the foot;
     - once ready, slide measurements are frozen (refitSlides does
       nothing), since opening the print dialogue resizes the window.

   Options read from the address are parsed in head.js (MGA_EXPORT). */
(function () {
    'use strict';

    const X = window.MGA_EXPORT || {};
    const META = window.MGA_META || {};
    const CORP = !!window.MGA_CORPORATE;
    const MM = 96 / 25.4;                    // CSS px per mm

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    /* metadata markup as on the title slide: *italic*, ^^small caps^^,
       | a line break there and a space here */
    function inline(s) {
        return esc(s).replace(/\s*\|\s*/g, ' ')
            .replace(/\*([^*]+)\*/g, '<i>$1</i>')
            .replace(/\^\^([^^]+)\^\^/g, '<span class="ex-sc">$1</span>');
    }
    function plain(s) {
        return String(s).replace(/\*|\^\^/g, '').replace(/\s*\|\s*/g, ' ');
    }
    function exists(url) {
        return fetch(url, { method: 'HEAD', cache: 'no-store' })
            .then(function (r) { return r.ok; })
            .catch(function () { return false; });
    }

    /* ------------------------------------------------------------------
       The export page
       ------------------------------------------------------------------ */

    const PREFS_KEY = 'mga-export';
    function loadPrefs() {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
    }
    function savePrefs(p) {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {}
    }

    /* @include lines in content.md and the files it includes, so the
       source section can offer every file the deck is made from */
    function findIncludes(url, seen) {
        seen = seen || {};
        const abs = new URL(url, location.href).href;
        if (seen[abs]) return Promise.resolve([]);
        seen[abs] = true;
        return fetch(abs).then(function (r) { return r.ok ? r.text() : ''; }).then(function (src) {
            let fence = false;
            const found = [];
            src.split('\n').forEach(function (line) {
                if (/^\s*(```|~~~)/.test(line)) fence = !fence;
                const m = !fence && /^@include\s+(\S+)\s*$/.exec(line);
                if (m) found.push(new URL(m[1], abs).href);
            });
            return Promise.all(found.map(function (f) { return findIncludes(f, seen); }))
                .then(function (nested) {
                    return found.reduce(function (all, f, i) { return all.concat([f], nested[i]); }, []);
                });
        }).catch(function () { return []; });
    }

    function radio(name, value, label, checked) {
        return '<label class="ex-choice"><input type="radio" name="' + name + '" value="' + value + '"' +
            (checked ? ' checked' : '') + '><span>' + label + '</span></label>';
    }
    function check(name, label, checked, note) {
        return '<label class="ex-check"><input type="checkbox" name="' + name + '"' + (checked ? ' checked' : '') + '>' +
            '<span>' + label + (note ? ' <span class="ex-note">' + note + '</span>' : '') + '</span></label>';
    }

    window.mgaExportPage = function () {
        const prefs = loadPrefs();
        const reveal = document.querySelector('.reveal');
        if (reveal) reveal.remove();

        const themes = window.MGA_THEMES || [];
        const layouts = window.MGA_LAYOUTS || [];
        const deckTheme = META.pdfTheme || META.theme || 'terracotta';
        const deckLayout = META.layout || 'standard';
        const STUDENT_NOTE = 'leaves out slides marked <code>nohandout</code> and blanks the answers';

        const appearance = CORP
            ? '<p class="ex-desc">A corporate deck prints in the template’s own dress.</p>'
            : '<div class="ex-row">' +
                '<label class="ex-field"><span>Theme</span><select name="theme">' +
                themes.map(function (s) {
                    return '<optgroup label="' + esc(s.name) + '">' + s.themes.map(function (t) {
                        return '<option value="' + t.key + '"' + (t.key === deckTheme ? ' selected' : '') + '>' +
                            esc(t.name) + '</option>';
                    }).join('') + '</optgroup>';
                }).join('') + '</select></label>' +
                '<label class="ex-field"><span>Layout</span><select name="layout">' +
                layouts.map(function (l) {
                    return '<option value="' + l.key + '"' + (l.key === deckLayout ? ' selected' : '') + '>' +
                        esc(l.name) + '</option>';
                }).join('') + '</select></label>' +
              '</div>' +
              '<p class="ex-desc">The deck’s own ' + (META.pdfTheme ? 'theme for PDFs' : 'theme') +
                ' is chosen to begin with. Both apply to the slides and the handout.</p>';

        const per = [1, 2, 3, 6].indexOf(prefs.perPage) !== -1 ? prefs.perPage : 2;
        const main = document.createElement('main');
        main.className = 'mga-export';
        main.innerHTML =
            '<nav class="ex-nav"><a class="ex-jackdaw" href="../" title="All presentations" aria-label="All presentations"></a>' +
                '<a href="./">Back to the slides</a></nav>' +
            '<header class="ex-head">' +
                '<h1 id="ex-title"></h1>' +
                '<p class="ex-meta" id="ex-meta"></p>' +
            '</header>' +

            '<section class="ex-sec" aria-labelledby="ex-h-look">' +
                '<h2 id="ex-h-look">Appearance</h2>' + appearance +
            '</section>' +

            '<section class="ex-sec" aria-labelledby="ex-h-slides">' +
                '<h2 id="ex-h-slides">Slides</h2>' +
                '<p class="ex-desc">One slide to a page, at the size of the screen.</p>' +
                '<div class="ex-row" role="radiogroup" aria-label="Builds">' +
                    radio('builds', 'final', 'Final state of each slide', true) +
                    radio('builds', 'each', 'A page for every build', false) +
                '</div>' +
                '<div class="ex-col">' +
                    check('s-student', 'Student version', false, STUDENT_NOTE) +
                    check('s-spares', 'Spare slides', true) +
                '</div>' +
                '<p><a class="ex-go" id="ex-go-slides" target="_blank" rel="noopener">Open the slides for printing</a></p>' +
                '<p class="ex-ready" id="ex-ready-slides" hidden>Ready-made: <a href="./slides.pdf">slides.pdf</a>, ' +
                    'final state, made each time the deck is published.</p>' +
            '</section>' +

            '<section class="ex-sec" aria-labelledby="ex-h-handout">' +
                '<h2 id="ex-h-handout">Handout</h2>' +
                '<p class="ex-desc">Slides on A4, each framed and numbered, final state.</p>' +
                '<div class="ex-row ex-per" role="radiogroup" aria-label="Slides per page">' +
                    '<span class="ex-label">Slides per page</span>' +
                    [1, 2, 3, 6].map(function (n) { return radio('per', n, String(n), n === per); }).join('') +
                '</div>' +
                '<div class="ex-col">' +
                    check('h-lines', 'Lines for notes', !!prefs.lines) +
                    check('h-student', 'Student version', true, STUDENT_NOTE) +
                    check('h-spares', 'Spare slides', false) +
                '</div>' +
                '<p><a class="ex-go" id="ex-go-handout" target="_blank" rel="noopener">Open the handout for printing</a></p>' +
                '<p class="ex-ready" id="ex-ready-handout" hidden>Ready-made: <a href="./slides-handout.pdf">slides-handout.pdf</a>, ' +
                    'two slides to a page, student version, made each time the deck is published.</p>' +
            '</section>' +

            '<section class="ex-sec" aria-labelledby="ex-h-text" id="ex-text" hidden>' +
                '<h2 id="ex-h-text">Text handout</h2>' +
                '<p class="ex-desc">The slides’ text as a document, for reading and printing.</p>' +
                '<div class="ex-col">' +
                    check('t-student', 'Student version', true, STUDENT_NOTE) +
                    check('t-spares', 'Spare slides', false) +
                '</div>' +
                '<p><a class="ex-go" id="ex-go-text" target="_blank" rel="noopener">Open the text handout</a></p>' +
            '</section>' +

            '<section class="ex-sec" aria-labelledby="ex-h-source">' +
                '<h2 id="ex-h-source">Source</h2>' +
                '<p class="ex-desc">The files the deck is made from.</p>' +
                '<ul class="ex-files" id="ex-files"></ul>' +
            '</section>' +

            '<section class="ex-sec ex-help" aria-labelledby="ex-h-help">' +
                '<h2 id="ex-h-help">Saving as PDF</h2>' +
                '<p>Each Open button shows the pages in a new tab, with a Print button at the top once they are ready. ' +
                    'In the print dialogue:</p>' +
                '<ul>' +
                    '<li><b>Chrome</b>: choose Save as PDF as the destination; under More settings, leave Margins at Default ' +
                        'and Scale at Default, and tick Background graphics.</li>' +
                    '<li><b>Safari</b>: open Show Details, tick Print backgrounds and untick Print headers and footers, ' +
                        'then choose Save as PDF from the PDF menu. Safari 18.2 and later honour the page size.</li>' +
                '</ul>' +
                '<p>Chrome gives the most faithful result. If a PDF from Safari differs from the screen (fonts, colours, ' +
                    'page breaks), make it in Chrome.</p>' +
            '</section>';
        document.body.appendChild(main);
        document.body.classList.add('mga-export-body');

        /* title and metadata (meta.json merged over the site defaults) */
        fetch('../inc/site.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
            .then(function (site) {
                const m = Object.assign({}, site, META);
                const title = m.title || 'Presentation';
                // a title ending in ? or ! takes the subtitle after a space
                const full = title + (m.subtitle ? (/[?!:.]\s*$/.test(title) ? ' ' : ': ') + m.subtitle : '');
                document.getElementById('ex-title').innerHTML = inline(full);
                document.title = 'Export: ' + plain(full);
                const authors = (m.authors && m.authors.length) ? m.authors.map(function (a) { return a.name; }).join(' and ') : m.author;
                document.getElementById('ex-meta').innerHTML = [authors ? esc(authors) : '',
                    [m.event, m.location].filter(Boolean).map(inline).join(', '), m.date ? esc(m.date) : '']
                    .filter(Boolean).join(' · ');
            });

        /* addresses, rebuilt whenever a choice changes */
        const form = main;
        function val(name) {
            const el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('select[name="' + name + '"]');
            return el ? el.value : null;
        }
        function on(name) {
            const el = form.querySelector('input[name="' + name + '"]');
            return !!(el && el.checked);
        }
        function look() {
            return CORP ? '' : '&theme=' + encodeURIComponent(val('theme')) + '&layout=' + encodeURIComponent(val('layout'));
        }
        function update() {
            const builds = val('builds') === 'each';
            document.getElementById('ex-go-slides').href = '?print-pdf' + (builds ? '&builds=1' : '&fragments=false') + look() +
                (on('s-student') ? '&student=1' : '') + (on('s-spares') ? '' : '&spares=0');
            const n = parseInt(val('per'), 10) || 2;
            document.getElementById('ex-go-handout').href = '?print-pdf&fragments=false&handout=' + n +
                (on('h-lines') ? '&lines=1' : '') + look() +
                (on('h-student') ? '&student=1' : '') + (on('h-spares') ? '' : '&spares=0');
            const t = [];
            if (!on('t-student')) t.push('student=0');
            if (on('t-spares')) t.push('spares=1');
            document.getElementById('ex-go-text').href = './handout.html' + (t.length ? '?' + t.join('&') : '');
            savePrefs({ perPage: n, lines: on('h-lines') });
        }
        form.addEventListener('change', update);
        update();

        /* ready-made files and the text handout, where they exist */
        exists('./slides.pdf').then(function (ok) { document.getElementById('ex-ready-slides').hidden = !ok; });
        exists('./slides-handout.pdf').then(function (ok) { document.getElementById('ex-ready-handout').hidden = !ok; });
        exists('./handout.html').then(function (ok) { document.getElementById('ex-text').hidden = !ok; });

        /* the source files */
        const files = document.getElementById('ex-files');
        function fileItem(href, label, note) {
            const li = document.createElement('li');
            li.innerHTML = '<a href="' + esc(href) + '" download>' + esc(label) + '</a>' + (note ? ' <span class="ex-note">' + note + '</span>' : '');
            files.appendChild(li);
        }
        fileItem('./content.md', 'content.md', 'the slides');
        fileItem('./meta.json', 'meta.json', 'title, date, theme and other settings');
        exists('./title.md').then(function (ok) { if (ok) fileItem('./title.md', 'title.md', 'the title slide'); });
        findIncludes('./content.md').then(function (list) {
            const here = new URL('./', location.href).href;
            list.forEach(function (u) {
                const rel = u.indexOf(here) === 0 ? u.slice(here.length) : u.replace(location.origin, '');
                fileItem(u, rel, 'included');
            });
        });
    };

    /* ------------------------------------------------------------------
       Print views (?print-pdf)
       ------------------------------------------------------------------ */

    /* Where each slide goes on an A4 sheet, in mm. One per page fills a
       landscape sheet; otherwise portrait, slides in a column (2 or 3) or
       in two columns (6). With lines, the lines go beneath (1 and 2 per
       page) or beside each slide (3, and 6 in a single column). */
    function sheetPlan(n, lines, ratio) {
        const orient = (n === 1 && !lines) ? 'landscape' : 'portrait';
        const PW = orient === 'landscape' ? 297 : 210, PH = orient === 'landscape' ? 210 : 297;
        const L = 14, T = 14, B = 20;                // B: room for the page number
        const AW = PW - 2 * L, AH = PH - T - B;
        const NUM = 6;                                // the number beneath a slide
        const cells = [];
        function column(rows, gap, w, beside) {
            const rowH = (AH - (rows - 1) * gap) / rows;
            const h = Math.min(w * ratio, rowH - NUM);
            w = h / ratio;
            for (let r = 0; r < rows; r++) {
                const top = T + r * (rowH + gap);
                const y = top + (rowH - h - NUM) / 2;
                const x = beside !== undefined ? L : L + (AW - w) / 2;
                const c = { x: x, y: y, w: w, h: h };
                if (beside !== undefined) {
                    c.lines = { x: L + w + 8, y: y, w: AW - w - 8, h: h + NUM };
                }
                cells.push(c);
            }
            return rowH;
        }
        if (n === 1 && !lines) {
            column(1, 0, AW);
        } else if (n === 1) {
            const h = AW * ratio;
            cells.push({ x: L, y: T, w: AW, h: h, lines: { x: L, y: T + h + NUM + 4, w: AW, h: AH - h - NUM - 4 } });
        } else if (n === 2 && !lines) {
            column(2, 10, AW);
        } else if (n === 2) {
            const rowH = (AH - 10) / 2, w = 150, h = w * ratio;
            for (let r = 0; r < 2; r++) {
                const y = T + r * (rowH + 10);
                cells.push({ x: L + (AW - w) / 2, y: y, w: w, h: h,
                    lines: { x: L, y: y + h + NUM + 3, w: AW, h: rowH - h - NUM - 3 } });
            }
        } else if (n === 3) {
            column(3, 8, lines ? 96 : AW, lines ? true : undefined);
        } else if (n === 6 && !lines) {
            const colW = (AW - 8) / 2, rowH = (AH - 2 * 8) / 3, h = colW * ratio;
            for (let r = 0; r < 3; r++) {
                for (let k = 0; k < 2; k++) {
                    cells.push({ x: L + k * (colW + 8), y: T + r * (rowH + 8) + (rowH - h - NUM) / 2, w: colW, h: h });
                }
            }
        } else {
            column(6, 4, AW, true);
        }
        return { orient: orient, PW: PW, PH: PH, L: L, B: B, cells: cells };
    }

    const LINE_GAP = 8;   // mm between ruled lines

    /* Reveal gives each printed page the ground of the viewport (body),
       but the themes paint theirs on .reveal, so dark and tinted grounds
       printed as white. Each page takes .reveal's ground instead. */
    function groundPages() {
        const r = document.querySelector('.reveal');
        if (!r) return;
        // corporate: the ground is the slide's white (.reveal's black is
        // only the letterbox)
        if (CORP) {
            document.querySelectorAll('.reveal .slides .pdf-page').forEach(function (pg) { pg.style.background = '#FFF'; });
            return;
        }
        const cs = getComputedStyle(r);
        const colour = cs.backgroundColor;
        const clear = /^(transparent|rgba\(0, 0, 0, 0\))$/.test(colour) && cs.backgroundImage === 'none';
        if (clear) return;
        document.querySelectorAll('.reveal .slides .pdf-page').forEach(function (pg) {
            pg.style.background = cs.background || colour;
        });
    }

    function layoutHandout() {
        const slides = document.querySelector('.reveal .slides');
        const pages = Array.prototype.slice.call(slides.querySelectorAll(':scope > .pdf-page'));
        if (!pages.length) return;
        const pw = pages[0].offsetWidth;
        const ph = parseFloat(pages[0].style.height) || pages[0].offsetHeight;
        const plan = sheetPlan(X.handout, X.lines, ph / pw);
        const per = plan.cells.length;
        const sheets = [];
        pages.forEach(function (page, i) {
            const k = i % per;
            if (k === 0) {
                const sheet = document.createElement('div');
                sheet.className = 'ho-sheet ho-' + plan.orient;
                sheet.style.width = plan.PW + 'mm';
                sheet.style.height = plan.PH + 'mm';
                const num = document.createElement('div');
                num.className = 'ho-page';
                num.textContent = String(sheets.length + 1);
                num.style.right = plan.L + 'mm';
                num.style.bottom = (plan.B / 2 - 2) + 'mm';
                sheet.appendChild(num);
                sheets.push(sheet);
            }
            const sheet = sheets[sheets.length - 1];
            const c = plan.cells[k];
            const frame = document.createElement('div');
            frame.className = 'ho-frame';
            frame.style.left = c.x + 'mm';
            frame.style.top = c.y + 'mm';
            frame.style.width = c.w + 'mm';
            frame.style.height = c.h + 'mm';
            page.style.width = pw + 'px';
            // zoom, which also scales the layout box: a transformed page
            // still counted at full width made Chrome shrink every sheet
            page.style.zoom = String(c.w * MM / pw);
            frame.appendChild(page);
            sheet.appendChild(frame);
            const no = document.createElement('div');
            no.className = 'ho-num';
            no.textContent = String(i + 1);
            no.style.left = c.x + 'mm';
            no.style.top = (c.y + c.h + 1.4) + 'mm';
            sheet.appendChild(no);
            if (c.lines) {
                const box = document.createElement('div');
                box.className = 'ho-lines';
                box.style.left = c.lines.x + 'mm';
                box.style.top = c.lines.y + 'mm';
                box.style.width = c.lines.w + 'mm';
                const count = Math.floor(c.lines.h / LINE_GAP);
                for (let j = 0; j < count; j++) {
                    const line = document.createElement('div');
                    line.style.height = LINE_GAP + 'mm';
                    box.appendChild(line);
                }
                sheet.appendChild(box);
            }
        });
        sheets.forEach(function (s) { slides.appendChild(s); });
        document.body.style.width = plan.PW + 'mm';
        document.body.style.height = 'auto';
        // in place of reveal's own @page rule (the slide's size)
        Array.prototype.forEach.call(document.querySelectorAll('head style'), function (el) {
            if (/^\s*@page\b/.test(el.textContent)) el.remove();
        });
        const st = document.createElement('style');
        st.textContent = '@page { size: A4 ' + plan.orient + '; margin: 0; }';
        document.head.appendChild(st);
    }

    function setupPrintView() {
        const bar = document.createElement('div');
        bar.className = 'mga-print-bar';
        bar.innerHTML = '<span class="mga-print-status" role="status">Preparing the pages…</span>' +
            '<button type="button" disabled>Print or save as PDF</button>' +
            '<a href="?export">Export options</a>';
        const btn = bar.querySelector('button');
        btn.addEventListener('click', function () { window.print(); });
        function addBar() { document.body.appendChild(bar); }
        if (document.body) addBar(); else document.addEventListener('DOMContentLoaded', addBar);

        function frames(n) {
            return new Promise(function (res) {
                (function f() { if (n-- <= 0) res(); else requestAnimationFrame(f); })();
            });
        }
        function images() {
            const imgs = Array.prototype.slice.call(document.querySelectorAll('.reveal img'));
            return Promise.all(imgs.map(function (img) {
                if (img.complete) return img.decode ? img.decode().catch(function () {}) : null;
                return new Promise(function (res) {
                    img.addEventListener('load', res, { once: true });
                    img.addEventListener('error', res, { once: true });
                    setTimeout(res, 8000);
                });
            }));
        }
        let done = false;
        function ready() {
            if (done) return;
            done = true;
            Promise.resolve(document.fonts && document.fonts.ready)
                .then(images)
                .then(function () { return new Promise(function (r) { setTimeout(r, 300); }); })
                .then(function () {
                    if (typeof window.refitSlides === 'function') window.refitSlides();
                    return frames(2);
                })
                .then(function () {
                    groundPages();
                    if (X.handout) layoutHandout();
                    window.MGA_PRINT_FROZEN = true;
                    return frames(2);
                })
                .then(function () {
                    const n = document.querySelectorAll(X.handout ? '.ho-sheet' : '.reveal .slides > .pdf-page').length;
                    bar.querySelector('.mga-print-status').textContent = n + (n === 1 ? ' page' : ' pages') + ' ready.';
                    btn.disabled = false;
                    document.documentElement.classList.add('mga-print-ready');
                })
                .catch(function (e) {
                    console.error('[export]', e);
                    bar.querySelector('.mga-print-status').textContent = 'Something went wrong laying out the pages; see the console.';
                });
        }
        /* reveal announces the finished print layout on .reveal */
        function listen() {
            const r = document.querySelector('.reveal');
            if (r) r.addEventListener('pdf-ready', ready);
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', listen); else listen();
    }

    if (X.print) setupPrintView();
})();
