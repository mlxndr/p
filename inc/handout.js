/* The text handout (phase 8b, SPEC 10.3): a deck's content.md as a
   document on A4 pages.

   Each slide is rendered with the same expander as the slides, then the
   slides are merged into sections: slides under the same heading become
   one section, and every build shows its final state (a held image keeps
   its last frame, a list or transcript that grows keeps its longest
   version, a repeated block appears once). Image slides become numbered
   figures, captioned with their caption or else their alt text. Menus,
   overlay copies, hidden and spare slides are left out; @section is a
   part heading; @refs go at the end.

   The script lays the document out on its own A4 sheets, with a running
   head and page numbers on each: Safari prints no @page margin boxes and
   repeats no fixed elements, so this is the only way both browsers print
   the same pages.

   Options in the address:
     style=notes   two columns, sources as numbered notes at the end
                   (the lecturer's revision notes); the full copy unless
                   student=1. Default: the handout (one column with a
                   margin for figure captions, sources and writing)
     student=0     the full copy of the handout, answers shown (the
                   default is the student version: no @slide nohandout
                   slides, answers as ruled blanks)
     spares=1      include spare slides
   Each deck's handout.html loads handout.js and handout.css with a
   version in their address (?v=8b); bump it when either changes. */
(function () {
    const me = document.currentScript && document.currentScript.getAttribute('src');
    const ROOT = (me && /inc\/handout\.js/.test(me)) ? me.replace(/inc\/handout\.js.*$/, '') : '../';
    const Q = new URLSearchParams(location.search);
    const off = v => /^(0|false|no|off)$/i.test(v || '');
    const NOTES = (Q.get('style') || '').toLowerCase() === 'notes';
    const STUDENT = Q.has('student') ? !off(Q.get('student')) : !NOTES;
    const SPARES = Q.has('spares') && !off(Q.get('spares'));
    const WEBKIT = !/Chrome\//.test(navigator.userAgent);
    const H = document.documentElement;
    H.classList.add('ho-doc', NOTES ? 'ho-notes' : 'ho-handout');
    if (STUDENT) H.classList.add('mga-student');
    if (WEBKIT) H.classList.add('mga-webkit');

    const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    function inline(s) {
        return String(s).replace(/\s*\|\s*/g, ' ')
            .replace(/\*([^*]+)\*/g, '<i>$1</i>')
            .replace(/\^\^([^^]+)\^\^/g, '<span class="md-sc">$1</span>');
    }

    /* ---------- slides ---------- */
    function splitSlides(md) {
        const parts = md.split(/\n(---?)\n/);
        const out = [];
        for (let i = 0; i < parts.length; i += 2) {
            let chunk = parts[i];
            const cm = chunk.match(/<!--\s*\.slide:([^>]*)-->/);
            const attrs = cm ? cm[1] : '';
            const cls = ((attrs.match(/class="([^"]*)"/) || [])[1] || '').split(/\s+/).filter(Boolean);
            if (cls.includes('md-hidden') || /data-visibility="hidden"/.test(attrs)) continue;
            if (STUDENT && cls.includes('md-nohandout')) continue;
            if (!SPARES && cls.includes('md-spare')) continue;
            if (cls.includes('directive-error-slide')) continue;
            chunk = chunk.replace(/(^|\n)notes:[\s\S]*$/, '$1');
            const bg = (attrs.match(/data-background-image="([^"]*)"/) || [])[1] || null;
            const div = el('div', 'ho-slide');
            div.innerHTML = marked.parse(chunk);
            out.push({ cls, bg, el: div });
        }
        return out;
    }

    /* ---------- a slide as blocks ---------- */
    const DROP = '.md-menu, .md-overlay-under, .md-pmarks, .md-video-cue, .md-alt-missing, .md-tag-icon, ' +
        '.md-section-series, .md-series, script, style, .md-icon-disc, .directive-error';
    const UNWRAP = '.md-fill-inner, .md-quote-inner, .md-split, .md-split-body, .md-tr-ov, .md-over-text';

    function figureFrom(src, alt, caption, hold) {
        const f = el('figure', 'ho-fig');
        const i = el('img');
        i.src = src; i.alt = alt || '';
        f.appendChild(i);
        f.dataset.key = hold ? 'hold:' + hold : 'img:' + src;
        if (hold) f.dataset.hold = hold;
        f.appendChild(el('figcaption', 'ho-cap', '<span class="ho-fignum"></span> ' +
            (caption ? caption : '<span class="ho-alt">' + (alt || '').replace(/</g, '&lt;') + '</span>')));
        return f;
    }
    function figureFromImg(img, caption) {
        return figureFrom(img.getAttribute('src'), img.getAttribute('alt'), caption, img.getAttribute('data-id'));
    }

    function slideBlocks(s) {
        const root = s.el;
        root.querySelectorAll(DROP).forEach(n => n.remove());
        if (s.cls.includes('md-section')) {
            const h = root.querySelector('h1, h2');
            return { part: h ? h.innerHTML : '' };
        }
        // a quotation's attribution stays with the quotation
        root.querySelectorAll('.md-quote-inner > .md-source, blockquote + .md-source').forEach(n => n.classList.add('ho-attrib'));
        // videos: the poster as a figure
        root.querySelectorAll('video.md-video').forEach(v => {
            const poster = v.getAttribute('poster');
            const fr = v.closest('.md-split-img, .md-zoom-frame') || v;
            const nx = fr.nextElementSibling;
            const cap = nx && nx.matches('.md-frame-caption') ? nx : null;
            const alt = v.getAttribute('aria-label') || '';
            const f = poster ? figureFrom(poster, alt, (cap ? cap.innerHTML : '<span class="ho-alt">' + alt + '</span>') +
                ' <span class="ho-video">(video)</span>') : null;
            if (cap) cap.remove();
            if (f) fr.replaceWith(f); else fr.remove();
        });
        // split layouts: the picture goes beside the text
        root.querySelectorAll('.md-split').forEach(sp => {
            const box = sp.querySelector(':scope > .md-split-img');
            const img = box && box.querySelector('img');
            const body = sp.querySelector(':scope > .md-split-body');
            if (img && body) { const f = figureFromImg(img); f.classList.add('ho-side'); body.prepend(f); }
            if (box) box.remove();
        });
        // held, framed and Ken Burns images
        root.querySelectorAll('.md-zoom-frame').forEach(fr => {
            const img = fr.querySelector('img');
            const nx = fr.nextElementSibling;
            const cap = nx && nx.matches('.md-frame-caption, .bg-caption') ? nx : fr.querySelector('.md-frame-caption');
            const f = img ? figureFromImg(img, cap ? cap.innerHTML : null) : null;
            if (cap) cap.remove();
            if (f) fr.replaceWith(f); else fr.remove();
        });
        // @compare pairs and markdown images
        root.querySelectorAll('figure:not(.ho-fig)').forEach(fg => {
            if (fg.closest('.md-marks-frame')) return;
            const img = fg.querySelector('img');
            const cap = fg.querySelector('figcaption');
            if (img) fg.replaceWith(figureFromImg(img, cap ? cap.innerHTML : null));
        });
        root.querySelectorAll('p > img:only-child').forEach(img => img.parentNode.replaceWith(figureFromImg(img)));
        root.querySelectorAll('.md-compare').forEach(c => c.replaceWith(...Array.from(c.children)));
        // @marks: a figure that keeps its marks (zoom steps are not drawn)
        root.querySelectorAll('.md-marks-frame').forEach(m => {
            m.classList.add('ho-fig', 'ho-marks');
            const img = m.querySelector('img');
            if (!img) return;
            m.dataset.key = 'img:' + img.getAttribute('src');
            const old = m.querySelector('figcaption');
            m.appendChild(el('figcaption', 'ho-cap', '<span class="ho-fignum"></span> ' +
                (old ? old.innerHTML : '<span class="ho-alt">' + (img.getAttribute('alt') || '') + '</span>')));
            if (old) old.remove();
        });
        const blocks = [];
        // a background image slide (@image, @image-seq lines)
        if (s.bg) {
            const alt = root.querySelector('.visually-hidden');
            const cap = root.querySelector('.bg-caption');
            blocks.push(figureFrom(s.bg, alt ? alt.textContent : '', cap ? cap.innerHTML : null));
        }
        root.querySelectorAll('.visually-hidden, .bg-caption').forEach(n => n.remove());
        let w;
        while ((w = root.querySelector(UNWRAP))) w.replaceWith(...Array.from(w.childNodes));
        const h2 = root.querySelector('h2');
        let head = null;
        if (h2) { head = h2.innerHTML; h2.remove(); }
        for (const n of Array.from(root.children)) {
            if (n.matches('hr:not(.md-rule)')) continue;
            if (!n.textContent.trim() && !n.matches('img, svg, .md-rule') && !n.querySelector('img, svg')) continue;
            blocks.push(n);
        }
        if (s.cls.includes('md-statement')) blocks.forEach(b => b.classList.add('ho-statement'));
        if (s.cls.includes('md-refs')) return { refs: true, head, blocks };
        return { head, headText: h2 ? norm(h2.textContent) : null, blocks };
    }

    /* ---------- sections ---------- */
    function sigOf(b) {
        if (b.dataset && b.dataset.key) return b.dataset.key;
        const c = b.cloneNode(true);
        c.querySelectorAll('.md-tr-note, .md-answer, .ho-cap').forEach(n => n.remove());
        return b.tagName + ':' + norm(c.textContent);
    }

    function buildDoc(slides) {
        const doc = [], refs = { head: null, blocks: [] }, holds = {};
        let cur = null, prev = null;
        for (const s of slides) {
            const b = slideBlocks(s);
            if (b.part != null) { doc.push({ type: 'part', html: b.part }); cur = prev = null; continue; }
            if (b.refs) { refs.head = refs.head || b.head; refs.blocks.push(...b.blocks); continue; }
            if (b.head != null && (!cur || cur.key !== b.headText)) {
                prev = cur;
                cur = { type: 'sec', key: b.headText, head: b.head, blocks: [] };
                doc.push(cur);
            } else if (!cur) {
                cur = { type: 'sec', key: null, head: null, blocks: [] };
                doc.push(cur);
            }
            for (const blk of b.blocks) addBlock(cur, prev, blk, holds);
        }
        return { doc: doc.filter(d => d.type === 'part' || d.blocks.length), refs };
    }

    function addBlock(sec, prev, blk, holds) {
        // a held image: only its last state, wherever the run ends
        if (blk.dataset && blk.dataset.hold) {
            const h = holds[blk.dataset.hold];
            if (h) { const i = h.sec.blocks.indexOf(h.blk); if (i >= 0) h.sec.blocks.splice(i, 1); }
            holds[blk.dataset.hold] = { sec, blk };
            sec.blocks.push(blk);
            return;
        }
        const sig = sigOf(blk), len = blk.textContent.length;
        for (const pool of [sec.blocks, prev ? prev.blocks : []]) {
            for (let i = 0; i < pool.length; i++) {
                const o = pool[i], os = sigOf(o);
                if (os === sig) {
                    // the same block again: keep the fuller one (a transcript with its notes)
                    if (len > o.textContent.length && pool === sec.blocks) pool[i] = blk;
                    return;
                }
                if (o.tagName === blk.tagName && os.length > 12) {
                    if (sig.startsWith(os) && pool === sec.blocks) { pool[i] = blk; return; }
                    if (os.startsWith(sig)) return;
                }
            }
        }
        sec.blocks.push(blk);
    }

    /* ---------- the flow of blocks ---------- */
    function flow(meta, built) {
        const out = [];
        const t = el('header', 'ho-titleblock');
        if (meta.series && typeof mgaSeriesHtml === 'function') t.innerHTML = mgaSeriesHtml(meta.series, 'ho-series');
        t.appendChild(el('h1', 'ho-title', inline(meta.title || '')));
        if (meta.subtitle) t.appendChild(el('p', 'ho-subtitle', inline(meta.subtitle)));
        const authors = (meta.authors && meta.authors.length) ? meta.authors.map(a => a.name).join(' and ') : meta.author;
        t.appendChild(el('p', 'ho-meta', [authors, [meta.event, meta.location].filter(Boolean).map(inline).join(', '), meta.date]
            .filter(Boolean).join(' · ')));
        out.push(t);

        let secNo = 0;
        for (const d of built.doc) {
            if (d.type === 'part') { out.push(el('div', 'ho-part ho-keep', d.html)); continue; }
            if (d.head) out.push(el('h2', 'ho-h ho-keep', '<span class="ho-secno">' + (++secNo) + '</span><span class="ho-htext">' + d.head + '</span>'));
            // consecutive figures share a row
            let row = null;
            for (const b of d.blocks) {
                if (b.classList.contains('ho-fig') && !b.classList.contains('ho-side')) {
                    if (row) { row.appendChild(b); continue; }
                    row = el('div', 'ho-figrow'); row.appendChild(b); out.push(row); continue;
                }
                row = null;
                out.push(b);
            }
        }
        for (let i = 0; i < out.length; i++) {
            if (out[i].classList.contains('ho-figrow') && out[i].children.length === 1) out[i] = out[i].firstElementChild;
        }
        // figure numbers, in reading order
        let figNo = 0;
        out.forEach(b => [b].concat(Array.from(b.querySelectorAll('.ho-fig'))).forEach(f => {
            const n = f.classList.contains('ho-fig') && f.querySelector('.ho-fignum');
            if (n && !n.textContent) n.textContent = 'Figure ' + (++figNo);
        }));
        // sources: in the margin (handout) or numbered notes (notes)
        const notes = [];
        const final = [];
        for (const b of out) {
            // a quotation and its attribution stay on one page
            if (b.matches('.ho-attrib') && final.length && final[final.length - 1].matches('blockquote')) {
                const q = el('div', 'ho-quote');
                q.append(final.pop(), b);
                final.push(q);
                continue;
            }
            if (b.matches('.md-source:not(.ho-attrib)')) {
                const host = final[final.length - 1];
                if (NOTES) {
                    notes.push('<li>' + b.innerHTML + '</li>');
                    const target = final.slice().reverse().find(x => !x.matches('.ho-fig, .ho-figrow, .ho-h, .ho-part, .md-source, .ho-titleblock'));
                    if (target) {
                        const last = target.matches('ul, ol') ? (target.querySelector(':scope > li:last-child') || target) : target;
                        last.insertAdjacentHTML('beforeend', '<sup class="ho-nref">' + notes.length + '</sup>');
                    }
                    continue;
                }
                if (host && !host.matches('.ho-h, .ho-part, .ho-titleblock')) {
                    final[final.length - 1] = withMargin(host, el('span', 'ho-margin', b.innerHTML));
                    continue;
                }
            }
            final.push(b);
        }
        // a picture from a split layout goes beside the text after it
        if (!NOTES) for (let i = 0; i < final.length - 1; i++) {
            const b = final[i], nx = final[i + 1];
            if (b.classList.contains('ho-side') && !nx.matches('.ho-h, .ho-part, .ho-fig, .ho-figrow')) {
                final[i + 1] = withMargin(nx, b);
                final.splice(i, 1); i--;
            }
        }
        if (notes.length) {
            final.push(el('h2', 'ho-h ho-end ho-keep', '<span class="ho-htext">Notes</span>'));
            final.push(el('ol', 'ho-notes', notes.join('')));
        }
        // a short block that introduces an analysis stays with it
        for (let i = 0; i < final.length - 1; i++) {
            if (final[i + 1].matches('.pz, :has(> .pz)') && final[i].textContent.length < 240 && !final[i].matches('.pz')) final[i].classList.add('ho-keep');
        }
        // lists of short items flowed in columns take more columns
        final.forEach(b => (b.matches('.md-flow') ? [b] : Array.from(b.querySelectorAll('.md-flow'))).forEach(l => {
            const items = Array.from(l.querySelectorAll('li'));
            if (items.length > 3 && items.every(li => li.textContent.trim().length <= 18)) l.classList.add('ho-short');
            // one list: a grid filled down each column (Safari leaves a gap
            // at the top of a second CSS column)
            const kids = Array.from(l.children);
            if (kids.length === 1 && kids[0].matches('ul, ol')) {
                const cols = l.classList.contains('ho-short') ? (NOTES ? 3 : 4) : (parseInt(l.style.getPropertyValue('--cols'), 10) || 2);
                const n = kids[0].querySelectorAll(':scope > li').length;
                l.classList.add('ho-flow-grid');
                kids[0].style.gridTemplateRows = 'repeat(' + Math.max(1, Math.ceil(n / cols)) + ', auto)';
                kids[0].style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
            }
        }));
        if (built.refs.blocks.length) {
            final.push(el('h2', 'ho-h ho-end ho-keep', '<span class="ho-htext">' + (built.refs.head || 'References') + '</span>'));
            built.refs.blocks.forEach(r => { r.classList.add('ho-refs'); final.push(r); });
        }
        return final;
    }
    // a margin item (a source, a side picture) floats at the top of its
    // block; a block that lays out its own children gets a wrapper
    function withMargin(host, item) {
        if (host.matches('p, .ho-with')) { host.prepend(item); return host; }
        const w = el('div', 'ho-with');
        w.append(item, host);
        return w;
    }

    /* ---------- pages ---------- */
    function paginate(blocks, meta, host) {
        const runL = meta.series ? String(meta.series).split('|')[0] : '';
        const runR = meta.title || '';
        const pages = [];
        let body, cols = [], ci = 0;
        function newPage() {
            const sh = el('div', 'ho-sheet');
            // a sheet exactly the paper's height gives WebKit a blank page after it
            if (WEBKIT) sh.style.height = 'calc(297mm - 1px)';
            sh.appendChild(el('div', 'ho-run', '<span class="ho-run-l">' + inline(runL) + '</span><span class="ho-run-r">' + inline(runR) + '</span>'));
            const frame = el('div', 'ho-body');
            sh.appendChild(frame);
            sh.appendChild(el('div', 'ho-folio'));
            host.appendChild(sh);
            pages.push(sh);
            if (NOTES) {
                // two column boxes, filled in turn (CSS columns print
                // wrongly in WebKit)
                frame.appendChild(el('div', 'ho-top'));
                const row = el('div', 'ho-cols');
                cols = [el('div', 'ho-col'), el('div', 'ho-col')];
                cols.forEach(c => row.appendChild(c));
                frame.appendChild(row);
                ci = 0;
                body = cols[0];
            } else body = frame;
        }
        newPage();
        if (NOTES && blocks[0] && blocks[0].matches('.ho-titleblock')) pages[0].querySelector('.ho-top').appendChild(blocks.shift());
        const over = () => body.scrollHeight > body.clientHeight + 1;
        function advance() {
            if (NOTES && ci === 0) { ci = 1; body = cols[1]; } else newPage();
        }
        function nextPage() {
            // headings and part titles never end a page or column
            const kids = Array.from(body.children), carry = [];
            for (let j = kids.length - 1; j > 0 && kids[j].classList.contains('ho-keep'); j--) carry.unshift(kids[j]);
            carry.forEach(c => c.remove());
            advance();
            carry.forEach(c => body.appendChild(c));
        }
        function splitList(b) {
            const items = Array.from(b.children);
            const ol = b.tagName === 'OL';
            let n = parseInt(b.getAttribute('start') || '1', 10);
            let shell = b.cloneNode(false);
            body.appendChild(shell);
            for (const it of items) {
                shell.appendChild(it);
                if (over()) {
                    it.remove();
                    if (!shell.children.length) shell.remove();
                    nextPage();
                    shell = b.cloneNode(false);
                    shell.classList.add('ho-cont');
                    if (ol) shell.setAttribute('start', n);
                    body.appendChild(shell);
                    shell.appendChild(it);
                }
                n++;
            }
        }
        function splitTable(b) {
            const rows = Array.from(b.querySelectorAll('tbody > tr'));
            const shellOf = () => { const c = b.cloneNode(true); c.querySelector('tbody').innerHTML = ''; return c; };
            let shell = shellOf();
            body.appendChild(shell);
            for (const r of rows) {
                shell.querySelector('tbody').appendChild(r);
                if (over()) {
                    r.remove();
                    if (!shell.querySelector('tbody').children.length) shell.remove();
                    nextPage();
                    shell = shellOf();
                    shell.classList.add('ho-cont');
                    body.appendChild(shell);
                    shell.querySelector('tbody').appendChild(r);
                }
            }
        }
        for (const b of blocks) {
            body.appendChild(b);
            if (!over()) continue;
            b.remove();
            if (b.matches('ul, ol') && b.children.length > 1) { splitList(b); continue; }
            if (b.querySelectorAll('tbody > tr').length > 2) { splitTable(b); continue; }
            if (body.children.length) nextPage();
            body.appendChild(b);
            if (over() && b.matches('.ho-fig, .ho-figrow')) b.classList.add('ho-fit');
            if (over()) console.warn('[handout] a block taller than a page:', b.textContent.slice(0, 60));
        }
        pages.forEach((p, i) => { p.querySelector('.ho-folio').textContent = (i + 1) + ' of ' + pages.length; });
        pages[0].classList.add('ho-first');
        return pages;
    }

    /* the bar at the top on screen: the other view, and Print */
    function printBar() {
        const other = new URLSearchParams(location.search);
        if (NOTES) other.delete('style'); else other.set('style', 'notes');
        other.delete('student');
        const qs = other.toString();
        const bar = el('div', 'ho-bar',
            '<span class="ho-bar-what">' + (NOTES ? 'Notes in two columns' : 'Text handout') +
            (STUDENT ? ', student version' : ', full copy') + '. Print on A4, portrait; in Safari, untick Print headers and footers.</span>' +
            '<a href="' + (qs ? '?' + qs : './handout.html') + '">' + (NOTES ? 'Text handout' : 'Notes in two columns') + '</a>' +
            '<button type="button">Print</button>');
        bar.querySelector('button').addEventListener('click', () => window.print());
        document.body.prepend(bar);
    }

    async function main() {
        const [site, meta0] = await Promise.all([
            fetch(ROOT + 'inc/site.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
            fetch('./meta.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
        ]);
        window.MGA_META = meta0 || {};
        const meta = Object.assign({}, site, meta0);
        document.title = (meta.title || 'Handout').replace(/\*|\^\^/g, '').replace(/\s*\|\s*/g, ' ') + (NOTES ? ' (notes)' : ' (handout)');
        // the old page furniture, if a handout.html still has it
        document.querySelectorAll('.handout-container').forEach(n => n.remove());
        let host = document.getElementById('ho-pages');
        if (!host) { host = el('div'); host.id = 'ho-pages'; document.body.appendChild(host); }

        marked.setOptions({ gfm: true, breaks: false });
        const res = await fetch('./content.md');
        if (!res.ok) throw new Error('content.md: ' + res.status);
        let md = await res.text();
        if (typeof expandDirectives === 'function') md = expandDirectives(md, { name: 'content.md' }).markdown;
        const blocks = flow(meta, buildDoc(splitSlides(md)));

        // lay the blocks out once off the page, so images have their sizes
        const hold = el('div', 'ho-preload');
        document.body.appendChild(hold);
        blocks.forEach(b => hold.appendChild(b));
        await Promise.all(Array.from(hold.querySelectorAll('img')).map(img =>
            img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        // a blank shorter than 30 mm is widened, for handwriting
        if (STUDENT) hold.querySelectorAll('span.md-answer').forEach(a => {
            if (a.getClientRects().length === 1 && a.getBoundingClientRect().width < 113) a.classList.add('ho-blank-min');
        });
        paginate(blocks, meta, host);
        hold.remove();
        printBar();
        H.classList.add('mga-print-ready');
    }
    function start() {
        main().catch(e => {
            console.error('[handout]', e);
            document.body.insertAdjacentHTML('afterbegin', '<p style="color:#c00;padding:2rem">Error making the handout: ' + e.message + '</p>');
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
