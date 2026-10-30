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

        // ## Heading | subtitle: the bar starts a smaller second line
        // (a literal bar is written \|, held back above)
        s = s.replace(/^( {0,3}#{1,6}[ \t]+)([^|]*?\S)[ \t]*\|[ \t]*(\S.*)$/, function (m, hashes, head, sub) {
            return hashes + head + ' ' + tag('<span class="md-head-sub">') + sub + tag('</span>');
        });

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
        if (!/[\^%=\[{:|]/.test(md)) return md;
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
    /* @slide flags (SPEC 6.1). Flags combine freely; classes from several
       directives on one slide are merged by mergeSlideComments.
         smaller smallest centred plain contrast spare   (layout, existing)
         fade cut              transition into this slide
         hidden                kept in the source, skipped in show and PDF
         nohandout             shown, but left out of the student version
         static                nothing builds unless marked
         build, build=auto     lists build even in a listBuild:false deck;
                               auto runs the slide's builds without clicks
         statement             one large centred sentence or quotation
         activity              room activity: lighter ground, accent bar
         text=N placeholder textbox   corporate decks (phase 4) */
    const SLIDE_FLAGS = ['smaller', 'smallest', 'centred', 'centered', 'plain', 'contrast', 'spare',
        'fade', 'cut', 'hidden', 'nohandout', 'static', 'build', 'statement', 'activity',
        'placeholder', 'textbox'];
    function emitSlideMods(opts, srcLine, lineNo, name) {
        const classMap = { smaller: 'md-smaller', smallest: 'md-smallest', spare: 'md-spare',
            centred: 'md-centred', centered: 'md-centred',
            plain: 'md-plain', contrast: 'md-contrast',
            hidden: 'md-hidden', nohandout: 'md-nohandout', static: 'md-static', build: 'md-build',
            statement: 'md-statement', activity: 'md-activity',
            placeholder: 'md-corp-placeholder', textbox: 'md-corp-textbox' };
        const err = function (m) { return { md: errorSlide(name, lineNo, srcLine, m), isError: true }; };
        const classes = [];
        let transition = null;
        for (const f of opts._flags) {
            if (SLIDE_FLAGS.indexOf(f) === -1) {
                return err('Unknown @slide flag `' + esc(f) + '`. Available: ' + SLIDE_FLAGS.filter(function (x) { return x !== 'centered'; }).join(', ') +
                    ' (plus bg=&lt;colour&gt;, build=auto, text=N).');
            }
            if (f === 'fade' || f === 'cut') {
                if (transition) return err('`fade` and `cut` cannot both be set: a slide has one transition.');
                transition = f === 'fade' ? 'fade' : 'none';
                continue;
            }
            if (classes.indexOf(classMap[f]) === -1) classes.push(classMap[f]);
        }
        for (const k of Object.keys(opts)) {
            if (k.charAt(0) === '_') continue;
            if (['bg', 'id', 'build', 'text'].indexOf(k) === -1) {
                return err('Unknown @slide option `' + esc(k) + '`. Valid: bg=, id=, build=auto, text=N.');
            }
        }
        if (opts.build !== undefined) {
            if (opts.build !== 'auto') return err('`build=' + esc(opts.build) + '`: the only build order for a slide is build=auto (or a bare build).');
            if (classes.indexOf('md-build') === -1) classes.push('md-build');
            classes.push('md-build-auto');
        }
        if (opts.text !== undefined && !/^\d+(\.\d+)?$/.test(opts.text)) {
            return err('`text=` takes a size in points, e.g. text=24.');
        }
        if (classes.indexOf('md-static') !== -1 && classes.indexOf('md-build') !== -1) {
            return err('`static` and `build` contradict each other: choose one.');
        }
        if (opts.bg && !/^[#\w][\w#(),.%\- ]*$/.test(opts.bg)) {
            return err('bg= does not look like a CSS colour.');
        }
        if (!classes.length && !opts.bg && !transition && opts.text === undefined) {
            return err('@slide needs at least one flag (' + SLIDE_FLAGS.filter(function (x) { return x !== 'centered'; }).join(', ') + ') or bg=&lt;colour&gt;.');
        }
        let attrs = '';
        if (classes.length) attrs += ' class="' + classes.join(' ') + '"';
        if (classes.indexOf('md-spare') !== -1) attrs += ' data-visibility="uncounted"';
        if (classes.indexOf('md-hidden') !== -1) attrs += ' data-visibility="hidden"';
        if (transition) attrs += ' data-transition="' + transition + '"';
        if (opts.text !== undefined) attrs += ' data-corp-text="' + esc(opts.text) + '"';
        if (opts.bg) attrs += ' data-background-color="' + esc(opts.bg) + '"';
        if (opts.id) attrs += ' id="' + esc(opts.id) + '"';
        return { md: '<!-- .slide:' + attrs + ' -->', isError: false };
    }

    /* "series": "English Words | history, meaning, and structure": the
       name in small caps, after | a smaller second line */
    function seriesHtml(series, cls) {
        const sp = String(series).split('|');
        return '<div class="md-series ' + cls + '"><span class="md-series-name">' + esc(sp[0].trim()) + '</span>' +
            (sp.length > 1 ? '<span class="md-series-sub">' + esc(sp.slice(1).join('|').trim()) + '</span>' : '') + '</div>';
    }
    window.mgaSeriesHtml = seriesHtml;

    /* @section Some Part Title — a styled divider slide */
    function emitSection(text, srcLine, lineNo, name) {
        if (!text) {
            return { md: errorSlide(name, lineNo, srcLine,
                '@section needs the section title on the same line, e.g. `@section Part Two: The Corpus`.'), isError: true };
        }
        // the deck's series line (meta.json "series"), as on the title slide
        const series = window.MGA_META && window.MGA_META.series;
        return { md: '<!-- .slide: class="md-section" -->\n' +
            (series ? seriesHtml(series, 'md-section-series') + '\n\n' : '') +
            '# ' + text, isError: false };
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
        const keys = (spec.keys || []).concat(spec.body !== 'line' ? ['name'] : []);
        const flags = spec.flags || [];
        const buildModes = spec.build || [];
        const allowsBuild = spec.body !== 'line' || spec.build;
        if (spec.text) {
            const padded = ' ' + rest + ' ';
            const k = padded.lastIndexOf(' :: ');
            d.text = (k === -1 ? rest : padded.slice(0, k)).trim();
            optStr = k === -1 ? '' : padded.slice(k + 4).trim();
            // A ' :: ' that is not followed by options alone belongs to
            // the text (a gloss such as "brunch :: breakfast + lunch")
            const looksLikeOptions = optStr && optStr.split(/\s+/).every(function (t) {
                const kv = /^([\w-]+)=/.exec(t);
                if (kv) return keys.indexOf(kv[1]) !== -1 || (kv[1] === 'build' && allowsBuild);
                return flags.indexOf(t) !== -1 || (t === 'build' && allowsBuild);
            });
            if (k !== -1 && !looksLikeOptions && d.text) { d.text = rest.trim(); optStr = ''; }
            if (!d.text) throw new DirectiveError('needs its text on the same line, before any ` :: ` options.');
        }
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
                expand: function (bodyLines) { return expandChunk(bodyLines.join('\n'), deck, lineNo).md; },
                state: deck
            };
            const md = spec.emit(d, api);
            return { md: md, isError: false, next: next, furniture: furniture };
        } catch (e) {
            if (!(e instanceof DirectiveError)) throw e;
            return fail(e, next);
        }
    }

    /* ---------- one-line directives built on the shared parser ---------- */

    /* @note text [:: top build] — a sidenote. top places it straight after
       the slide's heading (placeSlideNotes, at runtime); build gives it a
       click of its own instead of joining the list item before it. */
    registerDirective('note', {
        body: 'line', text: true, flags: ['top'], build: [],
        emit: function (d) {
            const cls = 'md-note' + (d.flags.indexOf('top') !== -1 ? ' md-note-top' : '') + (d.build ? ' fragment' : '');
            return '\n<div class="' + cls + '">\n\n' + d.text + '\n\n</div>\n';
        }
    });

    /* @source text — a small, upright, subtle, right-aligned line at the
       foot of what it follows (replaces <p class="md-source">, which still
       works). Markdown inside is rendered (*Book Title*). */
    registerDirective('source', {
        body: 'line', text: true,
        emit: function (d) { return '\n<div class="md-source">\n\n' + d.text + '\n\n</div>\n'; }
    });

    /* @pause — everything after it, up to the next @pause or the end of
       the slide, appears on one click as one piece (applyBuilds) */
    registerDirective('pause', {
        body: 'line',
        emit: function (d, api) {
            if (d.positional.length) api.fail('takes nothing after it: everything below it on the slide is what appears.');
            return '\n<div class="md-pause" aria-hidden="true"></div>\n';
        }
    });

    /* ---------- text blocks (SPEC 4, phase 2a) ----------

       Shared helpers. A cell whose text is markdown is written as
       <tag>, blank line, text, blank line, </tag>, so marked renders the
       text inside (a paragraph, styled flush); inline marks need nothing
       special because the inline pass runs over the whole slide later. */

    function cell(tag, cls, text, attrs) {
        return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (attrs || '') + '>\n\n' +
            String(text).trim() + '\n\n</' + tag + '>\n';
    }

    /* Relative luminance of #RRGGBB, for choosing ink on a fill */
    function hexLuminance(hex) {
        const c = [1, 3, 5].map(function (i) {
            const v = parseInt(hex.substr(i, 2), 16) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }

    /* A colour value from colourValue() as a fill: class or inline style,
       with the ink chosen for contrast (white on strong colours, dark on
       light ones; for #hex, whichever reads better) */
    function fillOf(c) {
        if (!c) return { cls: '', style: '' };
        if (c.name) return { cls: ' md-bg-' + c.name, style: '' };
        const white = 1.05 / (hexLuminance(c.hex) + 0.05);
        return { cls: ' md-bg-hex', style: '--tag-bg:' + c.hex + ';--tag-ink:' + (white >= 4.5 ? '#FFFFFF' : 'var(--p-ink)') + ';' };
    }

    /* @cards and @columns (SPEC 4.1): one parser, two names. A line that
       is `::` alone (optionally followed by flags) opens the next card or
       column; content before the first such line is the first card. */
    const CARD_FLAGS = ['wide', 'build', 'accent', 'dim', 'foot', 'answer'];
    const CARD_STYLES = ['box', 'plain', 'bar', 'stat', 'strip'];

    function splitCards(body, api) {
        const cards = [];
        let cur = { flags: [], lines: [], first: true };
        body.forEach(function (l) {
            const m = /^::(?:\s+(.*))?\s*$/.exec(l);
            if (!m) { cur.lines.push(l); return; }
            if (!cur.first || cur.lines.join('').trim()) cards.push(cur);
            cur = { flags: (m[1] || '').trim().split(/\s+/).filter(Boolean), lines: [], src: l };
        });
        if (!cur.first || cur.lines.join('').trim()) cards.push(cur);
        // a card's own flags: colour, icon=, and the flag words
        cards.forEach(function (c) {
            c.opts = { colour: null, icon: null };
            c.set = {};
            c.flags.forEach(function (f) {
                const kv = /^icon=([a-z0-9-]+)$/.exec(f);
                if (kv) { c.opts.icon = kv[1]; return; }
                if (CARD_FLAGS.indexOf(f) !== -1) { c.set[f] = true; return; }
                const col = colourValue(f);
                if (col && !c.opts.colour) { c.opts.colour = col; return; }
                api.fail('unknown card flag `' + esc(f) + '` on the line `' + esc(c.src) + '`. Card flags: a colour (' +
                    PALETTE_HUES.join(', ') + ', light-…, or #RRGGBB), ' + CARD_FLAGS.join(', ') + ', icon=NAME.');
            });
        });
        return cards;
    }

    function emitCards(kind) {
        return function (d, api) {
            const style = d.opts.style || (kind === 'columns' ? 'plain' : 'box');
            if (CARD_STYLES.indexOf(style) === -1) api.fail('`style=' + esc(style) + '`: styles are ' + CARD_STYLES.join(', ') + '.');
            const height = d.opts.height || 'auto';
            if (['fill', 'auto'].indexOf(height) === -1) api.fail('`height=` is fill or auto.');
            const hasBreaks = d.body.some(function (l) { return /^::(\s|$)/.test(l); });

            // @columns with no `::` lines: the content flows into CSS columns
            if (kind === 'columns' && !hasBreaks) {
                if (d.opts.widths || d.flags.length || d.build) api.fail('flowing columns (no `::` lines) take only cols=N.');
                const n = d.opts.cols || 2;
                return '\n<div class="md-flow" style="--cols:' + n + '">\n\n' + api.expand(d.body).trim() + '\n\n</div>\n';
            }

            const cards = splitCards(d.body, api);
            if (!cards.length) api.fail('has no content.');
            if (style === 'strip' && cards.length !== 2) {
                api.fail('style=strip takes two cards: the tokens (`A3, B2, C1`) first, then the text, separated by a `::` line.');
            }
            const widths = d.opts.widths;
            if (widths && widths.length !== Math.min(cards.length, d.opts.cols || cards.length)) {
                api.fail('`widths=` has ' + widths.length + ' values for ' + Math.min(cards.length, d.opts.cols || cards.length) + ' columns.');
            }
            const n = d.opts.cols || (d.flags.indexOf('stack') !== -1 ? 1 : Math.min(cards.length, 4));
            const cls = ['md-cards', 'md-style-' + style, 'md-height-' + height, 'md-ncols-' + n];
            if (d.flags.indexOf('arrows') !== -1) cls.push('md-arrows');
            if (d.flags.indexOf('stack') !== -1) cls.push('md-stack');
            let style_ = '--cols:' + n + ';';
            if (widths) style_ += 'grid-template-columns:' + widths.map(function (w) { return w + 'fr'; }).join(' ') + ';';
            else if (style === 'strip') style_ += 'grid-template-columns:auto 1fr;';
            ['h', 'text', 'head', 'radius'].forEach(function (k) {
                if (d.opts[k] !== undefined) style_ += '--cards-' + k + ':' + d.opts[k] + 'px;';
            });
            let html = '\n<div class="' + cls.join(' ') + '" style="' + style_ + '"' + (d.build ? ' data-md-steps' : '') + '>\n';
            cards.forEach(function (c, i) {
                const f = fillOf(c.opts.colour);
                const cc = ['md-card'];
                if (c.opts.colour) cc.push('md-card-filled');
                Object.keys(c.set).forEach(function (k) { if (k !== 'build') cc.push('md-card-' + k); });
                const whole = d.build || c.set.build || c.set.answer;
                if (whole) cc.push('fragment');
                if (c.set.answer) cc.push('md-answer');
                let attrs = ' style="' + f.style + '--i:' + i + ';--n:' + cards.length + '"';
                if (whole) attrs += ' data-md-whole' + (d.build ? ' data-md-step="' + i + '"' : '');
                let lines = c.lines.slice();
                // first line a tag alone ([[AFTER]]{purple}): a pill at the top left
                let tag = '';
                const firstReal = lines.findIndex(function (l) { return l.trim(); });
                if (firstReal !== -1 && /^\s*\[\[[^\]]+\]\]\{[\w-]+\}\s*$/.test(lines[firstReal])) {
                    tag = '<div class="md-card-tag">\n\n' + lines[firstReal].trim() + '\n\n</div>\n';
                    lines.splice(firstReal, 1);
                }
                let inner;
                if (style === 'strip' && i === 0) {
                    const tokens = lines.join(' ').trim().split(/\s*,\s*/).filter(Boolean);
                    if (!tokens.length) api.fail('the strip card needs its tokens on one line, separated by `, `.');
                    inner = tokens.map(function (t) { return cell('div', 'md-strip-token', t); }).join('');
                    cc.push('md-strip');
                } else {
                    inner = api.expand(lines).trim() + '\n';
                }
                const icon = c.opts.icon ? '<i class="fad fa-' + c.opts.icon + ' md-icon md-card-icon" aria-hidden="true"></i>\n' : '';
                html += '<div class="' + cc.join(' ') + f.cls + '"' + attrs + '>\n' + tag + icon + '\n' + inner + '\n</div>\n';
            });
            return html + '</div>\n';
        };
    }
    const CARDS_SPEC = {
        keys: ['cols', 'widths', 'style', 'height', 'h', 'text', 'head', 'radius'],
        lists: ['widths'], numbers: ['cols', 'widths', 'h', 'text', 'head', 'radius'],
        flags: ['arrows', 'stack']
    };
    registerDirective('cards', Object.assign({ body: 'markdown', emit: emitCards('cards') }, CARDS_SPEC));
    registerDirective('columns', Object.assign({ body: 'markdown', emit: emitCards('columns') }, CARDS_SPEC));

    /* @terms (SPEC 4.2): term :: gloss, a two-column definition list.
       build: one row per click; build=columns: every term one per click,
       then every gloss one per click (English Words 4, slides 26 to 29);
       answers: the glosses are answers, one click when presenting (each
       in its turn with a build) and hidden in the student version. */
    registerDirective('terms', {
        body: 'items', flags: ['sc', 'answers'], build: ['columns'],
        emit: function (d, api) {
            const rows = d.items;
            const answers = d.flags.indexOf('answers') !== -1;
            const stepped = d.build || answers;
            let html = '\n<dl class="md-terms' + (d.flags.indexOf('sc') !== -1 ? ' md-terms-sc' : '') + '"' + (stepped ? ' data-md-steps' : '') + '>\n';
            rows.forEach(function (it, i) {
                if (it.fields.length > 2) api.fail('one ` :: ` per line: term :: gloss.', it);
                const term = it.fields[0], gloss = it.fields.length > 1 ? it.fields[1] : '';
                let tStep = null, gStep = null;
                if (d.build === 'columns') { tStep = i; gStep = rows.length + i; }
                else if (d.build) { tStep = i; gStep = i; }
                else if (answers) { gStep = 0; }
                const st = function (k) { return k === null ? '' : ' data-md-step="' + k + '"'; };
                html += cell('dt', 'md-term' + (tStep !== null ? ' fragment' : ''), term, st(tStep));
                html += cell('dd', 'md-gloss' + (gStep !== null ? ' fragment' : '') + (answers ? ' md-answer' : ''), gloss || '&nbsp;', st(gStep));
            });
            return html + '</dl>\n';
        }
    });

    /* @stats (SPEC 4.3): number :: label :: note, drawn as stat cards.
       A note written as a tag ([[note]]{green}) is a pill. */
    registerDirective('stats', {
        body: 'items',
        emit: function (d, api) {
            let html = '\n<div class="md-cards md-style-stat md-stats md-height-auto md-ncols-' + Math.min(d.items.length, 4) + '" style="--cols:' + Math.min(d.items.length, 4) + '"' + (d.build ? ' data-md-steps' : '') + '>\n';
            d.items.forEach(function (it, i) {
                if (it.fields.length < 2 || it.fields.length > 3 || !it.fields[0]) api.fail('each line is number :: label, with an optional third field for a note.', it);
                html += '<div class="md-card' + (d.build ? ' fragment" data-md-whole data-md-step="' + i + '"' : '"') + '>\n' +
                    cell('div', 'md-stat-num', it.fields[0]) + cell('div', 'md-stat-label', it.fields[1]) +
                    (it.fields[2] ? cell('div', 'md-stat-note', it.fields[2]) : '') + '</div>\n';
            });
            return html + '</div>\n';
        }
    });

    /* Inline markdown for cells that sit inside raw HTML (where marked
       does not look): **bold**, *italic*, `code`; a backslash escape
       becomes a character entity, so the inline pass leaves it alone too
       (\[A ...] stays a literal bracket). */
    function inlineHtml(text) {
        return String(text)
            .replace(/\\([!-\/:-@\[-`{-~])/g, function (m, ch) { return '&#' + ch.charCodeAt(0) + ';'; })
            .replace(/`([^`]+)`/g, function (m, x) { return '<code>' + esc(x) + '</code>'; })
            .replace(/\*\*(\S(?:.*?\S)?)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^\w*])\*(\S(?:[^*]*?\S)?)\*(?![\w*])/g, '$1<em>$2</em>')
            .replace(/(^|[^\w_])_(\S(?:[^_]*?\S)?)_(?![\w_])/g, '$1<em>$2</em>');
    }

    /* @ex (SPEC 4.4): numbered linguistic examples, (1), (2) ... through
       the deck. A judgement mark (* ? ?? #) glued to the first word hangs
       in the margin (a list marker has a space after it, so the two never
       collide; \* is a literal star, and *word* at the start is italic).
       (b) at the start sets the label by hand and does not advance the
       count. The second field is a gloss, or a right-aligned tag when it
       is wholly in parentheses: (N). numbers=off, start=N, build. A
       repeated named block keeps its first numbers. */
    registerDirective('ex', {
        body: 'items', keys: ['numbers', 'start'], numbers: ['start'],
        emit: function (d, api) {
            const st = api.state;
            if (d.opts.numbers !== undefined && d.opts.numbers !== 'off') api.fail('`numbers=` takes only off.');
            const off = d.opts.numbers === 'off';
            st.exNext = st.exNext || 1;
            st.exNumbers = st.exNumbers || {};
            if (d.opts.start !== undefined && !d.named) st.exNext = Math.round(d.opts.start);
            const reuse = d.named && st.exNumbers[d.named];
            const nums = [];
            let html = '\n<div class="md-ex' + (off ? ' md-ex-nonum' : '') + '"' + (d.build ? ' data-md-steps' : '') + '>\n';
            d.items.forEach(function (it, i) {
                if (it.fields.length > 2) api.fail('one ` :: ` per line: example :: gloss.', it);
                let text = it.fields[0], label = null, judge = '';
                const lm = /^\(([\w'.]{1,5})\)\s+(.*)$/.exec(text);
                if (lm) { label = '(' + lm[1] + ')'; text = lm[2]; }
                const italicFirst = /^\*[^\s*][^*]*\*(\s|$)/.test(text);
                const jm = !italicFirst && /^(\?\?|\*|\?|#)(?=\S)(.*)$/.exec(text);
                if (jm) { judge = jm[1]; text = jm[2]; }
                if (!text) api.fail('an example needs its text.', it);
                if (!label && !off) {
                    const n = reuse ? reuse[nums.length] : st.exNext++;
                    nums.push(n);
                    label = '(' + n + ')';
                }
                const gloss = it.fields[1] || '';
                const tag = /^\(.*\)$/.test(gloss);
                const step = d.build ? ' fragment" data-md-whole data-md-step="' + i + '"' : '"';
                html += '<div class="md-ex-row' + step + '>\n' +
                    '<span class="md-ex-num">' + (label || '') + '</span>' +
                    '<span class="md-ex-judge">' + esc(judge) + '</span>\n' +
                    cell('div', 'md-ex-text', text) +
                    (gloss ? cell('div', tag ? 'md-ex-tag' : 'md-ex-gloss', gloss) : '<div class="md-ex-gloss"></div>\n') +
                    '</div>\n';
            });
            if (d.named && !reuse) st.exNumbers[d.named] = nums;
            return html + '</div>\n';
        }
    });

    /* @table (SPEC 4.17): applies to the next markdown table.
       head=COLOUR band rowhead caps small widths=16,28,28,28 */
    registerDirective('table', {
        body: 'prefix', keys: ['head', 'widths'], colours: ['head'], lists: ['widths'], numbers: ['widths'],
        flags: ['band', 'rowhead', 'caps', 'small'],
        emit: function (d, api) {
            if (!/^\s*\|/.test(d.block[0] || '')) api.fail('applies to a markdown table, and the next block is not one (it should start with |).');
            const cls = ['md-table'];
            let style = '';
            if (d.opts.head) {
                const f = fillOf(d.opts.head);
                cls.push('md-table-head' + f.cls);
                style += f.style;
            }
            d.flags.forEach(function (f) { cls.push('md-table-' + f); });
            if (d.opts.widths) {
                const total = d.opts.widths.reduce(function (a, b) { return a + b; }, 0);
                d.opts.widths.forEach(function (w, i) { style += '--w' + (i + 1) + ':' + (100 * w / total).toFixed(3) + '%;'; });
                cls.push('md-table-widths');
            }
            return '\n<div class="' + cls.join(' ') + '"' + (style ? ' style="' + style + '"' : '') + '>\n\n' + d.block.join('\n') + '\n\n</div>\n';
        }
    });

    /* @kwic (SPEC 4.9): concordance lines, left | node | right, aligned
       on the node with the edges faded. prose: running lines cut at both
       edges, node bold; build: a line per click; build=context: the node
       column first, the contexts on one click; window=N: N words either
       side, under position numbers -N ... +N. Collocates: ==x== or, on a
       click, {==x==}. */
    function kwicSplit(text) {
        // split on unescaped |
        const parts = [];
        let cur = '';
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\\' && text[i + 1] === '|') { cur += '\\|'; i++; continue; }
            if (text[i] === '|') { parts.push(cur.trim()); cur = ''; continue; }
            cur += text[i];
        }
        parts.push(cur.trim());
        return parts;
    }
    registerDirective('kwic', {
        body: 'items', keys: ['window'], numbers: ['window'], flags: ['prose'], build: ['context'],
        emit: function (d, api) {
            const win = d.opts.window ? Math.round(d.opts.window) : 0;
            if (d.opts.window !== undefined && (win < 1 || win > 8)) api.fail('`window=` takes 1 to 8.');
            const prose = d.flags.indexOf('prose') !== -1;
            const cls = 'md-kwic' + (prose ? ' md-kwic-prose' : '') + (win ? ' md-kwic-window' : '');
            const ctx = d.build === 'context';
            const stepped = !!d.build;
            let html = '\n<div class="' + cls + '"' + (win ? ' style="--win:' + win + '"' : '') + (stepped ? ' data-md-steps' : '') + '>\n';
            const c = function (side, text, i) {
                const frag = ctx && side !== 'node' ? ' fragment" data-md-step="1' : '';
                return '<div class="md-kwic-' + side + frag + '"><span>' + inlineHtml(text) + '</span></div>';
            };
            if (win) {
                html += '<div class="md-kwic-pos" aria-hidden="true">';
                for (let k = -win; k <= win; k++) html += '<span>' + (k === 0 ? '' : (k > 0 ? '+' + k : '−' + (-k))) + '</span>';
                html += '</div>\n';
            }
            d.items.forEach(function (it, i) {
                const p = kwicSplit(it.text);
                if (p.length !== 3) api.fail('each line is left context | node | right context (two bars; `\\|` for a literal bar).', it);
                const step = d.build && !ctx ? ' fragment" data-md-whole data-md-step="' + i : '';
                if (win) {
                    const left = p[0].split(/\s+/).filter(Boolean).slice(-win);
                    const right = p[2].split(/\s+/).filter(Boolean).slice(0, win);
                    while (left.length < win) left.unshift('');
                    while (right.length < win) right.push('');
                    html += '<div class="md-kwic-line md-kwic-cells' + step + '">' +
                        left.map(function (w) { return '<span class="md-kwic-w' + (ctx ? ' fragment" data-md-step="1' : '') + '">' + inlineHtml(w) + '</span>'; }).join('') +
                        '<span class="md-kwic-node">' + inlineHtml(p[1]) + '</span>' +
                        right.map(function (w) { return '<span class="md-kwic-w' + (ctx ? ' fragment" data-md-step="1' : '') + '">' + inlineHtml(w) + '</span>'; }).join('') +
                        '</div>\n';
                } else {
                    html += '<div class="md-kwic-line' + step + '">' + c('left', p[0]) + c('node', p[1]) + c('right', p[2]) + '</div>\n';
                }
            });
            return html + '</div>\n';
        }
    });

    /* @tree (SPEC 4.5): indentation is descent.
       style=diagram (default): left to right, a brace before each group
       of children; a node written as a tag ([[x]]{green}) is a pill.
       style=outline: an indented outline; `code :: label` puts a category
       code (01.04.09.07) before the label.
       build: one node per click, in reading order; build=level: a level
       per click (the roots stay); build=up: the deepest level first. */
    registerDirective('tree', {
        body: 'items', keys: ['style'], build: ['level', 'up'],
        emit: function (d, api) {
            const style = d.opts.style || 'diagram';
            if (['diagram', 'outline'].indexOf(style) === -1) api.fail('`style=` is diagram or outline.');
            // items to nodes
            const roots = [], stack = [];
            let order = 0, maxDepth = 0;
            d.items.forEach(function (it) {
                if (style === 'diagram' && it.fields.length > 1) api.fail('a diagram node is one field; ` :: ` codes belong to style=outline.', it);
                if (it.fields.length > 2) api.fail('an outline line is label, or code :: label.', it);
                if (it.depth > stack.length) api.fail('indented more than one step below the line above.', it);
                const node = { item: it, depth: it.depth, kids: [], order: order++ };
                maxDepth = Math.max(maxDepth, it.depth);
                stack.length = it.depth;
                if (it.depth === 0) roots.push(node); else stack[it.depth - 1].kids.push(node);
                stack.push(node);
            });
            const stepOf = function (n) {
                if (d.build === 'level') return n.depth === 0 ? null : n.depth - 1;
                if (d.build === 'up') return maxDepth - n.depth;
                if (d.build) return n.order;
                return null;
            };
            const frag = function (k) { return k === null ? '' : ' fragment" data-md-step="' + k; };
            let html = '\n<div class="md-tree md-tree-' + style + '"' + (d.build ? ' data-md-steps' : '') + '>\n';
            if (style === 'outline') {
                (function walk(list) {
                    list.forEach(function (n) {
                        const f = n.item.fields;
                        html += '<div class="md-to-row' + frag(stepOf(n)) + '" style="--d:' + n.depth + '">' +
                            (f.length > 1 ? '<span class="md-to-code">' + inlineHtml(f[0]) + '</span>' : '') +
                            '<span class="md-to-label">' + inlineHtml(f[f.length - 1]) + '</span></div>\n';
                        walk(n.kids);
                    });
                })(roots);
                return html + '</div>\n';
            }
            const brace = '<span class="md-brace" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
            (function walk(list) {
                html += '<div class="md-tn-list">\n';
                list.forEach(function (n) {
                    html += '<div class="md-tn">' +
                        '<div class="md-tn-label' + frag(stepOf(n)) + '">' + inlineHtml(n.item.text) + '</div>';
                    if (n.kids.length) {
                        // the brace arrives with the first child (build, level)
                        // or with the parent (build=up)
                        const bStep = d.build === 'up' ? stepOf(n) : stepOf(n.kids[0]);
                        html += '<div class="md-tn-kids"><div class="md-tn-brace' + frag(bStep) + '">' + brace + '</div>\n';
                        walk(n.kids);
                        html += '</div>';
                    }
                    html += '</div>\n';
                });
                html += '</div>\n';
            })(roots);
            return html + '</div>\n';
        }
    });

    /* @transcript (SPEC 4.12). `label: text` starts a turn (label up to
       12 characters, no spaces); a line of only (1.0) or (.) is a pause;
       any other line continues the turn. `annotation :: a: text` puts the
       annotation in a left column. A line whose text begins with // is
       indented at runtime (alignTranscripts) so its marker sits under the
       nearest unmatched // above. Inline (0.5) is set lighter.
       overlay: the panel slides up over a faded copy of the slide before
       (buildTranscriptOverlays) and leaves with a fade; consecutive
       overlay transcripts hold still and morph. morph: adjacent
       transcripts auto-animate, unchanged turns holding still.
       build: one turn per click; numbers; mono. */
    function trHash(s) {
        let h = 5381;
        for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        return h.toString(36);
    }
    registerDirective('transcript', {
        body: 'items', flags: ['overlay', 'morph', 'numbers', 'mono'],
        emit: function (d, api) {
            const turns = [];
            let lineNo = 0;
            const PAUSE = /^\((?:\d+(?:\.\d+)?|\.)\)$/;
            d.items.forEach(function (it) {
                let text = it.text, note = '';
                const nm = /^(.*?)\s::\s(.*)$/.exec(text);
                if (nm) { note = nm[1].trim(); text = nm[2].trim(); }
                const lm = /^([^\s:]{1,12}):\s+(.*)$/.exec(text);
                const line = { note: note, n: ++lineNo };
                if (PAUSE.test(text)) { line.pause = text; }
                else if (lm) { line.label = lm[1]; line.text = lm[2]; }
                else { line.text = text; }
                if (line.label || !turns.length || line.pause) turns.push({ lines: [line], label: line.label || '' });
                else turns[turns.length - 1].lines.push(line);
            });
            const overlay = d.flags.indexOf('overlay') !== -1;
            const morph = overlay || d.flags.indexOf('morph') !== -1;
            const cls = 'md-transcript' + (overlay ? ' md-tr-overlay' : '') + (d.flags.indexOf('numbers') !== -1 ? ' md-tr-numbers' : '') +
                (d.flags.indexOf('mono') !== -1 ? ' md-tr-mono' : '') + (turns.some(function (t) { return t.lines.some(function (l) { return l.note; }); }) ? ' md-tr-notes' : '');
            const fmt = function (t) {
                return inlineHtml(t)
                    .replace(/\((\d+(?:\.\d+)?|\.)\)/g, '<span class="md-tr-pause">($1)</span>')
                    .replace(/\/\//g, '<span class="md-tr-ov">//</span>');
            };
            let html = '\n<div class="' + cls + '"' + (d.build ? ' data-md-steps' : '') + (morph ? ' data-id="md-tr-panel"' : '') + '>\n';
            // with build, a pause line arrives with the turn after it
            const steps = [];
            let k = 0;
            turns.forEach(function (t, ti) { steps[ti] = t.lines[0].pause ? null : k++; });
            for (let ti = turns.length - 1, next = k - 1; ti >= 0; ti--) {
                if (steps[ti] === null) steps[ti] = Math.max(next, 0); else next = steps[ti];
            }
            turns.forEach(function (t, ti) {
                const step = d.build ? ' fragment" data-md-step="' + steps[ti] : '';
                t.lines.forEach(function (l, li) {
                    const starts = l.text && /^\/\//.test(l.text.trim());
                    const id = morph ? ' data-id="tr-' + trHash((t.label || '') + '|' + (l.pause || l.text) + '|' + li) + '"' : '';
                    html += '<div class="md-tr-line' + (l.pause ? ' md-tr-gap' : '') + (li > 0 ? ' md-tr-cont' : '') + (starts ? ' md-tr-ovstart' : '') + step + '"' + id + '>' +
                        '<span class="md-tr-num">' + l.n + '</span>' +
                        '<span class="md-tr-note">' + (l.note ? inlineHtml(l.note) : '') + '</span>' +
                        '<span class="md-tr-label">' + (li === 0 && t.label ? esc(t.label) : '') + '</span>' +
                        '<span class="md-tr-text">' + (l.pause ? '<span class="md-tr-pause">' + esc(l.pause) + '</span>' : fmt(l.text)) + '</span>' +
                        '</div>\n';
                });
            });
            // the slide: overlay transcripts change instantly (the panel
            // moves) and leave with a fade; morph slides auto-animate
            const slideAttrs = (overlay ? ' class="md-tr-overlay-slide" data-transition="none-in fade-out"' : '') +
                (morph ? ' data-auto-animate' : '');
            return (slideAttrs ? '<!-- .slide:' + slideAttrs + ' -->\n' : '') + html + '</div>\n';
        }
    });

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

    /* @include PATH — another markdown file inserted at that point before
       anything else is expanded: whole slides, or definitions. Paths are
       relative to the file that includes them; includes nest; a cycle or
       a missing file becomes an error slide. Fetched synchronously (local,
       small files) so expansion stays one pass; every included file is
       listed in window.MGA_INCLUDES for the offline cache. */
    function readTextSync(url) {
        if (window.MGA_DIRECTIVES && window.MGA_DIRECTIVES.readText) return window.MGA_DIRECTIVES.readText(url);
        const x = new XMLHttpRequest();
        x.open('GET', url, false);
        x.send(null);
        if ((x.status >= 200 && x.status < 300) || (x.status === 0 && x.responseText)) return x.responseText;
        throw new Error('HTTP ' + x.status);
    }
    function resolveIncludes(src, fileUrl, stack, state) {
        if (src.indexOf('@include') === -1) return src;
        let fence = null;
        return src.split('\n').map(function (line, i) {
            const f = /^\s*(`{3,}|~{3,})/.exec(line);
            if (fence) { if (f && f[1].charAt(0) === fence.charAt(0)) fence = null; return line; }
            if (f) { fence = f[1]; return line; }
            const m = /^@include(?:\s+(.*))?$/.exec(line);
            if (!m) return line;
            const shortName = stack.length > 1 ? fileUrl.split('/').pop() : state.name;
            const fail = function (msg) { state.hadError = true; return errorSlide(shortName, i + 1, line, '@include: ' + msg); };
            const p = (m[1] || '').trim();
            if (!p || /\s/.test(p)) return fail('needs one path after it, e.g. `@include ../shared/sets.md` (no spaces in the path).');
            let url;
            try { url = new URL(p, fileUrl).href; } catch (e) { return fail('`' + esc(p) + '` is not a usable path.'); }
            if (stack.indexOf(url) !== -1) {
                return fail('`' + esc(p) + '` includes itself (' + stack.concat(url).map(function (u) { return u.split('/').pop(); }).join(' → ') + ').');
            }
            let text;
            try { text = readTextSync(url); } catch (e) { return fail('could not read `' + esc(p) + '` (' + esc(e.message) + ').'); }
            state.includes.push(url);
            return resolveIncludes(text.replace(/\r\n/g, '\n').replace(/\n+$/, ''), url, stack.concat(url), state);
        }).join('\n');
    }

    function expandDirectives(src, meta) {
        const name = (meta && meta.name) || 'markdown';
        // @include first, so included slides and definitions expand with
        // the rest of the deck
        const inc = { name: name, includes: [], hadError: false };
        if (src.indexOf('@include') !== -1) {
            const here = (typeof location !== 'undefined' && location.href) || 'http://localhost/deck/';
            const self = new URL(name, here).href;
            src = resolveIncludes(src, self, [self], inc);
            window.MGA_INCLUDES = (window.MGA_INCLUDES || []).concat(inc.includes);
        }
        // short-circuit only when there is nothing at all to expand
        // (inline marks must expand even in directive-free decks)
        if (!/[@^%=\[{:|]/.test(src)) {
            return { markdown: src, hadError: false, warnings: [] };
        }
        // Split on reveal's separators (blank-line anchored, matching the
        // data-separator regexes ^\n---\n and ^\n--\n), keeping delimiters
        const parts = src.split(/(^\n---\n|^\n--\n)/m);
        // one deck: ids, named blocks and warnings are shared by its slides
        const deck = { name: name, allocId: makeIdAllocator(), named: {}, warnings: [] };
        let hadError = inc.hadError;
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

    /* ---------- builds (SPEC 6.2) ----------

       Runs as a reveal plugin registered straight after RevealMarkdown
       (revconfig.js), so the slides are rendered but reveal has not yet
       counted their fragments.

       1. Lists: a deck builds lists item by item when "listBuild" is true
          (the default; revconfig.js passes it to animateLists). @slide
          static removes list builds from one slide; @slide build adds them
          on a slide of a listBuild:false deck. Marked builds (click marks,
          @note build, @pause) are kept either way.
       2. @pause: the elements after each marker, up to the next marker,
          become one fragment group; lists inside appear whole.
       3. Order: on slides with groups or stepped blocks ([data-md-steps]
          holding [data-md-step="k"]), every fragment gets an explicit
          index in reading order, so a block's steps come after the list
          items before it and before those after it.
       4. @note top moves to straight after the slide's heading. */
    function ownedBy(sec) { return function (el) { return el.closest('section') === sec; }; }
    function applyBuilds() {
        const meta = window.MGA_META || {};
        const listBuild = meta.listBuild !== undefined ? meta.listBuild !== false : !meta.corporate;
        document.querySelectorAll('.reveal .slides section').forEach(function (sec) {
            if (sec.querySelector('section')) return;
            const own = ownedBy(sec);
            const lis = Array.prototype.filter.call(sec.querySelectorAll('li'), own);
            const isStatic = sec.classList.contains('md-static');
            if (isStatic || (!listBuild && !sec.classList.contains('md-build'))) {
                lis.forEach(function (li) { li.classList.remove('fragment'); });
            } else if (sec.classList.contains('md-build') && !sec.classList.contains('md-refs')) {
                lis.forEach(function (li) { li.classList.add('fragment'); });
            }

            // @note top
            Array.prototype.filter.call(sec.querySelectorAll('.md-note-top'), own).forEach(function (note) {
                const scope = note.parentElement;
                const h = scope && scope.querySelector(':scope > h1, :scope > h2, :scope > h3');
                if (h) h.after(note); else if (scope) scope.insertBefore(note, scope.firstChild);
            });

            // a block part that builds as one piece (a card, a turn, a
            // stat): lists inside it appear with it
            Array.prototype.filter.call(sec.querySelectorAll('.fragment[data-md-whole]'), own).forEach(function (w) {
                w.querySelectorAll('li.fragment').forEach(function (li) { li.classList.remove('fragment'); });
            });

            // @pause groups
            const markers = Array.prototype.filter.call(sec.querySelectorAll('.md-pause'), own);
            let group = 0;
            markers.forEach(function (m) {
                group++;
                let el = m.nextElementSibling;
                while (el && !el.classList.contains('md-pause')) {
                    if (/^(UL|OL)$/.test(el.tagName)) {
                        el.querySelectorAll('li.fragment').forEach(function (li) { li.classList.remove('fragment'); });
                    }
                    el.classList.add('fragment');
                    el.setAttribute('data-md-group', 'pause-' + group);
                    el = el.nextElementSibling;
                }
            });

            // explicit order where needed
            const stepped = Array.prototype.filter.call(sec.querySelectorAll('[data-md-step]'), own);
            if (!markers.length && !stepped.length) return;
            const frags = Array.prototype.filter.call(sec.querySelectorAll('.fragment'), own);
            const groups = {}, blocks = new Map();
            let next = 0;
            frags.forEach(function (f) {
                const g = f.getAttribute('data-md-group');
                const block = f.closest('[data-md-steps]');
                if (g) {
                    if (groups[g] === undefined) groups[g] = next++;
                    f.setAttribute('data-fragment-index', groups[g]);
                } else if (block && own(block)) {
                    if (!blocks.has(block)) {
                        const steps = Array.prototype.map.call(block.querySelectorAll('[data-md-step]'),
                            function (e) { return parseInt(e.getAttribute('data-md-step'), 10) || 0; });
                        blocks.set(block, next);
                        next += (steps.length ? Math.max.apply(null, steps) : 0) + 1;
                    }
                    f.setAttribute('data-fragment-index', blocks.get(block) + (parseInt(f.getAttribute('data-md-step'), 10) || 0));
                } else {
                    f.setAttribute('data-fragment-index', next++);
                }
            });
        });
    }

    /* @slide build=auto: on arriving at the slide, its builds run one after
       another without clicks; leaving the slide stops them */
    const AUTO_BUILD_STEP = 900;
    function wireAutoBuilds(deck) {
        let timer = null;
        function run() {
            clearTimeout(timer);
            const slide = deck.getCurrentSlide();
            if (!slide || !slide.classList.contains('md-build-auto') ||
                document.documentElement.classList.contains('mga-final')) return;
            const step = function () {
                if (deck.getCurrentSlide() !== slide) return;
                if (deck.availableFragments().next) {
                    deck.nextFragment();
                    timer = setTimeout(step, AUTO_BUILD_STEP);
                }
            };
            timer = setTimeout(step, AUTO_BUILD_STEP * 0.6);
        }
        deck.on('ready', run);
        deck.on('slidechanged', run);
    }

    /* @transcript overlay: the panel lies over a faded copy of the slide
       before it (the nearest earlier slide that is not itself an overlay
       transcript), so the explanation is not retyped. The copy is static:
       no builds, no ids. A run of overlay slides shares one copy and the
       panel slides up only on the first. */
    function buildTranscriptOverlays() {
        const leaves = Array.prototype.filter.call(document.querySelectorAll('.reveal .slides section'),
            function (s) { return !s.querySelector('section'); });
        leaves.forEach(function (sec, i) {
            if (!sec.querySelector('.md-tr-overlay')) return;
            let j = i - 1;
            while (j >= 0 && leaves[j].querySelector('.md-tr-overlay')) j--;
            if (i > 0 && leaves[i - 1].querySelector('.md-tr-overlay')) sec.classList.add('md-tr-continued');
            if (j < 0 || sec.querySelector(':scope > .md-overlay-under')) return;
            const under = document.createElement('div');
            under.className = 'md-overlay-under';
            under.setAttribute('aria-hidden', 'true');
            under.setAttribute('data-id', 'md-tr-under-' + j);
            Array.prototype.forEach.call(leaves[j].childNodes, function (n) { under.appendChild(n.cloneNode(true)); });
            under.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
            under.querySelectorAll('.fragment').forEach(function (e) { e.classList.remove('fragment'); });
            under.querySelectorAll('[data-id]').forEach(function (e) { e.removeAttribute('data-id'); });
            sec.insertBefore(under, sec.firstChild);
        });
    }

    window.MgaBuilds = {
        id: 'mga-builds',
        init: function (deck) { buildTranscriptOverlays(); applyBuilds(); wireAutoBuilds(deck); }
    };

    /* @transcript: a line whose text starts with // is indented so its
       marker sits under the nearest unmatched // in an earlier line of
       the same transcript. Measured after fonts load (refitSlides). */
    function alignTranscripts() {
        document.querySelectorAll('.reveal .md-transcript').forEach(function (tr) {
            const restore = unhideForMeasuring(tr);
            const lines = tr.querySelectorAll('.md-tr-line');
            lines.forEach(function (l) { const t = l.querySelector('.md-tr-text'); if (t) t.style.paddingLeft = ''; });
            const open = [];   // unmatched onset markers, in order
            lines.forEach(function (l) {
                const text = l.querySelector('.md-tr-text');
                if (!text) return;
                const marks = Array.prototype.slice.call(text.querySelectorAll('.md-tr-ov'));
                if (l.classList.contains('md-tr-ovstart') && marks.length && open.length) {
                    const target = open.pop();
                    const scale = tr.getBoundingClientRect().width / (tr.offsetWidth || 1) || 1;
                    const dx = (target.getBoundingClientRect().left - marks[0].getBoundingClientRect().left) / scale;
                    if (dx > 0) text.style.paddingLeft = dx.toFixed(1) + 'px';
                    marks.shift();
                }
                marks.forEach(function (m) { open.push(m); });
            });
            restore();
        });
    }
    window.alignTranscripts = alignTranscripts;

    /* @cards height=fill: the cards reach down to the foot of the slide */
    function fillCardHeights() {
        const H = (window.Reveal && Reveal.getConfig) ? Reveal.getConfig().height : 1080;
        document.querySelectorAll('.reveal .slides .md-cards.md-height-fill').forEach(function (box) {
            const sec = box.closest('section');
            const restore = unhideForMeasuring(box);
            box.style.minHeight = '';
            const sr = sec.getBoundingClientRect();
            const scale = sec.offsetWidth ? sr.width / sec.offsetWidth : 1;
            const top = (box.getBoundingClientRect().top - sr.top) / scale;
            const pad = parseFloat(getComputedStyle(sec).paddingBottom) || 0;
            let after = 0;
            for (let n = box.nextElementSibling; n; n = n.nextElementSibling) after += n.offsetHeight;
            const want = H - pad - top - after - 8;
            if (want > box.offsetHeight) box.style.minHeight = want.toFixed(0) + 'px';
            restore();
        });
    }
    window.fillCardHeights = fillCardHeights;

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
