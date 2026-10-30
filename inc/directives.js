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
    const KNOWN_FLAGS = ['fragment', 'hold', 'natural', 'spare',
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

    /* ---------- inline marks (SPEC 5) ----------

       One pass over the expanded markdown of a chunk, line by line, before
       reveal's markdown plugin sees it. Marks become HTML spans; marked
       still parses the markdown inside them.

         ^^x^^  small caps        %%x%%  subtle         ==x==  highlight
         [x]{name}  palette colour (or accent)          [S x]  grammar function
         [[x]]  morph piece   [[x|id]]  piece, own id   [[x]]{name}  tag pill
         :fa-name:  Font Awesome icon
         {==x==} {++x++} {--x--} {~~a~>b~~} {answer x}  on a click

       A brace on its own happens on a click; a brace straight after a
       closing bracket styles the bracketed text. Untouched: code spans and
       fenced code, HTML tags and comments, link destinations, backslash
       escapes (left for marked: \[ \{ \* \|), and any text between
       <!--md-raw--> and <!--/md-raw--> (for directives with their own
       notation, such as @parse). Every paired mark needs a non-space just
       inside each marker, so a == b stays literal. */

    const PALETTE_HUES = ['red', 'orange', 'gold', 'green', 'teal', 'blue',
        'navy', 'purple', 'pink', 'grey'];
    const PALETTE_NAMES = PALETTE_HUES
        .concat(PALETTE_HUES.map(function (h) { return 'light-' + h; }))
        .concat(['white', 'black']);
    /* University of Glasgow brand names (and two spellings) accepted
       everywhere; corporate mode (phase 4) maps the names to brand values */
    const COLOUR_ALIASES = {
        'dark-red': 'red', 'dark-pink': 'pink', 'dark-green': 'green',
        'dark-blue': 'blue', 'dark-purple': 'purple',
        'university-blue': 'navy', 'light-yellow': 'light-gold',
        'gray': 'grey', 'light-gray': 'light-grey'
    };
    function resolveColour(name) {
        if (!name) return null;
        name = String(name).toLowerCase();
        if (COLOUR_ALIASES[name]) name = COLOUR_ALIASES[name];
        return PALETTE_NAMES.indexOf(name) !== -1 ? name : null;
    }
    /* A colour option on a directive: a palette name or #RRGGBB */
    function colourValue(v) {
        if (/^#[0-9a-fA-F]{6}$/.test(v || '')) return { hex: v.toUpperCase() };
        const n = resolveColour(v);
        return n ? { name: n } : null;
    }
    const MORPHEME_STATES = ['plain', 'split', 'apart', 'jigsaw', 'bases', 'affixes'];
    const GRAMMAR_CODES = {
        S: 'subject', P: 'predicator', O: 'object', Od: 'object', Oi: 'object',
        C: 'complement', Cs: 'complement', Co: 'complement', A: 'adverbial',
        cj: 'conjunction'
    };

    function pieceSlug(text) {
        const s = text.replace(/\u0000\d+\u0000/g, '').replace(/\]\{[\w-]+\}/g, '').toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
        return 'p-' + (s || 'piece');
    }

    /* ctx: { warn(msg), allocPiece(want) } */
    function inlineLine(line, ctx) {
        const store = [];
        const hold = function (text, kind) {
            store.push({ text: text, kind: kind || 'raw' });
            return '\u0000' + (store.length - 1) + '\u0000';
        };
        const tag = function (html) { return hold(html, 'tag'); };
        const kindAt = function (s, i) {
            const m = /^\u0000(\d+)\u0000/.exec(s.slice(i));
            return m ? store[+m[1]] : null;
        };

        // 1. Protect what must not be read as marks
        let s = line.replace(
            /\\[!-\/:-@\[-`{-~]|(`+)[^`][\s\S]*?\1|<!--[\s\S]*?-->|<\/?[A-Za-z][^<>]*>/g,
            function (m) { return hold(m); });
        // link destinations: keep the ], hide the (url "title")
        s = s.replace(/\]\((?:[^()\s]|\([^()\s]*\))*(?:\s+(?:"[^"]*"|'[^']*'))?\)/g,
            function (m) { return ']' + hold(m.slice(1), 'dest'); });

        // 2. Click marks (they do not nest in each other)
        const click = function (cls, inner) {
            return tag('<span class="fragment custom ' + cls + '"><span>') + inner + tag('</span></span>');
        };
        s = s.replace(/\{==(\S(?:.*?\S)?)==\}/g, function (m, x) {
            return tag('<span class="fragment custom md-hl-in">') + x + tag('</span>');
        });
        s = s.replace(/\{\+\+(\S(?:.*?\S)?)\+\+\}/g, function (m, x) { return click('md-ins', x); });
        s = s.replace(/\{--(\S(?:.*?\S)?)--\}/g, function (m, x) { return click('md-del', x); });
        s = s.replace(/\{~~(\S(?:.*?\S)?)~>(.*?)~~\}/g, function (m, a, b) {
            return tag('<span class="fragment custom md-sub"><span class="md-sub-a"><span>') + a +
                tag('</span></span><span class="md-sub-b"><span>') + b.trim() + tag('</span></span></span>');
        });
        s = s.replace(/\{answer (\S(?:[^{}]*?\S)?)\}/g, function (m, x) {
            return tag('<span class="fragment md-answer">') + x + tag('</span>');
        });

        // 3. Pieces and tags: [[x]], [[x|id]], [[x]]{name}
        s = s.replace(/\[\[((?:(?!\]\]).)+?)\]\](?:\{([A-Za-z][\w-]*)\})?/g, function (m, body, name) {
            let text = body.trim(), id = null;
            const bar = /^(.*)\|([\w-]+)$/.exec(text);
            if (bar) { text = bar[1].trim(); id = bar[2]; }
            if (!text) return m;
            id = id || ctx.allocPiece(pieceSlug(text));
            let cls = 'md-piece', tail = '';
            if (name) {
                const c = resolveColour(name);
                if (c) cls = 'md-piece md-tag md-bg-' + c;
                else { tail = '{' + name + '}'; ctx.warn('unknown colour in ' + m + ' (palette: ' + PALETTE_HUES.join(', ') + ', light-…, white, black)'); }
            }
            return tag('<span class="' + cls + '" data-id="' + esc(id) + '">') + text + tag('</span>') + tail;
        });

        // 4. Single brackets, innermost first: colour marks, grammar marks;
        //    anything else (links, references, prose brackets) stays literal
        const bracket = /\[([^\[\]]*)\]/;
        let m, guard = 2000;
        while (guard-- > 0 && (m = bracket.exec(s))) {
            const start = m.index, end = start + m[0].length, content = m[1];
            const after = s.slice(end), before = s.slice(0, start);
            const nextKind = kindAt(s, end);
            const prevLiteral = /\u0000(\d+)\u0000$/.exec(before);
            const literal = function () {
                s = before + hold('[', 'lb') + content + hold(']', 'rb') + after;
            };
            const brace = /^\{([A-Za-z][\w-]*)\}/.exec(after);
            if (brace) {
                const name = brace[1];
                const c = name === 'accent' ? 'accent' : resolveColour(name);
                if (c && content.trim()) {
                    s = before + tag('<span class="md-c md-c-' + c + '">') + content + tag('</span>') +
                        after.slice(brace[0].length);
                    continue;
                }
                if (MORPHEME_STATES.indexOf(name) !== -1) ctx.warn('morpheme words such as ' + m[0] + brace[0] + ' are not built yet (phase 2b)');
                else ctx.warn('unknown colour in ' + m[0] + brace[0] + ' (palette: ' + PALETTE_HUES.join(', ') + ', light-…, white, black, accent)');
                literal();
                continue;
            }
            const isLink = (nextKind && nextKind.kind === 'dest') || /^[\[(:]/.test(after) ||
                (prevLiteral && store[+prevLiteral[1]].kind === 'rb');
            const g = !isLink && /^(Od|Oi|Cs|Co|cj|S|P|O|C|A) (\S[\s\S]*)$/.exec(content);
            if (g) {
                const words = g[2].replace(/\u0000\d+\u0000/g, ' ').trim().split(/\s+/).length;
                if (words > 8) ctx.warn('grammar mark of ' + words + ' words, is it prose? [' + g[1] + ' ' + g[2].slice(0, 40) + '…] (write \\[ for a literal bracket)');
                s = before + tag('<span class="md-g ' + GRAMMAR_CODES[g[1]] + '" data-g="' + g[1] + '">') +
                    g[2] + tag('</span>') + after;
                continue;
            }
            literal();
        }

        // 5. Static marks
        s = s.replace(/==([^\s=](?:.*?[^\s=])?)==/g, function (m, x) {
            return tag('<span class="md-hl">') + x + tag('</span>');
        });
        s = s.replace(/\^\^([^\^\s](?:[^\^]*?[^\^\s])?)\^\^/g, function (m, x) {
            return tag('<span class="md-sc">') + x + tag('</span>');
        });
        s = s.replace(/%%([^%\s](?:[^%]*?[^%\s])?)%%/g, function (m, x) {
            return tag('<span class="md-subtle">') + x + tag('</span>');
        });
        s = s.replace(/:fa-([a-z0-9]+(?:-[a-z0-9]+)*):/g, function (m, n) {
            return tag('<i class="fad fa-' + n + ' md-icon" aria-hidden="true"></i>');
        });

        // 6. Restore everything held back
        return s.replace(/\u0000(\d+)\u0000/g, function (m, n) { return store[+n].text; });
    }

    function inlineMarks(md, ctx) {
        if (!/[\^%=\[{:]/.test(md)) return md;
        // multi-line HTML comments (slide attributes, md-raw guards) are
        // held back whole so the line pass never sees inside them
        const blocks = [];
        md = md.replace(/<!--md-raw-->[\s\S]*?<!--\/md-raw-->|<!--[\s\S]*?-->/g, function (m) {
            blocks.push(m);
            return '\u0001' + (blocks.length - 1) + '\u0001';
        });
        let fence = null;
        md = md.split('\n').map(function (line) {
            const f = /^\s*(`{3,}|~{3,})/.exec(line);
            if (fence) {
                if (f && f[1].charAt(0) === fence.charAt(0) && f[1].length >= fence.length) fence = null;
                return line;
            }
            if (f) { fence = f[1]; return line; }
            if (/^\s*[=\-]+\s*$/.test(line)) return line;       // setext underlines, rules
            return inlineLine(line, ctx);
        }).join('\n');
        return md.replace(/\u0001(\d+)\u0001/g, function (m, n) { return blocks[+n]; });
    }

    function makeInlineCtx(warnings) {
        const alloc = makeIdAllocator();
        return {
            warn: function (msg) { if (warnings) warnings.push(msg); },
            allocPiece: alloc
        };
    }

    /* Several directives on one slide (@slide plus @section, @quote, an
       image directive...) each emit a <!-- .slide: --> comment, and reveal
       applies them in turn, so a later class="" replaced an earlier one.
       Merge them into one comment per slide: classes are combined, other
       attributes keep their first value, bare flags are kept. */
    function mergeSlideComments(md) {
        return md.split(/(\n---?\n)/).map(function (piece) {
            if (/^\n---?\n$/.test(piece)) return piece;
            const re = /^[ \t]*<!--\s*\.slide:([\s\S]*?)-->[ \t]*$/gm;
            const found = piece.match(re);
            if (!found || found.length < 2) return piece;
            const classes = [], attrs = [], seen = {};
            for (const c of found) {
                const body = /<!--\s*\.slide:([\s\S]*?)-->/.exec(c)[1];
                const attrRe = /([\w-]+)(?:\s*=\s*"([^"]*)")?/g;
                let m;
                while ((m = attrRe.exec(body))) {
                    const key = m[1], val = m[2];
                    if (key === 'class') {
                        for (const k of (val || '').split(/\s+/)) {
                            if (k && classes.indexOf(k) === -1) classes.push(k);
                        }
                    } else if (!seen[key]) {
                        seen[key] = true;
                        attrs.push(val === undefined ? key : key + '="' + val + '"');
                    }
                }
            }
            const merged = '<!-- .slide:' +
                (classes.length ? ' class="' + classes.join(' ') + '"' : '') +
                (attrs.length ? ' ' + attrs.join(' ') : '') + ' -->';
            let first = true;
            return piece.replace(re, function () {
                if (first) { first = false; return merged; }
                return '';
            });
        }).join('');
    }

    function wrapFillSlides(md) {
        return md.split('\n--\n').map(function (piece) {
            if (!/class="[^"]*\bmd-fill\b[^"]*"/.test(piece)) return piece;
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
        const classMap = { smaller: 'md-smaller', smallest: 'md-smallest', spare: 'md-spare',
            centred: 'md-centred', centered: 'md-centred',
            plain: 'md-plain', contrast: 'md-contrast' };
        const classes = [];
        for (const f of opts._flags) {
            if (!classMap[f]) {
                return { md: errorSlide(name, lineNo, srcLine,
                    'Unknown @slide flag `' + esc(f) + '`. Available: smaller, smallest, centred, plain, contrast, spare (plus bg=&lt;colour&gt;).'), isError: true };
            }
            classes.push(classMap[f]);
        }
        if (opts.bg && !/^[#\w][\w#(),.%\- ]*$/.test(opts.bg)) {
            return { md: errorSlide(name, lineNo, srcLine,
                'bg= does not look like a CSS colour.'), isError: true };
        }
        if (!classes.length && !opts.bg) {
            return { md: errorSlide(name, lineNo, srcLine,
                '@slide needs at least one flag (smaller, smallest, centred, plain, contrast, spare) or bg=&lt;colour&gt;.'), isError: true };
        }
        let attrs = '';
        if (classes.length) attrs += ' class="' + classes.join(' ') + '"';
        if (classes.indexOf('md-spare') !== -1) attrs += ' data-visibility="uncounted"';
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

    /* ---------- the shared directive parser (SPEC 3) ----------

       New directives register here rather than adding a branch to
       expandChunk. A spec says which of the four kinds of body follows the
       directive line and which options it takes; the parser checks the
       line, collects the body, handles name= and repeats, and turns every
       failure into the red error slide.

         registerDirective('terms', {
             body: 'items',            // 'line' | 'items' | 'markdown' | 'prefix'
             text: false,              // true: rest of line is text, options after ' :: '
             positional: 0,            // how many leading bare values it takes
             keys: ['widths'],         // key=value options
             flags: ['sc', 'answers'], // bare flags
             lists: ['widths'],        // comma-separated, no spaces: widths=2,1
             numbers: ['cols'],        // must be numbers
             colours: ['head'],        // palette name or #RRGGBB
             sequences: ['steps'],     // steps="a b+c" -> [['a'], ['b','c']]
             build: ['level', 'up'],   // build=VALUE allowed (bare build always is)
             emit: function (d, api) { return markdown; }
         });

       d: { kind, lineNo, srcLine, text, positional: [{value, type}], opts,
            flags, build, items, body, block, named }. Items are
            { raw, text, fields, depth, lineNo }. api.fail(message[, item])
       stops with an error slide; api.expand(lines) expands directives
       inside a markdown body; api.warn(message) logs in local preview. */

    const REGISTRY = {};
    function registerDirective(kind, spec) { REGISTRY[kind] = spec; }

    function DirectiveError(message, item) { this.message = message; this.item = item; }

    function numberLike(v) { return /^-?\d+(\.\d+)?$/.test(v); }

    function parseDirectiveLine(rest, spec) {
        const d = { text: null, positional: [], opts: {}, flags: [], build: null };
        let optStr = rest;
        if (spec.text) {
            const padded = ' ' + rest + ' ';
            const k = padded.lastIndexOf(' :: ');
            d.text = (k === -1 ? rest : padded.slice(0, k)).trim();
            optStr = k === -1 ? '' : padded.slice(k + 4).trim();
            if (!d.text) throw new DirectiveError('needs its text on the same line, before any ` :: ` options.');
        }
        const keys = (spec.keys || []).concat(spec.body !== 'line' ? ['name'] : []);
        const flags = spec.flags || [];
        const buildModes = spec.build || [];
        const allowsBuild = spec.body !== 'line' || spec.build;
        const re = /([\w-]+)=(?:"([^"]*)"|(\S+))|"([^"]*)"|(\S+)/g;
        let m, seenOption = false;
        while ((m = re.exec(optStr)) !== null) {
            if (m[1] !== undefined) {
                seenOption = true;
                const key = m[1];
                let val = m[2] !== undefined ? m[2] : m[3];
                if (key === 'build' && allowsBuild) {
                    if (buildModes.indexOf(val) === -1) {
                        throw new DirectiveError('Unknown build order `' + esc(val) + '`.' +
                            (buildModes.length ? ' Valid: build, ' + buildModes.map(function (b) { return 'build=' + b; }).join(', ') + '.' : ' Only a bare `build` is valid here.'));
                    }
                    d.build = val;
                    continue;
                }
                if (keys.indexOf(key) === -1) {
                    const hint = keys.filter(function (x) { return x.charAt(0) === key.charAt(0); })[0];
                    throw new DirectiveError('Unknown option `' + esc(key) + '`.' +
                        (hint ? ' Did you mean `' + hint + '`?' : '') +
                        (keys.length ? ' Valid options: ' + keys.join(', ') + '.' : ' This directive takes no key=value options.'));
                }
                if (d.opts[key] !== undefined) throw new DirectiveError('`' + esc(key) + '` is given twice.');
                if ((spec.lists || []).indexOf(key) !== -1) {
                    if (/\s/.test(val) || /^,|,,|,$/.test(val)) {
                        throw new DirectiveError('`' + esc(key) + '` takes a comma-separated list with no spaces, e.g. ' + key + '=2,1.');
                    }
                    val = val.split(',');
                    if ((spec.numbers || []).indexOf(key) !== -1) {
                        if (!val.every(numberLike)) throw new DirectiveError('`' + esc(key) + '` takes numbers, e.g. ' + key + '=2,1.');
                        val = val.map(parseFloat);
                    }
                } else if ((spec.numbers || []).indexOf(key) !== -1) {
                    if (!numberLike(val)) throw new DirectiveError('`' + esc(key) + '` takes a number, e.g. ' + key + '=2.');
                    val = parseFloat(val);
                } else if ((spec.colours || []).indexOf(key) !== -1) {
                    const c = colourValue(val);
                    if (!c) throw new DirectiveError('`' + esc(key) + '=' + esc(val) + '` is not a colour: use a palette name (' + PALETTE_HUES.join(', ') + ', light-…, white, black) or #RRGGBB.');
                    val = c;
                } else if ((spec.sequences || []).indexOf(key) !== -1) {
                    val = val.trim().split(/\s+/).filter(Boolean).map(function (st) { return st.split('+').filter(Boolean); });
                    if (!val.length) throw new DirectiveError('`' + esc(key) + '` is empty: write ' + key + '="a b c", with + joining two steps into one click.');
                }
                d.opts[key] = val;
            } else {
                const bare = m[4] !== undefined ? m[4] : m[5];
                if (bare === 'build' && allowsBuild) { d.build = d.build || true; seenOption = true; continue; }
                if (!seenOption && d.positional.length < (spec.positional || 0) + (spec.body !== 'line' ? 1 : 0) &&
                    flags.indexOf(bare) === -1) {
                    d.positional.push({ value: bare,
                        type: /[.\/]/.test(bare) && !numberLike(bare) ? 'path' : numberLike(bare) ? 'number' : 'name' });
                    continue;
                }
                if (flags.indexOf(bare) === -1) {
                    throw new DirectiveError('Unknown flag `' + esc(bare) + '`.' +
                        (flags.length ? ' Valid flags: ' + flags.concat(allowsBuild ? ['build'] : []).join(', ') + '.' : '') +
                        ' (Values with spaces need quotes: key="like this".)');
                }
                seenOption = true;
                if (d.flags.indexOf(bare) === -1) d.flags.push(bare);
            }
        }
        return d;
    }

    /* Item lines: indented lines up to the first blank or unindented line.
       A leading list marker is dropped; ' :: ' splits fields; a line
       indented further than the one above is its child (depth + 1). */
    function collectItems(lines, start, lineOffset) {
        const items = [], stack = [];
        let i = start;
        while (i < lines.length && /^[ \t]+\S/.test(lines[i])) {
            const raw = lines[i];
            const indent = raw.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
            while (stack.length && stack[stack.length - 1] > indent) stack.pop();
            if (!stack.length || stack[stack.length - 1] < indent) stack.push(indent);
            const text = raw.trim().replace(/^(?:[*+-]|\d+[.)])\s+/, '');
            items.push({ raw: raw, text: text, fields: text.split(/\s::(?=\s|$)/).map(function (f) { return f.trim(); }),
                depth: stack.length - 1, lineNo: lineOffset + i + 1 });
            i++;
        }
        return { items: items, next: i };
    }

    /* Markdown body: up to a matching @end (nested markdown-body
       directives need their own), else to the end of the slide or its
       notes. Without @end, slide furniture lines (@slide, @source) are
       lifted out of the body and handled where the slide is assembled. */
    const FURNITURE = /^@(slide|source)\b/;
    function collectMarkdown(lines, start) {
        let depth = 0, j = start;
        for (; j < lines.length; j++) {
            const l = lines[j];
            if (/^notes:/.test(l)) break;
            if (/^@end\s*$/.test(l)) {
                if (depth === 0) return { body: lines.slice(start, j), next: j + 1, closed: true, furniture: [] };
                depth--;
                continue;
            }
            const dm = /^@([\w-]+)/.exec(l);
            if (dm && REGISTRY[dm[1]] && REGISTRY[dm[1]].body === 'markdown') depth++;
        }
        const body = [], furniture = [];
        lines.slice(start, j).forEach(function (l) { (FURNITURE.test(l) ? furniture : body).push(l); });
        return { body: body, next: j, closed: false, furniture: furniture };
    }

    /* Prefix: the next markdown block (blank lines before it are skipped;
       it ends at the next blank line) */
    function collectPrefix(lines, start) {
        let i = start;
        while (i < lines.length && !lines[i].trim()) i++;
        const s = i;
        while (i < lines.length && lines[i].trim() && !/^notes:/.test(lines[i])) i++;
        return { block: lines.slice(s, i), next: i };
    }

    function runRegistered(kind, lines, i, deck, lineOffset) {
        const spec = REGISTRY[kind];
        const line = lines[i];
        const lineNo = lineOffset + i + 1;
        const rest = line.replace(/^@[\w-]+/, '').trim();
        const fail = function (e, next) {
            const src = e.item ? e.item.raw.trim() : line;
            const no = e.item ? e.item.lineNo : lineNo;
            return { md: errorSlide(deck.name, no, src, '@' + kind + ': ' + e.message), isError: true, next: next, furniture: [] };
        };
        let d, next = i + 1, furniture = [];
        try {
            d = parseDirectiveLine(rest, spec);
        } catch (e) {
            if (!(e instanceof DirectiveError)) throw e;
            // skip the body so it does not render as stray text
            if (spec.body === 'items') next = collectItems(lines, i + 1, lineOffset).next;
            else if (spec.body === 'markdown') next = collectMarkdown(lines, i + 1).next;
            return fail(e, next);
        }
        d.kind = kind; d.lineNo = lineNo; d.srcLine = line;
        d.items = []; d.body = []; d.block = [];
        const named = deck.named[kind] || (deck.named[kind] = {});
        const first = d.positional[0];
        const repeat = spec.body !== 'line' && first && first.type === 'name' && named[first.value];
        try {
            if (repeat) {
                // a named block repeated: its body, the options merged over the original's
                const orig = named[first.value];
                if (spec.body === 'items' && /^[ \t]+\S/.test(lines[i + 1] || '')) {
                    throw new DirectiveError('repeats the block named `' + esc(first.value) + '`, so it takes no item lines of its own.');
                }
                if (d.opts.name) throw new DirectiveError('a repeat cannot take name= (it repeats `' + esc(first.value) + '`).');
                d.positional = orig.positional.slice();
                d.opts = Object.assign({}, orig.opts, d.opts);
                d.flags = orig.flags.concat(d.flags.filter(function (f) { return orig.flags.indexOf(f) === -1; }));
                d.build = d.build !== null ? d.build : orig.build;
                d.text = orig.text;
                d.items = orig.items; d.body = orig.body; d.block = orig.block;
                d.named = first.value;
            } else {
                if (spec.body !== 'line' && d.positional.length > (spec.positional || 0)) {
                    const extra = d.positional[d.positional.length - 1].value;
                    throw new DirectiveError(first.type === 'name' && !spec.positional
                        ? 'there is no block named `' + esc(first.value) + '` earlier in this deck (define it first with name=' + esc(first.value) + ').'
                        : 'unexpected value `' + esc(extra) + '`.');
                }
                if (spec.body === 'items') {
                    const c = collectItems(lines, i + 1, lineOffset);
                    d.items = c.items; next = c.next;
                    if (!d.items.length) throw new DirectiveError('needs at least one indented item line below it.');
                } else if (spec.body === 'markdown') {
                    const c = collectMarkdown(lines, i + 1);
                    d.body = c.body; next = c.next; furniture = c.furniture;
                    if (!d.body.join('').trim()) throw new DirectiveError('needs markdown on the lines after it (ended by @end, or the end of the slide).');
                } else if (spec.body === 'prefix') {
                    const c = collectPrefix(lines, i + 1);
                    d.block = c.block; next = c.next;
                    if (!d.block.length) throw new DirectiveError('applies to the next markdown block, but nothing follows it on this slide.');
                }
                if (d.opts.name !== undefined) {
                    if (!/^[\w-]+$/.test(d.opts.name)) throw new DirectiveError('`name=` takes letters, digits, - and _ only.');
                    if (named[d.opts.name]) throw new DirectiveError('a block named `' + esc(d.opts.name) + '` already exists in this deck.');
                    named[d.opts.name] = { positional: d.positional, opts: Object.assign({}, d.opts, { name: undefined }),
                        flags: d.flags.slice(), build: d.build, text: d.text, items: d.items, body: d.body, block: d.block };
                    delete named[d.opts.name].opts.name;
                    d.named = d.opts.name;
                }
            }
            const api = {
                fail: function (message, item) { throw new DirectiveError(message, item); },
                warn: function (message) { deck.warnings.push('@' + kind + ', line ' + lineNo + ': ' + message); },
                expand: function (bodyLines) { return expandChunk(bodyLines.join('\n'), deck, lineNo).md; }
            };
            const md = spec.emit(d, api);
            return { md: md, isError: false, next: next, furniture: furniture };
        } catch (e) {
            if (!(e instanceof DirectiveError)) throw e;
            return fail(e, next);
        }
    }

    /* ---------- chunk-level expansion ---------- */

    function expandChunk(chunk, deck, lineOffset) {
        const allocId = deck.allocId, name = deck.name;
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
            } else if (kind === 'note') {
                const text = dm[2].trim();
                r = text
                    ? { md: '\n<div class="md-note">\n\n' + text + '\n\n</div>\n', isError: false }
                    : { md: errorSlide(name, lineNo, line, '@note needs its text on the same line, e.g. `@note Hansard reports in the third person.`'), isError: true };
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
                    return { md: out.join('\n'), hadError: hadError };
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
                    return { md: out.join('\n'), hadError: hadError };
                }
            } else if (REGISTRY[kind]) {
                const res = runRegistered(kind, lines, i, deck, lineOffset);
                out.push(res.md);
                if (res.isError) hadError = true;
                if (res.furniture.length) {
                    const f = expandChunk(res.furniture.join('\n'), deck, lineOffset + res.next);
                    out.push(f.md);
                    if (f.hadError) hadError = true;
                }
                i = res.next;
                continue;
            } else if (kind === 'end') {
                r = { md: errorSlide(name, lineNo, line,
                    '`@end` with no open block: it closes a markdown body (@cards, @columns, @quote ...) opened earlier on the same slide.'), isError: true };
            } else {
                r = { md: errorSlide(name, lineNo, line,
                    'Unknown directive `@' + esc(kind) + '`. Available: @image, @image-seq, @image-left, @image-right, @compare, @zoom, @kenburns, @slide, @section, @quote, @refs, @note' +
                    Object.keys(REGISTRY).map(function (k) { return ', @' + k; }).join('') + '. (Escape a literal @ with @@.)'), isError: true };
            }
            out.push(r.md);
            if (r.isError) hadError = true;
            i++;
        }
        return { md: out.join('\n'), hadError: hadError };
    }

    /* ---------- top-level API ---------- */

    function expandDirectives(src, meta) {
        const name = (meta && meta.name) || 'markdown';
        // short-circuit only when there is nothing at all to expand
        // (inline marks must expand even in directive-free decks)
        if (!/[@^%=\[{:]/.test(src)) {
            return { markdown: src, hadError: false, warnings: [] };
        }
        // Split on reveal's separators (blank-line anchored, matching the
        // data-separator regexes ^\n---\n and ^\n--\n), keeping delimiters
        const parts = src.split(/(^\n---\n|^\n--\n)/m);
        // one deck: ids, named blocks and warnings are shared by its slides
        const deck = { name: name, allocId: makeIdAllocator(), named: {}, warnings: [] };
        let hadError = false;
        let lineOffset = 0;
        const out = parts.map(function (part) {
            if (part === '\n---\n' || part === '\n--\n') {
                lineOffset += 2;
                return part;
            }
            const r = expandChunk(part, deck, lineOffset);
            lineOffset += part.split('\n').length - 1;
            if (r.hadError) hadError = true;
            return inlineMarks(wrapFillSlides(mergeSlideComments(r.md)), makeInlineCtx(deck.warnings));
        });
        return { markdown: out.join(''), hadError: hadError, warnings: deck.warnings };
    }

    /* Separate slides flagged @slide spare from the rest of a deck's
       expanded markdown. Works on reveal's own separators (blank line then
       --- for horizontal, -- for vertical); a spare vertical slide leaves
       its stack and becomes a horizontal slide among the spares. */
    function extractSpares(md) {
        if (md.indexOf('md-spare') === -1) return { main: md, spares: '' };
        const spares = [];
        const hParts = md.split(/(^\n---\n)/m);
        const keptH = [];
        for (let i = 0; i < hParts.length; i += 2) {
            const vParts = hParts[i].split(/(^\n--\n)/m);
            const keptV = [];
            for (let j = 0; j < vParts.length; j += 2) {
                if (vParts[j].indexOf('md-spare') !== -1) spares.push(vParts[j].trim());
                else keptV.push(vParts[j]);
            }
            if (keptV.length) keptH.push(keptV.join('\n--\n'));
        }
        return {
            main: keptH.join('\n---\n'),
            spares: spares.join('\n\n---\n\n')
        };
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
                    const split = extractSpares(result.markdown);
                    const tpl = document.createElement('script');
                    tpl.type = 'text/template';
                    tpl.textContent = split.main;
                    sec.setAttribute('data-markdown', '');
                    sec.textContent = '';
                    sec.appendChild(tpl);
                    // @slide spare: move those slides to a section of their
                    // own at the very end, after the closing slide, where
                    // reveal leaves them out of the count and progress bar
                    if (split.spares) {
                        const spare = sec.cloneNode(false);
                        const stpl = document.createElement('script');
                        stpl.type = 'text/template';
                        stpl.textContent = split.spares;
                        spare.appendChild(stpl);
                        sec.parentNode.appendChild(spare);
                    }
                    if (result.hadError) {
                        console.warn('[directives] ' + url + ' contains directive errors — see the red error slide(s).');
                    }
                    // unknown colour names, suspect grammar marks: local preview only
                    if (window.MGA_LOCAL_PREVIEW) {
                        result.warnings.forEach(function (w) { console.warn('[marks] ' + url + ': ' + w); });
                    }
                });
        }));
    }

    /* Give @zoom images explicit boxes equal to their visible content, in
       slide coordinates, once natural dimensions are known. Runs after
       Reveal.initialize (called from script-loader.js). Auto-animate then
       interpolates between the differing boxes, producing the zoom. */

    /* Measuring a slide that reveal has hidden (display:none on distant
       slides, and on the whole vertical stack that contains them) needs
       the slide and every hidden ancestor section shown, invisibly, for
       the moment of measurement. Returns a function that undoes it. */
    function unhideForMeasuring(el) {
        const changed = [];
        let node = el && el.closest ? el.closest('section') : null;
        while (node && node.tagName === 'SECTION') {
            if (getComputedStyle(node).display === 'none') {
                changed.push([node, node.style.display, node.style.visibility]);
                node.style.display = 'block';
                node.style.visibility = 'hidden';
            }
            node = node.parentElement && node.parentElement.closest('section');
        }
        return function restore() {
            for (let i = changed.length - 1; i >= 0; i--) {
                changed[i][0].style.display = changed[i][1];
                changed[i][0].style.visibility = changed[i][2];
            }
        };
    }

    function positionZoomImages() {
        function positionAll() {
            document.querySelectorAll('img[data-md-zoom]').forEach(function (img) {
                const spec = img.getAttribute('data-md-zoom').split(',').map(parseFloat);
                const fx = spec[0], fy = spec[1], k = spec[2];
                function apply() {
                    const frame = img.parentElement;
                    const restore = unhideForMeasuring(img);
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
                    restore();
                }
                if (img.complete && img.naturalWidth) { apply(); }
                else { img.addEventListener('load', apply); }
            });
        }
        // (script-loader.js re-runs this when fonts settle, the theme
        // changes or the window resizes)
        positionAll();
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
            const restore = unhideForMeasuring(section);
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
            restore();
        });
    }

    window.autofitFillSlides = autofitFillSlides;

    /* Autofit text slides: when an ordinary slide's content runs past the
       bottom of the 1920x1080 stage, shrink everything except the heading
       (so headings never jump between slides) until it fits. Uses CSS
       zoom, which changes layout size as well as appearance, so the fit
       can be measured directly and em-based sizes inside (md-small,
       @refs, nested lists) keep their proportions. Steps of 4%, floor at
       72%: past that the slide needs splitting, so it is flagged instead
       (a console warning, and a visible note in local preview).
       Skips title/closing slides, image layouts (autofitFillSlides handles
       split columns), @section dividers, and any slide marked
       <!-- .slide: data-autofit="off" -->. */
    function autofitTextSlides() {
        const H = (window.Reveal && Reveal.getConfig) ? Reveal.getConfig().height : 1080;
        const STEP = 0.04, FLOOR = 0.72;
        const skip = '.title-slide, .md-fill, .md-section, .directive-error-slide, [data-autofit="off"]';
        document.querySelectorAll('.reveal .slides section').forEach(function (section) {
            if (section.querySelector('section')) return;          // a vertical stack
            if (section.matches(skip)) return;
            if (!section.children.length) return;
            const restore = unhideForMeasuring(section);
            section.classList.remove('md-fit', 'md-overflow');
            section.style.removeProperty('--fit');
            // Content height = the lowest bottom edge among the slide's own
            // elements (plus its bottom padding), in slide coordinates. Not
            // scrollHeight: layouts draw bleeding decorations (bands, margin
            // columns) as pseudo-elements that extend far past the slide.
            const over = function () {
                const sr = section.getBoundingClientRect();
                const scale = section.offsetWidth ? sr.width / section.offsetWidth : 1;
                let bottom = 0;
                for (const c of section.children) {
                    if (c.tagName === 'ASIDE') continue;
                    const r = c.getBoundingClientRect();
                    if (r.height) bottom = Math.max(bottom, r.bottom);
                }
                const pad = parseFloat(getComputedStyle(section).paddingBottom) || 0;
                return ((bottom - sr.top) / scale + pad) > H + 2;
            };
            if (over()) {
                let fit = 1;
                section.classList.add('md-fit');
                while (fit - STEP >= FLOOR - 1e-6 && over()) {
                    fit = Math.round((fit - STEP) * 100) / 100;
                    section.style.setProperty('--fit', fit);
                }
                if (over()) {
                    section.classList.add('md-overflow');
                    const h = section.querySelector('h1, h2, h3');
                    const theme = (document.getElementById('theme') || {}).href || '';
                    const key = theme + '|' + (h ? h.textContent : '');
                    if (!autofitWarned[key]) autofitWarned[key] = true; else return restore();
                    console.warn('[autofit] still overflows at ' + Math.round(FLOOR * 100) +
                        '%: "' + (h ? h.textContent.trim() : '(untitled slide)') +
                        '" — consider splitting it or @slide smaller');
                }
            }
            restore();
        });
    }
    const autofitWarned = {};


    /* A source line after a table sits flush with the table's right edge
       rather than the text column's */
    function alignSources() {
        document.querySelectorAll('.reveal .slides section .md-source').forEach(function (src) {
            src.style.removeProperty('max-width');
            const prev = src.previousElementSibling;
            if (!prev) return;
            const table = prev.matches('table') ? prev : prev.querySelector(':scope > table');
            if (!table) return;
            const section = src.closest('section');
            const restore = unhideForMeasuring(src);
            const sr = section.getBoundingClientRect();
            const scale = section.offsetWidth ? sr.width / section.offsetWidth : 1;
            const fit = parseFloat(getComputedStyle(section).getPropertyValue('--fit')) || 1;
            const right = (table.getBoundingClientRect().right - src.getBoundingClientRect().left) / scale / fit;
            if (right > 0) src.style.maxWidth = right + 'px';
            restore();
        });
    }
    window.alignSources = alignSources;

    /* A @note belongs to the text just before it. When that text is
       revealed step by step (animated list items), the note joins the
       same step as the last item before it instead of showing from the
       start. Runs once after Reveal.initialize (fragment indices exist by
       then); Reveal.sync() makes reveal take the new fragments on board. */
    function syncNoteFragments() {
        let changed = false;
        document.querySelectorAll('.reveal .slides section .md-note').forEach(function (note) {
            if (note.classList.contains('fragment')) return;
            let prev = note.previousElementSibling;
            while (prev && !prev.querySelector('.fragment') && !prev.classList.contains('fragment')) {
                prev = prev.previousElementSibling;
            }
            if (!prev) return;
            const frags = prev.classList.contains('fragment') ? [prev] : prev.querySelectorAll('.fragment');
            const last = frags[frags.length - 1];
            const idx = last && last.getAttribute('data-fragment-index');
            if (idx === null || idx === undefined) return;
            note.classList.add('fragment');
            note.setAttribute('data-fragment-index', idx);
            changed = true;
        });
        if (changed && window.Reveal && Reveal.sync) {
            const i = Reveal.getIndices();
            Reveal.sync();
            Reveal.slide(i.h, i.v, i.f);
        }
    }
    window.syncNoteFragments = syncNoteFragments;

    /* Headings in a narrow column (the Spine layout's band, which sets
       --L-fit-heading: 1 on them) shrink until their longest word fits
       the column and the heading stays under half the slide's height.
       (Safari and Chrome both declined to hyphenate a capitalised heading
       word, so shrinking is the automatic fix; &shy; in the heading marks
       a break by hand.) */
    function fitColumnHeadings() {
        document.querySelectorAll('.reveal .slides section h2').forEach(function (h) {
            h.style.removeProperty('font-size');
            if (getComputedStyle(h).getPropertyValue('--L-fit-heading').trim() !== '1') return;
            const restore = unhideForMeasuring(h);
            const base = parseFloat(getComputedStyle(h).fontSize);
            const tooBig = function () { return h.scrollWidth > h.clientWidth + 1 || h.offsetHeight > 520; };
            let scale = 1;
            while (scale > 0.55 && tooBig()) {
                scale -= 0.05;
                h.style.fontSize = (base * scale).toFixed(1) + 'px';
            }
            restore();
        });
    }
    window.fitColumnHeadings = fitColumnHeadings;


    window.autofitTextSlides = autofitTextSlides;

    /* Local preview: an icon name with no glyph in the self-hosted subset
       (base.css lists the codepoint pairs) draws nothing, so say so */
    function checkInlineIcons() {
        if (!window.MGA_LOCAL_PREVIEW) return;
        const seen = {};
        document.querySelectorAll('.reveal .slides .md-icon').forEach(function (i) {
            const content = getComputedStyle(i, '::before').content;
            const n = (/\bfa-([\w-]+)/.exec(i.className) || [])[1];
            if ((!content || content === 'none' || content === 'normal') && !seen[n]) {
                seen[n] = true;
                console.warn('[marks] :fa-' + n + ': is not in the self-hosted icon set; add its codepoint pair to base.css');
            }
        });
    }
    window.checkInlineIcons = checkInlineIcons;

    /* Export (?fragments=false, as CI's DeckTape run uses) shows each
       slide's final state; the click marks keep their starting state
       visible there ({--x--} struck through, {++x++} in the accent) */
    if (/[?&]fragments=false\b/.test(location.search)) {
        document.documentElement.classList.add('mga-final');
    }

    window.MGA_DIRECTIVES = {
        register: registerDirective,
        registry: REGISTRY,
        parseLine: parseDirectiveLine,
        palette: PALETTE_NAMES,
        resolveColour: resolveColour,
        colourValue: colourValue,
        inlineMarks: inlineMarks
    };

    window.expandDirectives = expandDirectives;
    window.expandMarkdownSections = expandMarkdownSections;
    window.positionZoomImages = positionZoomImages;
})();
