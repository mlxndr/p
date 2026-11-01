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
    const WEBKIT = !!window.MGA_WEBKIT;      // Safari and every WebKit browser
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
        const palettes = window.MGA_PALETTES || [];
        const deckTheme = META.pdfTheme || META.theme || 'terracotta';
        const deckPalette = META.pdfPalette || window.MGA_PALETTE || META.palette || '';
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
                '<label class="ex-field"><span>Palette <span class="ex-note">forms</span></span><select name="palette">' +
                '<option value="">The form’s own</option>' +
                ['light', 'dark'].map(function (m) {
                    return '<optgroup label="' + (m === 'light' ? 'Light' : 'Dark') + '">' +
                        palettes.filter(function (p) { return p.mode === m; }).map(function (p) {
                            return '<option value="' + p.key + '"' + (p.key === deckPalette ? ' selected' : '') + '>' +
                                esc(p.name) + '</option>';
                        }).join('') + '</optgroup>';
                }).join('') + '</select></label>' +
              '</div>' +
              '<p class="ex-desc">The deck’s own ' + (META.pdfTheme ? 'theme for PDFs' : 'theme') +
                ' is chosen to begin with. Both apply to the slides and the handout.</p>';

        const per = [1, 2, 3, 6].indexOf(prefs.perPage) !== -1 ? prefs.perPage : 2;
        const main = document.createElement('main');
        main.className = 'mga-export';
        main.innerHTML =
            '<nav class="ex-nav"><a class="ex-jackdaw" href="' + (window.MGA_ROOT || '../') + '" title="All presentations" aria-label="All presentations"></a>' +
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
                '<p class="ex-desc">One slide to a page.</p>' +
                '<div class="ex-row" role="radiogroup" aria-label="Page size">' +
                    radio('shape', 'slide', 'Slide-shaped pages' + (WEBKIT ? ' <span class="ex-note">Chrome only</span>' : ''), !WEBKIT) +
                    radio('shape', 'paper', 'On paper, A4 or Letter', WEBKIT) +
                '</div>' +
                '<p class="ex-desc" id="ex-shape-note">' + (WEBKIT
                    ? 'Safari prints only on the paper sizes in its dialogue, so the slides come one to a sheet of paper, ' +
                      'scaled to its width.'
                    : 'Slide-shaped pages need Chrome’s Save as PDF. On paper, each slide fills the width of a sheet: ' +
                      'for printing, and for PDFs from any browser.') + '</p>' +
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
                '<p class="ex-desc">The slides as a document on A4: sections, figures and the final state of every build. ' +
                    'The handout has one column and a wide margin for writing in; the notes have two columns, ' +
                    'with sources as numbered notes, for revision.</p>' +
                '<div class="ex-row" role="radiogroup" aria-label="Text handout style">' +
                    '<span class="ex-label">Style</span>' +
                    radio('tstyle', 'handout', 'Handout', true) + radio('tstyle', 'notes', 'Notes, two columns', false) +
                '</div>' +
                '<div class="ex-col">' +
                    check('t-student', 'Student version', true, STUDENT_NOTE) +
                    check('t-spares', 'Spare slides', false) +
                '</div>' +
                '<p><a class="ex-go" id="ex-go-text" target="_blank" rel="noopener">Open the text handout</a></p>' +
                '<p class="ex-ready" id="ex-ready-text" hidden></p>' +
            '</section>' +

            '<section class="ex-sec" aria-labelledby="ex-h-source">' +
                '<h2 id="ex-h-source">Source</h2>' +
                '<p class="ex-desc">The files the deck is made from.</p>' +
                '<ul class="ex-files" id="ex-files"></ul>' +
            '</section>' +

            '<section class="ex-sec ex-help" aria-labelledby="ex-h-help">' +
                '<h2 id="ex-h-help">Saving as PDF</h2>' +
                '<p>Each Open button shows the pages in a new tab, with a Print button at the top once they are ready; ' +
                    'the bar beside it says which paper and orientation to choose. In the print dialogue:</p>' +
                '<ul>' +
                    '<li><b>Chrome</b>: for slide-shaped pages, choose Save as PDF as the destination; under More settings, ' +
                        'leave Margins and Scale at Default and tick Background graphics. For slides on paper, or a handout, ' +
                        'choose the paper and orientation the bar names.</li>' +
                    '<li><b>Safari</b>: choose the orientation the bar names (landscape for slides, portrait for most handouts; ' +
                        'Safari starts in portrait), untick Print headers and footers under Safari, then choose Save as PDF ' +
                        'from the PDF menu. Print backgrounds can be left as it is: the pages print their colours either way.</li>' +
                '</ul>' +
            '</section>';
        document.body.appendChild(main);
        document.body.classList.add('mga-export-body');

        /* title and metadata (meta.json merged over the site defaults) */
        fetch((window.MGA_ROOT || '../') + 'inc/site.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
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
            return CORP ? '' : '&theme=' + encodeURIComponent(val('theme')) +
                (val('palette') ? '&palette=' + encodeURIComponent(val('palette')) : '');
        }
        function update() {
            const builds = val('builds') === 'each';
            document.getElementById('ex-go-slides').href = '?print-pdf' + (builds ? '&builds=1' : '&fragments=false') + look() +
                (!WEBKIT && val('shape') === 'paper' ? '&paper=1' : '') +
                (on('s-student') ? '&student=1' : '') + (on('s-spares') ? '' : '&spares=0');
            const n = parseInt(val('per'), 10) || 2;
            document.getElementById('ex-go-handout').href = '?print-pdf&fragments=false&handout=' + n +
                (on('h-lines') ? '&lines=1' : '') + look() +
                (on('h-student') ? '&student=1' : '') + (on('h-spares') ? '' : '&spares=0');
            const t = [];
            const notes = val('tstyle') === 'notes';
            if (notes) t.push('style=notes');
            // the handout is the student version unless student=0; the
            // notes are the full copy unless student=1
            if (notes ? on('t-student') : !on('t-student')) t.push(notes ? 'student=1' : 'student=0');
            if (on('t-spares')) t.push('spares=1');
            document.getElementById('ex-go-text').href = './handout.html' + (t.length ? '?' + t.join('&') : '');
            savePrefs({ perPage: n, lines: on('h-lines') });
        }
        if (WEBKIT) form.querySelector('input[name="shape"][value="slide"]').disabled = true;
        form.addEventListener('change', update);
        update();

        /* ready-made files and the text handout, where they exist */
        exists('./slides.pdf').then(function (ok) { document.getElementById('ex-ready-slides').hidden = !ok; });
        exists('./slides-handout.pdf').then(function (ok) { document.getElementById('ex-ready-handout').hidden = !ok; });
        exists('./handout.html').then(function (ok) { document.getElementById('ex-text').hidden = !ok; });
        Promise.all([exists('./text-handout.pdf'), exists('./notes.pdf')]).then(function (r) {
            const files = [];
            if (r[0]) files.push('<a href="./text-handout.pdf">text-handout.pdf</a> (the handout, student version)');
            if (r[1]) files.push('<a href="./notes.pdf">notes.pdf</a> (the notes, full copy)');
            const p = document.getElementById('ex-ready-text');
            p.innerHTML = 'Ready-made: ' + files.join(' and ') + ', made each time the deck is published.';
            p.hidden = !files.length;
        });
        // choosing the notes style suggests the full copy, the handout the student version
        form.querySelectorAll('input[name="tstyle"]').forEach(function (r) {
            r.addEventListener('change', function () {
                const st = form.querySelector('input[name="t-student"]');
                if (st) { st.checked = r.value === 'handout'; update(); }
            });
        });

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

    /* A page scaled onto a sheet: with zoom, which also scales the
       layout box (a transformed page still counted at full width made
       Chrome shrink every sheet). WebKit's print gets two things wrong
       here: it ignores a transform inside a zoomed element, and lays out
       a zoomed element inside a transformed one at the wrong size. So
       in WebKit a page holding @marks (which zooms and places with
       transforms) is scaled with a transform inside a clipped box, and
       every other page (Thumb Index titles and autofit use zoom) with
       zoom. */
    function scalePage(page, k) {
        if (WEBKIT && page.querySelector('.md-marks-frame')) {
            page.style.transformOrigin = '0 0';
            page.style.transform = 'scale(' + k + ')';
        } else {
            page.style.zoom = String(k);
        }
    }

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
                // WebKit adds a blank page after a sheet exactly the
                // paper's height; a pixel less keeps one sheet a page
                sheet.style.height = WEBKIT ? 'calc(' + plan.PH + 'mm - 1px)' : plan.PH + 'mm';
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
            scalePage(page, c.w * MM / pw);
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

    /* Slides on paper (paper=1; always in WebKit). Browsers print a
       page on the paper chosen in the dialogue, laying it out between
       the paper's width and 1.5 times that width, and cut off anything
       wider: reveal's 2073 px pages lost their right-hand fifth on A4.
       Each page goes on a sheet PAPER_W wide, a width inside that range
       for A4 and Letter either way round, one sheet to a printed page;
       the slide is scaled to the sheet's width (export.css places it). */
    const PAPER_W = 1152;
    function layoutPaper() {
        const slides = document.querySelector('.reveal .slides');
        const pages = Array.prototype.slice.call(slides.querySelectorAll(':scope > .pdf-page'));
        if (!pages.length) return;
        const pw = pages[0].offsetWidth;
        const ph = parseFloat(pages[0].style.height) || pages[0].offsetHeight;
        pages.forEach(function (page) {
            const sheet = document.createElement('div');
            sheet.className = 'pp-sheet';
            const slot = document.createElement('div');
            slot.className = 'pp-slot';
            slot.style.height = (ph * PAPER_W / pw) + 'px';
            page.parentNode.insertBefore(sheet, page);
            page.style.width = pw + 'px';
            scalePage(page, PAPER_W / pw);
            slot.appendChild(page);
            sheet.appendChild(slot);
        });
        document.body.style.width = PAPER_W + 'px';
        document.body.style.height = 'auto';
        // the paper is the dialogue's, not the slide's shape
        Array.prototype.forEach.call(document.querySelectorAll('head style'), function (el) {
            if (/^\s*@page\b/.test(el.textContent)) el.remove();
        });
        const st = document.createElement('style');
        st.textContent = '@page { margin: 0; }';
        document.head.appendChild(st);
    }

    /* WebKit's print drops the transparency of gradient colour stops
       (a transparent stop prints black, a translucent one solid) and
       ignores CSS masks, so turned card corners, folds, accent bars and
       concordance fades printed as black shapes. Solid colours, rgba
       colours, clip-path and shadows print correctly. In WebKit print
       views each gradient with see-through stops is repainted with
       every stop blended over the colour behind it, which is what the
       screen shows; masked gradients (the concordance fades) lose the
       mask; the arrows and brace trees, drawn with SVG masks, have
       clip-path and border versions in export.css. */
    function parseColour(c) {
        let m = /^rgba?\(([^)]+)\)$/.exec(c);
        if (m) {
            const v = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
            return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
        }
        m = /^color\(srgb\s+([^)]+)\)$/.exec(c);
        if (m) {
            const v = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat);
            return { r: v[0] * 255, g: v[1] * 255, b: v[2] * 255, a: v.length > 3 ? v[3] : 1 };
        }
        if (c === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
        return null;
    }
    function over(c, back) {
        const a = c.a;
        return 'rgb(' + [c.r * a + back.r * (1 - a), c.g * a + back.g * (1 - a), c.b * a + back.b * (1 - a)]
            .map(function (x) { return Math.round(x); }).join(', ') + ')';
    }
    const COLOUR_RE = /rgba?\([^)]*\)|color\(srgb[^)]*\)|\btransparent\b/g;
    function backdrop(el) {
        // the first opaque ground behind el (a slide's own background
        // is a sibling layer in its page, so look there too)
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
            if (e.classList.contains('pdf-page')) {
                const bg = e.querySelector(':scope > .slide-background');
                const c = bg && parseColour(getComputedStyle(bg).backgroundColor);
                if (c && c.a === 1) return c;
            }
            const c = parseColour(getComputedStyle(e).backgroundColor);
            if (c && c.a === 1) return c;
        }
        return { r: 255, g: 255, b: 255, a: 1 };
    }
    function flatten(image, back) {
        let changed = false;
        const out = image.replace(COLOUR_RE, function (tok) {
            const c = parseColour(tok);
            if (!c || c.a >= 1) return tok;
            changed = true;
            return over(c, back);
        });
        return changed ? out : null;
    }
    function flattenForWebKit() {
        const root = document.querySelector('.reveal .slides');
        if (!root) return;
        const rules = [];
        let n = 0;
        root.querySelectorAll('*').forEach(function (el) {
            const cs = getComputedStyle(el);
            if (cs.backgroundImage.indexOf('gradient') !== -1) {
                const own = parseColour(cs.backgroundColor);
                const fixed = flatten(cs.backgroundImage, own && own.a === 1 ? own : backdrop(el.parentElement));
                if (fixed) el.style.backgroundImage = fixed;
            }
            const mask = cs.webkitMaskImage || cs.maskImage || '';
            if (mask.indexOf('gradient') !== -1) {
                el.style.webkitMaskImage = 'none';
                el.style.maskImage = 'none';
            }
            ['::before', '::after'].forEach(function (pe) {
                const ps = getComputedStyle(el, pe);
                if (ps.content === 'none' || ps.backgroundImage.indexOf('gradient') === -1) return;
                const own = parseColour(ps.backgroundColor);
                // a fold sits in its card's cut corner: behind it is what
                // lies behind the card where the card is clipped away
                const fixed = flatten(ps.backgroundImage, own && own.a === 1 ? own :
                    backdrop(cs.clipPath && cs.clipPath !== 'none' ? el.parentElement : el));
                if (!fixed) return;
                const cls = 'mga-wk' + (++n);
                el.classList.add(cls);
                rules.push('html .reveal .' + cls + pe + ' { background-image: ' + fixed + ' !important; }');
            });
        });
        if (rules.length) {
            const st = document.createElement('style');
            st.textContent = rules.join('\n');
            document.head.appendChild(st);
        }
    }

    /* What to choose in the print dialogue, for the bar */
    function dialogueAdvice() {
        if (X.handout) {
            const land = X.handout === 1 && !X.lines;
            return 'In the print dialogue, choose A4, ' + (land ? 'landscape' : 'portrait') + '.';
        }
        if (X.paper) {
            return 'In the print dialogue, choose landscape' + (WEBKIT ? ' (Safari starts in portrait)' : '') + '.';
        }
        return 'In Chrome, choose Save as PDF.';
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
                    if (WEBKIT) flattenForWebKit();
                    if (X.handout) layoutHandout();
                    else if (X.paper) layoutPaper();
                    window.MGA_PRINT_FROZEN = true;
                    return frames(2);
                })
                .then(function () {
                    const n = document.querySelectorAll(X.handout ? '.ho-sheet' : X.paper ? '.pp-sheet' : '.reveal .slides > .pdf-page').length;
                    bar.querySelector('.mga-print-status').textContent = n + (n === 1 ? ' page' : ' pages') + ' ready. ' + dialogueAdvice();
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
