/* ===========================================
   Directive expander for mga.is presentations

   Expands @-directives in content.md/title.md into the canonical slide
   markup at load time, so authoring stays in clean markdown. Runs in the
   browser before Reveal.initialize (wired in script-loader.js), so plain
   `python -m http.server` preview works with no build step.

   Grammar (one line, options are key=value, key="quoted", or bare flags):

     @image PATH alt="..." [caption="..."] [fit=contain|cover] [focus=x,y] [id=...]
     @image-seq                     (one indented "PATH options" line per slide)
     @image-left  PATH alt="..." [caption="..."] [split=42] [fragment] [hold id=NAME]
     @image-right PATH ...same...
     @compare [hold id=NAME]        (two indented "PATH options" lines)
     @zoom PATH alt="..." [focus=x,y] [scale=N] [to=CROP] [caption="..."]
     @kenburns PATH alt="..." [pan=in|out|left|right|up|down] [dur=24s] [caption="..."]

   Escape a literal line-initial @ with @@. Raw HTML and <!-- .slide: -->
   comments pass through untouched. Errors render as visible error slides.
   =========================================== */

(function () {
    'use strict';

    /* ---------- option tokeniser ---------- */

    function parseOptions(rest) {
        const opts = { _flags: [], _path: null };
        // One pass: key="quoted value" | key=bare | "quoted bare" | bare
        const re = /([\w-]+)=(?:"([^"]*)"|(\S+))|"([^"]*)"|(\S+)/g;
        let m;
        while ((m = re.exec(rest)) !== null) {
            if (m[1] !== undefined) {
                opts[m[1]] = m[2] !== undefined ? m[2] : m[3];
            } else {
                const bare = m[4] !== undefined ? m[4] : m[5];
                if (opts._path === null && /[./]/.test(bare)) {
                    opts._path = bare;
                } else {
                    opts._flags.push(bare);
                }
            }
        }
        return opts;
    }

    function has(opts, flag) { return opts._flags.indexOf(flag) !== -1; }

    /* ---------- helpers ---------- */

    const KNOWN_KEYS = {
        'image':      ['alt', 'caption', 'fit', 'focus', 'id'],
        'image-seq':  ['alt', 'caption', 'fit', 'focus', 'id'],
        'image-left': ['alt', 'caption', 'split', 'fit', 'id'],
        'image-right':['alt', 'caption', 'split', 'fit', 'id'],
        'compare':    ['alt', 'caption', 'id'],
        'zoom':       ['alt', 'caption', 'caption-start', 'focus', 'scale', 'to', 'id'],
        'kenburns':   ['alt', 'caption', 'pan', 'dur', 'id'],
        'slide':      ['bg', 'id'],
        'quote':      ['attrib', 'id'],
        'refs':       ['title', 'id']
    };
    const KNOWN_FLAGS = ['fragment', 'hold', 'natural',
        'smaller', 'smallest', 'centred', 'centered', 'plain', 'contrast'];

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function slugify(path) {
        const base = (path || 'slide').split('/').pop().replace(/\.[a-zA-Z0-9]+$/, '');
        return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'slide';
    }

    function makeIdAllocator() {
        const used = {};
        return function (want) {
            let id = want;
            let n = 2;
            while (used[id]) { id = want + '-' + n; n++; }
            used[id] = true;
            return id;
        };
    }

    function altBlock(opts, where) {
        const alt = opts.alt || opts.caption || '';
        let out = '';
        if (alt) {
            out += '<div class="visually-hidden">' + esc(alt) + '</div>\n';
        } else {
            out += '<div class="md-alt-missing">missing alt text — add alt="…" to the ' + where + ' directive</div>\n';
        }
        return out;
    }

    function captionBlock(opts) {
        return opts.caption
            ? '<figcaption class="bg-caption subtle">' + esc(opts.caption) + '</figcaption>\n'
            : '';
    }

    function errorSlide(name, lineNo, srcLine, message) {
        return '<!-- .slide: class="directive-error-slide" -->\n' +
            '<div class="directive-error">\n\n' +
            '### ⚠ Directive error — ' + esc(name) + ', line ' + lineNo + '\n\n' +
            '`' + srcLine.replace(/`/g, "'") + '`\n\n' +
            '**' + message + '**\n\n' +
            '</div>\n';
    }

    function validateKeys(kind, opts, srcLine, lineNo, name) {
        const known = KNOWN_KEYS[kind] || [];
        for (const k of Object.keys(opts)) {
            if (k.charAt(0) === '_') continue;
            if (known.indexOf(k) === -1) {
                const hint = known.filter(x => x.charAt(0) === k.charAt(0))[0];
                return errorSlide(name, lineNo, srcLine,
                    'Unknown option `' + esc(k) + '`.' + (hint ? ' Did you mean `' + hint + '`?' : '') +
                    ' Valid: ' + known.join(', ') + ', flags: ' + KNOWN_FLAGS.join(', '));
            }
        }
        for (const f of opts._flags) {
            if (KNOWN_FLAGS.indexOf(f) === -1) {
                return errorSlide(name, lineNo, srcLine,
                    'Unknown flag `' + esc(f) + '`. Valid flags: ' + KNOWN_FLAGS.join(', ') +
                    '. (Values with spaces need quotes: caption="like this".)');
            }
        }
        if (!opts._path && kind !== 'image-seq' && kind !== 'compare') {
            return errorSlide(name, lineNo, srcLine, 'Missing image path (first thing after @' + kind + ').');
        }
        return null;
    }

    const IMG_ONERROR = "this.classList.add('md-broken');if(!this.nextElementSibling||!this.nextElementSibling.classList.contains('md-missing-note')){this.insertAdjacentHTML('afterend','<p class=\\'md-source md-missing-note\\'>missing image: '+this.getAttribute('src')+'</p>');}";

    /* ---------- per-directive emitters ----------
       Each returns { md } or { md, isError }. Multi-slide emitters join
       their slides with the vertical separator themselves. */

    function emitImage(opts, allocId, srcLine, lineNo, name) {
        const err = validateKeys('image', opts, srcLine, lineNo, name);
        if (err) return { md: err, isError: true };
        const id = opts.id || allocId(slugify(opts._path));
        const fit = opts.fit === 'cover' ? 'cover' : 'contain';
        let attrs = 'data-background-image="' + esc(opts._path) + '" data-background-size="' + fit + '" id="' + esc(id) + '"';
        if (opts.focus && fit === 'cover') {
            const f = String(opts.focus).split(',');
            attrs += ' data-background-position="' + esc((f[0] || '50').trim()) + '% ' + esc((f[1] || '50').trim()) + '%"';
        }
        return { md: '<!-- .slide: ' + attrs + ' -->\n' + altBlock(opts, '@image') + captionBlock(opts) };
    }

    function emitZoom(opts, allocId, srcLine, lineNo, name) {
        const err = validateKeys('zoom', opts, srcLine, lineNo, name);
        if (err) return { md: err, isError: true };
        const focus = String(opts.focus || '50,50').split(',').map(parseFloat);
        const scale = parseFloat(opts.scale || '2');
        if (focus.length !== 2 || focus.some(isNaN) || isNaN(scale) || scale <= 0) {
            return { md: errorSlide(name, lineNo, srcLine,
                'Malformed `focus` or `scale`. Use focus=x,y (percentages across,down) and scale=N, e.g. focus=28,38 scale=3.'), isError: true };
        }
        const fx = focus[0] / 100, fy = focus[1] / 100;
        const baseId = opts.id || allocId(slugify(opts._path));
        const detailId = allocId(baseId + '-detail');
        const dataId = 'z-' + baseId;
        const alt = esc(opts.alt || opts.caption || '');
        const srcA = esc(opts._path);
        const srcB = esc(opts.to || opts._path);

        // Zoom choreography (three principles, learned the hard way):
        // 1. The MORPH is always the same file: slide A (page contained in
        //    the frame) auto-animates to slide B (same page enlarged by
        //    scale, focus point centred). Same aspect ratio at both ends
        //    means uniform scaling — the image cannot deform.
        // 2. to=CROP adds a THIRD slide that crossfades (plain fade, no
        //    auto-animate) to the sharp pre-cropped file after the zoom
        //    lands. Morphing directly between two different-aspect images
        //    would interpolate a portrait box into a landscape box, which
        //    visibly stretches the image — never do that.
        // 3. Contained images (A and the crop) are sized by pure CSS
        //    ([data-md-fit] rules in base.css), so their element boxes
        //    always equal the visible image; only the enlarged slide-B
        //    image needs runtime pixel maths (positionZoomImages).
        const captionA = opts['caption-start']
            ? '<figcaption class="md-frame-caption">' + esc(opts['caption-start']) + '</figcaption>\n'
            : '';
        const captionEnd = opts.caption
            ? '<figcaption class="md-frame-caption">' + esc(opts.caption) + '</figcaption>\n'
            : '';
        const slideA =
            '<!-- .slide: data-auto-animate data-auto-animate-duration="1.2" class="md-fill" id="' + esc(baseId) + '" -->\n' +
            (alt ? '' : altBlock(opts, '@zoom')) +
            '<div class="md-zoom-frame">\n' +
            '<img data-id="' + dataId + '" data-md-fit src="' + srcA + '" alt="' + alt + '" onerror="' + IMG_ONERROR + '">\n' +
            '</div>\n' + captionA;
        const slideB =
            '<!-- .slide: data-auto-animate data-auto-animate-duration="1.2" class="md-fill" id="' + esc(detailId) + '" -->\n' +
            '<div class="md-zoom-frame">\n' +
            '<img data-id="' + dataId + '" data-md-zoom="' + fx + ',' + fy + ',' + scale + '" src="' + srcA + '" alt="' + alt + '" onerror="' + IMG_ONERROR + '">\n' +
            '</div>\n' + (opts.to ? '' : captionEnd);
        if (!opts.to) {
            return { md: slideA + '\n--\n\n' + slideB };
        }
        const cropId = allocId(baseId + '-crop');
        const slideC =
            '<!-- .slide: data-transition="fade" class="md-fill" id="' + esc(cropId) + '" -->\n' +
            '<div class="md-zoom-frame">\n' +
            '<img data-md-fit src="' + srcB + '" alt="' + alt + '" onerror="' + IMG_ONERROR + '">\n' +
            '</div>\n' + captionEnd;
        return { md: slideA + '\n--\n\n' + slideB + '\n--\n\n' + slideC };
    }

    function emitKenburns(opts, allocId, srcLine, lineNo, name) {
        const err = validateKeys('kenburns', opts, srcLine, lineNo, name);
        if (err) return { md: err, isError: true };
        const pans = { 'in': 'ken-burns', 'out': 'kb-out', 'left': 'kb-left', 'right': 'kb-right', 'up': 'kb-up', 'down': 'kb-down' };
        const anim = pans[opts.pan || 'in'];
        if (!anim) {
            return { md: errorSlide(name, lineNo, srcLine, 'Unknown pan `' + esc(opts.pan) + '`. Valid: in, out, left, right, up, down.'), isError: true };
        }
        const dur = /^\d+(\.\d+)?s$/.test(opts.dur || '') ? opts.dur : '24s';
        const id = opts.id || allocId(slugify(opts._path));
        return { md:
            '<!-- .slide: class="md-fill" id="' + esc(id) + '" -->\n' +
            altBlock(opts, '@kenburns') +
            '<div class="md-zoom-frame md-kenburns">\n' +
            '<img src="' + esc(opts._path) + '" alt="' + esc(opts.alt || opts.caption || '') + '" onerror="' + IMG_ONERROR + '" style="animation-name:' + anim + ';animation-duration:' + dur + '">\n' +
            '</div>\n' + captionBlock(opts) };
    }

    /* Split-layout directives take the REST OF THE CHUNK as their text column */
    function emitSplit(kind, opts, bodyLines, allocId, srcLine, lineNo, name) {
        const err = validateKeys(kind, opts, srcLine, lineNo, name);
        if (err) return { md: err, isError: true };
        const side = kind === 'image-left' ? '' : ' img-right';
        const split = opts.split ? parseFloat(opts.split) : null;
        if (opts.split && (isNaN(split) || split <= 0 || split >= 100)) {
            return { md: errorSlide(name, lineNo, srcLine, 'Malformed `split` — a bare percentage between 1 and 99, e.g. split=38.'), isError: true };
        }
        const hold = has(opts, 'hold');
        const dataId = hold ? (opts.id || 'held-image') : null;
        const id = hold ? allocId(slugify(opts._path)) : (opts.id || allocId(slugify(opts._path)));
        const slideAttrs = 'class="md-fill" id="' + esc(id) + '"' + (hold ? ' data-auto-animate' : '');
        const imgAttrs =
            (has(opts, 'fragment') ? 'class="fragment" ' : '') +
            (dataId ? 'data-id="' + esc(dataId) + '" ' : '') +
            'src="' + esc(opts._path) + '" alt="' + esc(opts.alt || opts.caption || '') + '" onerror="' + IMG_ONERROR + '"';
        let md =
            '<!-- .slide: ' + slideAttrs + ' -->\n' +
            (opts.alt || opts.caption ? '' : altBlock(opts, '@' + kind)) +
            '<div class="md-split' + side + '"' + (split ? ' style="--split:' + split + '%"' : '') + '>\n' +
            '<figure class="md-split-img">\n' +
            '<img ' + imgAttrs + '>\n' +
            (opts.caption ? '<figcaption>' + esc(opts.caption) + '</figcaption>\n' : '') +
            '</figure>\n' +
            '<div class="md-split-body">\n\n' +
            bodyLines.join('\n').trim() + '\n\n' +
            '</div>\n</div>\n';
        return { md: md, consumesBody: true };
    }

    function parseItemLines(lines, startIdx) {
        // Consume indented, non-blank lines following a block directive
        const items = [];
        let i = startIdx;
        while (i < lines.length && /^\s+\S/.test(lines[i])) {
            items.push(lines[i].trim());
            i++;
        }
        return { items: items, next: i };
    }

    function emitImageSeq(items, allocId, srcLine, lineNo, name) {
        if (!items.length) {
            return { md: errorSlide(name, lineNo, srcLine, '@image-seq needs at least one indented "PATH options" line below it.'), isError: true };
        }
        const slides = [];
        for (const item of items) {
            const opts = parseOptions(item);
            const r = emitImage(opts, allocId, item, lineNo, name);
            slides.push(r.md);
            if (r.isError) return { md: slides.join('\n--\n\n'), isError: true };
        }
        return { md: slides.join('\n--\n\n') };
    }

    function emitCompare(opts, items, allocId, srcLine, lineNo, name) {
        const err = validateKeys('compare', opts, srcLine, lineNo, name);
        if (err) return { md: err, isError: true };
        if (items.length !== 2) {
            return { md: errorSlide(name, lineNo, srcLine, '@compare needs exactly two indented "PATH options" lines below it (got ' + items.length + ').'), isError: true };
        }
        const hold = has(opts, 'hold');
        const id = allocId(slugify(parseOptions(items[0])._path || 'compare'));
        let figures = '';
        for (let n = 0; n < 2; n++) {
            const it = parseOptions(items[n]);
            if (!it._path) {
                return { md: errorSlide(name, lineNo, items[n], 'Missing image path in @compare item ' + (n + 1) + '.'), isError: true };
            }
            figures +=
                '<figure>\n' +
                '<img ' + (hold ? 'data-id="' + esc(opts.id || 'cmp') + '-' + n + '" ' : '') +
                'src="' + esc(it._path) + '" alt="' + esc(it.alt || it.caption || '') + '" onerror="' + IMG_ONERROR + '">\n' +
                (it.caption ? '<figcaption>' + esc(it.caption) + '</figcaption>\n' : '') +
                '</figure>\n';
        }
        return { md:
            '<!-- .slide: class="md-fill" id="' + esc(id) + '"' + (hold ? ' data-auto-animate' : '') + ' -->\n' +
            '<div class="md-compare">\n' + figures + '</div>\n' };
    }

    /* Wrap each generated md-fill slide's content in an inner flex column.
       Reveal sets display:block inline on visible sections (from its
       `display` config), so flex layout must live one level down. The
       .slide: attribute comments stay outside; notes: lines stay after the
       wrapper so reveal's notes extraction can't unbalance the markup. */

    /* Inline shorthand: ^^term^^ sets term in small caps (the decks hand-wrote
       <span style="font-variant: small-caps;"> dozens of times), and
       %%aside%% sets text in the theme's subtle colour. */
    function smallCapsPass(md) {
        return md.replace(/\^\^([^\^\n]+)\^\^/g, '<span class="md-sc">$1</span>')
                 .replace(/%%([^%\n]+)%%/g, '<span class="md-subtle">$1</span>');
    }

    function wrapFillSlides(md) {
        return md.split('\n--\n').map(function (piece) {
            if (piece.indexOf('class="md-fill"') === -1) return piece;
            const lines = piece.split('\n');
            const head = [], body = [], notes = [];
            let inNotes = false;
            for (const l of lines) {
                if (inNotes) { notes.push(l); continue; }
                if (/^notes:/.test(l)) { inNotes = true; notes.push(l); continue; }
                if (/^\s*<!--\s*\.slide:/.test(l)) { head.push(l); continue; }
                body.push(l);
            }
            return head.join('\n') +
                '\n<div class="md-fill-inner">\n\n' +
                body.join('\n').trim() +
                '\n\n</div>\n' +
                (notes.length ? notes.join('\n') : '');
        }).join('\n--\n');
    }


    /* ---------- slide modifiers and text slides ---------- */

    /* @slide smaller|smallest|centred|plain|contrast [bg=#colour]
       Expands to a reveal slide-attributes comment; flags become classes
       that base.css and the themes style. */
    function emitSlideMods(opts, srcLine, lineNo, name) {
        const classMap = { smaller: 'md-smaller', smallest: 'md-smallest',
            centred: 'md-centred', centered: 'md-centred',
            plain: 'md-plain', contrast: 'md-contrast' };
        const classes = [];
        for (const f of opts._flags) {
            if (!classMap[f]) {
                return { md: errorSlide(name, lineNo, srcLine,
                    'Unknown @slide flag `' + esc(f) + '`. Available: smaller, smallest, centred, plain, contrast (plus bg=&lt;colour&gt;).'), isError: true };
            }
            classes.push(classMap[f]);
        }
        if (opts.bg && !/^[#\w][\w#(),.%\- ]*$/.test(opts.bg)) {
            return { md: errorSlide(name, lineNo, srcLine,
                'bg= does not look like a CSS colour.'), isError: true };
        }
        if (!classes.length && !opts.bg) {
            return { md: errorSlide(name, lineNo, srcLine,
                '@slide needs at least one flag (smaller, smallest, centred, plain, contrast) or bg=&lt;colour&gt;.'), isError: true };
        }
        let attrs = '';
        if (classes.length) attrs += ' class="' + classes.join(' ') + '"';
        if (opts.bg) attrs += ' data-background-color="' + esc(opts.bg) + '"';
        if (opts.id) attrs += ' id="' + esc(opts.id) + '"';
        return { md: '<!-- .slide:' + attrs + ' -->', isError: false };
    }

    /* @section Some Part Title — a styled divider slide */
    function emitSection(text, srcLine, lineNo, name) {
        if (!text) {
            return { md: errorSlide(name, lineNo, srcLine,
                '@section needs the section title on the same line, e.g. `@section Part Two: The Corpus`.'), isError: true };
        }
        return { md: '<!-- .slide: class="md-section" -->\n# ' + text, isError: false };
    }

    /* @quote attrib="Source, details" [contrast] [smaller|smallest]
       Body of the chunk = the quotation (markdown). smaller/smallest
       scale long quotations (testimony-length) to fit. */
    function emitQuote(opts, body, srcLine, lineNo, name) {
        const text = body.join('\n').trim();
        if (!text) {
            return { md: errorSlide(name, lineNo, srcLine,
                '@quote needs the quotation on the lines after the directive.'), isError: true };
        }
        const cls = 'md-quote' +
            (has(opts, 'smallest') ? ' md-smallest' : has(opts, 'smaller') ? ' md-smaller' : '') +
            (has(opts, 'contrast') ? ' md-contrast' : '');
        const quoted = text.split('\n').map(function (l) {
            return l.trim() === '' ? '>' : '> ' + l;
        }).join('\n');
        return { md: '<!-- .slide: class="' + cls + '"' +
            (opts.id ? ' id="' + esc(opts.id) + '"' : '') + ' -->\n' +
            '<div class="md-quote-inner">\n\n' + quoted + '\n\n' +
            (opts.attrib ? '<p class="md-source">' + esc(opts.attrib) + '</p>\n' : '') +
            '\n</div>', isError: false };
    }

    /* @refs [title="References"] — hanging-indent reference list */
    function emitRefs(opts, body, srcLine, lineNo, name) {
        const text = body.join('\n').trim();
        if (!text) {
            return { md: errorSlide(name, lineNo, srcLine,
                '@refs needs the references (a markdown list) on the lines after the directive.'), isError: true };
        }
        return { md: '<!-- .slide: class="md-refs" -->\n## ' +
            (opts.title || 'References') + '\n\n' + text, isError: false };
    }

    /* ---------- chunk-level expansion ---------- */

    function expandChunk(chunk, allocId, name, lineOffset) {
        const lines = chunk.split('\n');
        const out = [];
        let hadError = false;
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const dm = /^@([\w-]+)\b(.*)$/.exec(line);
            if (line.slice(0, 2) === '@@') {
                out.push(line.slice(1));
                i++;
                continue;
            }
            if (!dm) {
                out.push(line);
                i++;
                continue;
            }
            const kind = dm[1];
            const lineNo = lineOffset + i + 1;
            const opts = parseOptions(dm[2].trim());
            let r;
            if (kind === 'slide') {
                r = emitSlideMods(opts, line, lineNo, name);
            } else if (kind === 'section') {
                r = emitSection(dm[2].trim(), line, lineNo, name);
            } else if (kind === 'quote' || kind === 'refs') {
                let bodyEnd = lines.length;
                for (let j = i + 1; j < lines.length; j++) {
                    if (/^notes:/.test(lines[j])) { bodyEnd = j; break; }
                }
                const tbody = lines.slice(i + 1, bodyEnd);
                r = kind === 'quote'
                    ? emitQuote(opts, tbody, line, lineNo, name)
                    : emitRefs(opts, tbody, line, lineNo, name);
                if (!r.isError) {
                    out.push(r.md);
                    for (let j = bodyEnd; j < lines.length; j++) out.push(lines[j]);
                    // the directive body consumed the chunk's trailing blank
                    // line; restore it, or the next ^\n---\n separator loses
                    // its preceding blank line and slides merge
                    out.push('');
                    return { md: smallCapsPass(wrapFillSlides(out.join('\n'))), hadError: hadError };
                }
            } else if (kind === 'image') {
                r = emitImage(opts, allocId, line, lineNo, name);
            } else if (kind === 'zoom') {
                r = emitZoom(opts, allocId, line, lineNo, name);
            } else if (kind === 'kenburns') {
                r = emitKenburns(opts, allocId, line, lineNo, name);
            } else if (kind === 'image-seq') {
                const p = parseItemLines(lines, i + 1);
                r = emitImageSeq(p.items, allocId, line, lineNo, name);
                i = p.next - 1;
            } else if (kind === 'compare') {
                const p = parseItemLines(lines, i + 1);
                r = emitCompare(opts, p.items, allocId, line, lineNo, name);
                i = p.next - 1;
            } else if (kind === 'image-left' || kind === 'image-right') {
                // Body = everything after the directive up to a notes: line
                let bodyEnd = lines.length;
                for (let j = i + 1; j < lines.length; j++) {
                    if (/^notes:/.test(lines[j])) { bodyEnd = j; break; }
                }
                const body = lines.slice(i + 1, bodyEnd);
                r = emitSplit(kind, opts, body, allocId, line, lineNo, name);
                if (!r.isError) {
                    out.push(r.md);
                    // keep any notes: block after the emitted markup
                    for (let j = bodyEnd; j < lines.length; j++) out.push(lines[j]);
                    if (r.isError) hadError = true;
                    return { md: smallCapsPass(wrapFillSlides(out.join('\n'))), hadError: hadError };
                }
            } else {
                r = { md: errorSlide(name, lineNo, line,
                    'Unknown directive `@' + esc(kind) + '`. Available: @image, @image-seq, @image-left, @image-right, @compare, @zoom, @kenburns, @slide, @section, @quote, @refs. (Escape a literal @ with @@.)'), isError: true };
            }
            out.push(r.md);
            if (r.isError) hadError = true;
            i++;
        }
        return { md: smallCapsPass(wrapFillSlides(out.join('\n'))), hadError: hadError };
    }

    /* ---------- top-level API ---------- */

    function expandDirectives(src, meta) {
        const name = (meta && meta.name) || 'markdown';
        // short-circuit only when there is nothing at all to expand
        // (inline ^^small caps^^ and %%subtle%% must expand even in
        // directive-free decks)
        if (src.indexOf('@') === -1 && src.indexOf('^^') === -1 && src.indexOf('%%') === -1) {
            return { markdown: src, hadError: false };
        }
        // Split on reveal's separators (blank-line anchored, matching the
        // data-separator regexes ^\n---\n and ^\n--\n), keeping delimiters
        const parts = src.split(/(^\n---\n|^\n--\n)/m);
        const allocId = makeIdAllocator();
        let hadError = false;
        let lineOffset = 0;
        const out = parts.map(function (part) {
            if (part === '\n---\n' || part === '\n--\n') {
                lineOffset += 2;
                return part;
            }
            const r = expandChunk(part, allocId, name, lineOffset);
            lineOffset += part.split('\n').length - 1;
            if (r.hadError) hadError = true;
            return r.md;
        });
        return { markdown: out.join(''), hadError: hadError };
    }

    /* DOM pass: fetch external data-markdown sections, expand, inline them.
       Runs after plugins load, before revconfig.js calls Reveal.initialize,
       so RevealMarkdown never fetches the raw files itself. */
    function expandMarkdownSections() {
        const sections = Array.prototype.slice.call(document.querySelectorAll('section[data-markdown]'));
        return Promise.all(sections.map(function (sec) {
            const url = sec.getAttribute('data-markdown');
            if (!url) return Promise.resolve();
            return fetch(url)
                .then(function (r) {
                    if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
                    return r.text();
                })
                .then(function (src) {
                    const result = expandDirectives(src, { name: url });
                    const tpl = document.createElement('script');
                    tpl.type = 'text/template';
                    tpl.textContent = result.markdown;
                    sec.setAttribute('data-markdown', '');
                    sec.textContent = '';
                    sec.appendChild(tpl);
                    if (result.hadError) {
                        console.warn('[directives] ' + url + ' contains directive errors — see the red error slide(s).');
                    }
                });
        }));
    }

    /* Give @zoom images explicit boxes equal to their visible content, in
       slide coordinates, once natural dimensions are known. Runs after
       Reveal.initialize (called from script-loader.js). Auto-animate then
       interpolates between the differing boxes, producing the zoom. */
    function positionZoomImages() {
        function positionAll() {
            document.querySelectorAll('img[data-md-zoom]').forEach(function (img) {
                const spec = img.getAttribute('data-md-zoom').split(',').map(parseFloat);
                const fx = spec[0], fy = spec[1], k = spec[2];
                function apply() {
                    const frame = img.parentElement;
                    const section = img.closest('section');
                    const wasHidden = section && getComputedStyle(section).display === 'none';
                    let prevDisplay, prevVisibility;
                    if (wasHidden) {
                        prevDisplay = section.style.display;
                        prevVisibility = section.style.visibility;
                        section.style.visibility = 'hidden';
                        section.style.display = 'block';
                    }
                    const W = frame.clientWidth, H = frame.clientHeight;
                    const nw = img.naturalWidth, nh = img.naturalHeight;
                    if (W && H && nw && nh) {
                        const s = Math.min(W / nw, H / nh);   // contain scale at 1x
                        const cw = nw * s, ch = nh * s;       // visible content size
                        // Box = content enlarged by k, focus point centred.
                        // Same aspect as slide A's contained content, so the
                        // auto-animate interpolation is a uniform scale.
                        img.style.width = (cw * k) + 'px';
                        img.style.height = (ch * k) + 'px';
                        img.style.left = (W / 2 - k * fx * cw) + 'px';
                        img.style.top = (H / 2 - k * fy * ch) + 'px';
                    }
                    if (wasHidden) {
                        section.style.display = prevDisplay;
                        section.style.visibility = prevVisibility;
                    }
                }
                if (img.complete && img.naturalWidth) { apply(); }
                else { img.addEventListener('load', apply); }
            });
        }
        positionAll();
        // Re-run after webfonts settle: late reflow changes heading heights
        // and therefore frame sizes, which would leave stale pixel boxes
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(positionAll);
        }
        window.addEventListener('load', positionAll);
    }

    /* Autofit overflowing split-slide text columns: when a .md-split-body
       is taller than its grid row (long quotes, generous line spacing),
       scale it down until it fits rather than letting the text spill over
       the heading. Uses a transform, not font-size: reveal's auto-animate
       pins absolute font sizes on hold-pair slides, which defeats any
       em-cascade approach. Width is compensated so the column refills.
       Floor at 65% so genuine failure stays visible. */
    function autofitFillSlides() {
        document.querySelectorAll('section.md-fill').forEach(function (section) {
            const split = section.querySelector('.md-split');
            const body = section.querySelector('.md-split-body');
            if (!split || !body) return;
            const wasHidden = getComputedStyle(section).display === 'none';
            let prevDisplay, prevVisibility;
            if (wasHidden) {
                prevDisplay = section.style.display;
                prevVisibility = section.style.visibility;
                section.style.visibility = 'hidden';
                section.style.display = 'block';
            }
            body.style.transform = '';
            body.style.width = '';
            body.style.transformOrigin = 'left center';
            let scale = 1;
            let guard = 8;
            while (guard-- > 0 && scale > 0.65 &&
                   body.offsetHeight * scale > split.clientHeight) {
                scale -= 0.05;
                body.style.width = (100 / scale).toFixed(2) + '%';
                body.style.transform = 'scale(' + scale.toFixed(2) + ')';
            }
            if (wasHidden) {
                section.style.display = prevDisplay;
                section.style.visibility = prevVisibility;
            }
        });
    }

    window.autofitFillSlides = autofitFillSlides;

    window.expandDirectives = expandDirectives;
    window.expandMarkdownSections = expandMarkdownSections;
    window.positionZoomImages = positionZoomImages;
})();
