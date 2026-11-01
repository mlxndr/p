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
        'image':      ['alt', 'caption', 'fit', 'focus', 'id', 'over'],
        'image-seq':  ['alt', 'caption', 'fit', 'focus', 'id'],
        'image-left': ['alt', 'caption', 'split', 'fit', 'id', 'focus'],
        'image-right':['alt', 'caption', 'split', 'fit', 'id', 'focus'],
        'compare':    ['alt', 'caption', 'id'],
        'zoom':       ['alt', 'caption', 'caption-start', 'focus', 'scale', 'to', 'id'],
        'kenburns':   ['alt', 'caption', 'pan', 'dur', 'id'],
        'slide':      ['bg', 'id'],
        'quote':      ['attrib', 'id'],
        'refs':       ['title', 'id']
    };
    const KNOWN_FLAGS = ['fragment', 'hold', 'natural', 'spare',
        'smaller', 'smallest', 'centred', 'centered', 'plain', 'contrast', 'card'];
    /* flags only some image directives take (phase 2b): over= styles and
       build on @image, bleed on the split layouts */
    const KIND_FLAGS = {
        'image': ['band', 'bubble', 'dim', 'build'],
        'image-left': ['bleed', 'build'],
        'image-right': ['bleed', 'build']
    };

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

    /* Captions take *italic* and **bold** (book titles, species names);
       everything else in them is escaped as before */
    function capHtml(text) {
        return esc(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    function captionBlock(opts) {
        return opts.caption
            ? '<figcaption class="bg-caption subtle">' + capHtml(opts.caption) + '</figcaption>\n'
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
        const flags = KNOWN_FLAGS.concat(KIND_FLAGS[kind] || []);
        for (const f of opts._flags) {
            if (flags.indexOf(f) === -1) {
                return errorSlide(name, lineNo, srcLine,
                    'Unknown flag `' + esc(f) + '`. Valid flags: ' + flags.join(', ') +
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

    function focusPosition(focus) {
        const f = String(focus || '50,50').split(',');
        return (parseFloat(f[0]) || 50) + '% ' + (parseFloat(f[1]) || 50) + '%';
    }

    function emitImage(opts, allocId, srcLine, lineNo, name, inSeq) {
        const err = validateKeys('image', opts, srcLine, lineNo, name);
        if (err) return { md: err, isError: true };
        const overFlags = ['band', 'bubble', 'dim', 'build'].filter(function (f) { return has(opts, f); });
        if (inSeq && (opts.over || overFlags.length)) {
            return { md: errorSlide(name, lineNo, srcLine, '`over=` and its styles belong to @image; an @image-seq line takes the image options only.'), isError: true };
        }
        if (!opts.over && overFlags.length) {
            return { md: errorSlide(name, lineNo, srcLine, '`' + overFlags[0] + '` goes with over=POSITION (text laid over the image), e.g. over=top-right ' + overFlags[0] + '.'), isError: true };
        }
        const fit = opts.fit === 'cover' ? 'cover' : 'contain';
        // hold: drawn as an element (not a slide background) so the next
        // slide holding the same id can move it by auto-animate
        if (has(opts, 'hold')) {
            const dataId = opts.id || 'held-image';
            const sid = allocId(slugify(opts._path));
            const alt = esc(opts.alt || (opts.caption || '').replace(/\*/g, ''));
            return { md: '<!-- .slide: data-auto-animate class="md-fill md-image-held" id="' + esc(sid) + '" -->\n' +
                (opts.alt || opts.caption ? '' : altBlock(opts, '@image')) +
                '<div class="md-zoom-frame' + (fit === 'cover' ? ' md-image-cover' : '') + '">\n' +
                '<img data-id="' + esc(dataId) + '" data-md-fit src="' + esc(opts._path) + '" alt="' + alt + '"' +
                (fit === 'cover' ? ' style="object-position:' + focusPosition(opts.focus) + '"' : '') +
                ' onerror="' + IMG_ONERROR + '">\n</div>\n' +
                (opts.caption ? '<figcaption class="md-frame-caption">' + capHtml(opts.caption) + '</figcaption>\n' : '') };
        }
        const id = opts.id || allocId(slugify(opts._path));
        let attrs = 'data-background-image="' + esc(opts._path) + '" data-background-size="' + fit + '" id="' + esc(id) + '"';
        if (opts.focus && fit === 'cover') {
            const f = String(opts.focus).split(',');
            attrs += ' data-background-position="' + esc((f[0] || '50').trim()) + '% ' + esc((f[1] || '50').trim()) + '%"';
        }
        if (opts.over) attrs += ' class="md-over-slide"';
        return { md: '<!-- .slide: ' + attrs + ' -->\n' + altBlock(opts, '@image') + captionBlock(opts) };
    }

    /* @image ... over=POSITION [band|bubble|dim] [build]: the markdown that
       follows (to @end or the end of the slide) is laid over the image.
       dim lays a veil of the paper colour over the image behind the text;
       build brings text (and veil) in on a click. */
    const OVER_POSITIONS = ['top-left', 'top', 'top-right', 'left', 'centre', 'center', 'right',
        'bottom-left', 'bottom', 'bottom-right'];
    function emitOver(opts, bodyMd, srcLine, lineNo, name) {
        const pos = opts.over === 'center' ? 'centre' : opts.over;
        if (OVER_POSITIONS.indexOf(opts.over) === -1) {
            return { md: errorSlide(name, lineNo, srcLine, '`over=' + esc(opts.over) + '`: positions are ' +
                OVER_POSITIONS.filter(function (p) { return p !== 'center'; }).join(', ') + '.'), isError: true };
        }
        if (!bodyMd.trim()) {
            return { md: errorSlide(name, lineNo, srcLine, 'over= lays the markdown that follows over the image, and nothing follows (end it with @end, or the end of the slide).'), isError: true };
        }
        const styles = ['band', 'bubble', 'dim'].filter(function (f) { return has(opts, f); });
        if (styles.length > 1 && !(styles.length === 2 && styles.indexOf('dim') !== -1)) {
            return { md: errorSlide(name, lineNo, srcLine, '`band` and `bubble` are two ways of setting the text: choose one (dim can go with either).'), isError: true };
        }
        const cls = ['md-over', 'md-over-' + pos].concat(styles.map(function (s) { return 'md-over-' + s; }));
        if (!styles.length || (styles.length === 1 && styles[0] === 'dim')) cls.push('md-over-panel');
        const build = has(opts, 'build');
        if (build) cls.push('fragment');
        return { md: '\n<div class="' + cls.join(' ') + '"' + (build ? ' data-md-whole' : '') + '>\n' +
            (has(opts, 'dim') ? '<div class="md-over-veil"></div>\n' : '') +
            '<div class="md-over-text">\n\n' + bodyMd.trim() + '\n\n</div>\n</div>\n', isError: false };
    }

    /* @video PATH poster=IMAGE alt="..." [split=N] [caption="..."]
       [autoplay] [loop] [muted]  (SPEC 4.13)
       A click plays the video once and it stops on its last frame (a
       hidden fragment cues it: wireVideos); autoplay starts it when the
       slide arrives instead. Markdown after the directive becomes a side
       column, as with @image-left. The poster is what the PDF shows. */
    const VIDEO_KEYS = ['alt', 'caption', 'poster', 'split', 'id'];
    const VIDEO_FLAGS = ['autoplay', 'loop', 'muted'];
    function emitVideo(opts, bodyLines, deck, srcLine, lineNo, name) {
        const fail = function (m) { return { md: errorSlide(name, lineNo, srcLine, '@video: ' + m), isError: true }; };
        for (const k of Object.keys(opts)) {
            if (k.charAt(0) === '_') continue;
            if (VIDEO_KEYS.indexOf(k) === -1) return fail('Unknown option `' + esc(k) + '`. Valid: ' + VIDEO_KEYS.join(', ') + '; flags: ' + VIDEO_FLAGS.join(', ') + '.');
        }
        for (const f of opts._flags) {
            if (VIDEO_FLAGS.indexOf(f) === -1) return fail('Unknown flag `' + esc(f) + '`. Valid flags: ' + VIDEO_FLAGS.join(', ') + '. (Values with spaces need quotes: alt="like this".)');
        }
        if (!opts._path) return fail('needs the video file first, e.g. `@video ./media/clip.mp4 poster=./img/clip.png alt="..."`.');
        if (!/\.(mp4|m4v|webm|mov)$/i.test(opts._path)) return fail('`' + esc(opts._path) + '` is not a video file (.mp4, .m4v, .webm or .mov).');
        const split = opts.split ? parseFloat(opts.split) : null;
        if (opts.split && (isNaN(split) || split <= 0 || split >= 100)) return fail('`split=` is a percentage between 1 and 99, e.g. split=66.');
        const sid = opts.id || deck.allocId(slugify(opts._path));
        const vid = 'mv-' + sid;
        const auto = has(opts, 'autoplay');
        const video = '<video class="md-video" data-md-video="' + esc(vid) + '" src="' + esc(opts._path) + '"' +
            (opts.poster ? ' poster="' + esc(opts.poster) + '"' : '') +
            ' preload="metadata" playsinline' + (has(opts, 'muted') ? ' muted' : '') + (has(opts, 'loop') ? ' loop' : '') +
            (auto ? ' data-autoplay' : '') +
            ' aria-label="' + esc(opts.alt || (opts.caption || '').replace(/\*/g, '')) + '"></video>\n' +
            (auto ? '' : '<span class="fragment md-video-cue" data-md-video="' + esc(vid) + '" aria-hidden="true"></span>\n');
        const caption = opts.caption ? '<figcaption class="md-frame-caption">' + capHtml(opts.caption) + '</figcaption>\n' : '';
        const alt = opts.alt || opts.caption ? '' : altBlock(opts, '@video');
        const body = bodyLines.join('\n').trim();
        let md = '<!-- .slide: class="md-fill md-video-slide" id="' + esc(sid) + '" -->\n' + alt;
        if (body) {
            const inner = expandChunk(body, deck, lineNo);
            md += '<div class="md-split md-video-split"' + (split ? ' style="--split:' + split + '%"' : '') + '>\n' +
                '<figure class="md-split-img">\n' + video + (opts.caption ? '<figcaption>' + capHtml(opts.caption) + '</figcaption>\n' : '') + '</figure>\n' +
                '<div class="md-split-body">\n\n' + inner.md.trim() + '\n\n</div>\n</div>\n';
            return { md: md, isError: inner.hadError };
        }
        md += '<div class="md-zoom-frame md-video-frame">\n' + video + '</div>\n' + caption;
        return { md: md, isError: false };
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
        const alt = esc(opts.alt || (opts.caption || '').replace(/\*/g, ''));
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
            ? '<figcaption class="md-frame-caption">' + capHtml(opts['caption-start']) + '</figcaption>\n'
            : '';
        const captionEnd = opts.caption
            ? '<figcaption class="md-frame-caption">' + capHtml(opts.caption) + '</figcaption>\n'
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
            '<img src="' + esc(opts._path) + '" alt="' + esc(opts.alt || (opts.caption || '').replace(/\*/g, '')) + '" onerror="' + IMG_ONERROR + '" style="animation-name:' + anim + ';animation-duration:' + dur + '">\n' +
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
        const bleed = has(opts, 'bleed');
        const dataId = hold ? (opts.id || 'held-image') : null;
        const id = hold ? allocId(slugify(opts._path)) : (opts.id || allocId(slugify(opts._path)));
        const slideAttrs = 'class="md-fill' + (bleed ? ' md-bleed-slide' : '') + '" id="' + esc(id) + '"' + (hold ? ' data-auto-animate' : '');
        // build is the new name for fragment (SPEC 6.2); both work
        const imgAttrs =
            (has(opts, 'fragment') || has(opts, 'build') ? 'class="fragment" ' : '') +
            (dataId ? 'data-id="' + esc(dataId) + '" ' : '') +
            (bleed || opts.focus ? 'style="object-position:' + focusPosition(opts.focus) + '" ' : '') +
            'src="' + esc(opts._path) + '" alt="' + esc(opts.alt || (opts.caption || '').replace(/\*/g, '')) + '" onerror="' + IMG_ONERROR + '"';
        let md =
            '<!-- .slide: ' + slideAttrs + ' -->\n' +
            (opts.alt || opts.caption ? '' : altBlock(opts, '@' + kind)) +
            '<div class="md-split' + side + (bleed ? ' md-bleed' : '') + '"' + (split ? ' style="--split:' + split + '%"' : '') + '>\n' +
            '<figure class="md-split-img">\n' +
            '<img ' + imgAttrs + '>\n' +
            (opts.caption ? '<figcaption>' + capHtml(opts.caption) + '</figcaption>\n' : '') +
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
            const r = emitImage(opts, allocId, item, lineNo, name, true);
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
        .concat(PALETTE_HUES.map(function (h) { return h + '-deep'; }))
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
    /* the colour cycle for morpheme pieces: each new piece in a deck takes
       the next colour, and keeps it wherever it appears again */
    const MORPHEME_COLOURS = ['red', 'green', 'teal', 'navy', 'orange', 'purple', 'gold', 'blue', 'pink'];
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

        // ## [[Orthographic]] alone: the ribbon heading (a tag from a set,
        // or [[x]]{colour}): the tag takes the class md-ribbon
        const ribbon = /^ {0,3}#{1,6}[ \t]+\[\[(?:(?!\]\]).)+?\]\](?:\{[A-Za-z][\w-]*\})?[ \t]*$/.test(s);

        // ## Heading | subtitle: the bar starts a smaller second line
        // (a literal bar is written \|, held back above; a bar inside
        // [[piece|id]] is not a subtitle bar)
        if (!ribbon) {
            s = s.replace(/^( {0,3}#{1,6}[ \t]+)((?:[^|\[]|\[(?!\[)|\[\[(?:(?!\]\]).)*\]\])*?\S)[ \t]*\|[ \t]*(\S.*)$/, function (m, hashes, head, sub) {
                return hashes + head + ' ' + tag('<span class="md-head-sub">') + sub + tag('</span>');
            });
        }

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

        // 3. Pieces and tags: [[x]], [[x|id]], [[x]]{name}. A label from a
        //    @set is that set's tag (pill with its colour and icon), or
        //    coloured text for a text set; its id comes from the set, so
        //    the same tag in a menu, a stack or a heading morphs.
        s = s.replace(/\[\[((?:(?!\]\]).)+?)\]\](?:\{([A-Za-z][\w-]*)\})?/g, function (m, body, name) {
            let text = body.trim(), id = null;
            const bar = /^(.*)\|([\w-]+)$/.exec(text);
            if (bar) { text = bar[1].trim(); id = bar[2]; }
            if (!text) return m;
            const entry = ctx.tag ? ctx.tag(text) : null;
            let cls = 'md-piece', tail = '', style = '', icon = '';
            if (entry) {
                id = id || ctx.allocPiece(entry.item.id);
                const it = entry.item;
                if (entry.set.text && !name) {
                    if (it.colour && it.colour.name) cls += ' md-c md-c-' + it.colour.name;
                    else if (it.colour) style = 'color:' + it.colour.hex;
                    cls += ' md-settext';
                } else {
                    const f = fillOf(name ? colourValue(name) || it.colour : it.colour || { name: 'grey' });
                    cls += ' md-tag md-settag' + f.cls + (it.optional ? ' md-tag-optional' : '');
                    style = f.style;
                    if (it.icon) icon = tag('<i class="fad fa-' + it.icon + ' md-icon md-tag-icon" aria-hidden="true"></i>');
                    if (name && !colourValue(name)) ctx.warn('unknown colour in ' + m);
                }
            } else {
                id = id || ctx.allocPiece(pieceSlug(text));
                if (name) {
                    const c = resolveColour(name);
                    if (c) cls = 'md-piece md-tag md-bg-' + c;
                    else { tail = '{' + name + '}'; ctx.warn('unknown colour in ' + m + ' (palette: ' + PALETTE_HUES.join(', ') + ', light-…, white, black)'); }
                }
            }
            if (ribbon && cls.indexOf('md-tag') !== -1) cls += ' md-ribbon';
            return tag('<span class="' + cls + '" data-id="' + esc(id) + '"' + (style ? ' style="' + style + '"' : '') + '>') +
                text + icon + tag('</span>') + tail;
        });

        // Morpheme words (SPEC 5.4): pieces split at " + ", a leading or
        // trailing hyphen marks the affix side, ~ hides a piece but keeps
        // its id. Colour by the piece's text, deck-wide; id from word and piece,
        // so the same word on two morph slides animates every change.
        // @slide morphemes=STATE sets the state for the whole slide.
        const morphemeWord = function (content, state) {
            const st = ctx.morphemes || state;
            const raw = content.split(/\s+\+\s+/).map(function (p) {
                p = p.trim();
                const gone = p.charAt(0) === '~';
                if (gone) p = p.slice(1);
                const pre = p.length > 1 && p.charAt(0) === '-', post = p.length > 1 && p.charAt(p.length - 1) === '-';
                return { gone: gone, pre: pre, post: post, core: p.replace(/^-|-$/g, '') };
            });
            const slugOf = function (x) { return pieceSlug(x).slice(2); };
            const word = slugOf(raw.map(function (r) { return r.core; }).join(''));
            let last = -1;
            raw.forEach(function (r, i) { if (!r.gone) last = i; });
            const hy = tag('<span class="md-mp-hy">') + '-' + tag('</span>');
            let html = tag('<span class="md-mw md-mw-' + st + '" data-word="' + esc(word) + '">');
            raw.forEach(function (r, i) {
                const c = ctx.pieceColour
                    ? ctx.pieceColour((r.pre ? '-' : '') + r.core.toLowerCase() + (r.post ? '-' : ''))
                    : MORPHEME_COLOURS[i % MORPHEME_COLOURS.length];
                const id = ctx.allocPiece('m-' + word + '-' + slugOf(r.core));
                html += tag('<span class="md-mp md-mp-' + (r.pre || r.post ? 'affix' : 'base') +
                    (r.gone ? ' md-mp-gone' : '') + (i === last ? ' md-mp-last' : '') +
                    ' md-c-' + c + ' md-bg-' + c + '" data-id="' + esc(id) + '">') +
                    (r.pre ? hy : '') + r.core + (r.post ? hy : '') + tag('</span>');
            });
            return html + tag('</span>');
        };

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
            if (brace && MORPHEME_STATES.indexOf(brace[1]) !== -1) {
                // a morpheme word: [un- + help + -ful]{split} (SPEC 5.4)
                if (/\s\+\s/.test(content)) {
                    s = before + morphemeWord(content, brace[1]) + after.slice(brace[0].length);
                    continue;
                }
                ctx.warn('a morpheme word puts " + " between its pieces, as in [un- + help + -ful]{' + brace[1] + '], and ' + m[0] + brace[0] + ' has none');
                literal();
                continue;
            }
            if (brace && brace[1] === 'ex' && content.trim()) {
                // [an example sentence]{ex}: the example face, inline
                s = before + tag('<span class="md-exs">') +
                    content.replace(/^'(?=(s|re|ve|m|ll|d|t)\b)/i, '\u2019') + tag('</span>') +
                    after.slice(brace[0].length);
                continue;
            }
            if (brace) {
                const name = brace[1];
                const c = name === 'accent' ? 'accent' : resolveColour(name);
                if (c && content.trim()) {
                    s = before + tag('<span class="md-c md-c-' + c + '">') +
                        content.replace(/^'(?=(s|re|ve|m|ll|d|t)\b)/i, '\u2019') + tag('</span>') +
                        after.slice(brace[0].length);
                    continue;
                }
                ctx.warn('unknown colour in ' + m[0] + brace[0] + ' (palette: ' + PALETTE_HUES.join(', ') + ', light-…, white, black, accent)');
                literal();
                continue;
            }
            // [S You][P 're saying]: a grammar mark straight after another
            // is a mark, not a reference link
            const gramRe = /^(Od|Oi|Cs|Co|cj|S|P|O|C|A) (\S[\s\S]*)$/;
            const pairedMark = gramRe.test(content) && /^\[(Od|Oi|Cs|Co|cj|S|P|O|C|A) \S[^\[\]]*\]/.test(after);
            const isLink = !pairedMark && ((nextKind && nextKind.kind === 'dest') || /^[\[(:]/.test(after) ||
                (prevLiteral && store[+prevLiteral[1]].kind === 'rb'));
            const g = !isLink && gramRe.exec(content);
            if (g) {
                // a contraction at the start of a mark ('s, 're, 've, 'm, 'll, 'd, 't)
                // is an apostrophe; smartypants would make it an opening quote
                g[2] = g[2].replace(/^'(?=(s|re|ve|m|ll|d|t)\b)/i, '\u2019');
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

    /* deck (optional): set tags are looked up in deck.tagIndex;
       morphemes: a state from @slide morphemes=STATE for this slide */
    function makeInlineCtx(warnings, deck, morphemes) {
        const alloc = makeIdAllocator();
        return {
            warn: function (msg) { if (warnings) warnings.push(msg); },
            allocPiece: alloc,
            tag: deck && deck.tagIndex ? function (text) {
                return deck.tagIndex[text.replace(/\u0000\d+\u0000/g, '').trim().toLowerCase()] || null;
            } : null,
            morphemes: morphemes || null,
            // a morpheme piece takes its colour from its text (help, -ful,
            // un- ...): the same piece is the same colour throughout the
            // deck, in the order pieces first appear
            pieceColour: function (key) {
                const map = deck ? (deck.pieceColours = deck.pieceColours || {}) : (this._pc = this._pc || {});
                if (!(key in map)) map[key] = MORPHEME_COLOURS[Object.keys(map).length % MORPHEME_COLOURS.length];
                return map[key];
            }
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
         build=all             every block after the heading builds, in order
         statement             one large centred sentence or quotation
         activity              room activity: lighter ground, accent bar
         text=N placeholder textbox   corporate decks (phase 4) */
    const SLIDE_FLAGS = ['smaller', 'smallest', 'centred', 'centered', 'plain', 'contrast', 'spare',
        'fade', 'cut', 'hidden', 'nohandout', 'static', 'build', 'statement', 'activity',
        'placeholder', 'textbox', 'morph', 'words'];
    function emitSlideMods(opts, srcLine, lineNo, name) {
        const classMap = { smaller: 'md-smaller', smallest: 'md-smallest', spare: 'md-spare',
            centred: 'md-centred', centered: 'md-centred',
            plain: 'md-plain', contrast: 'md-contrast',
            hidden: 'md-hidden', nohandout: 'md-nohandout', static: 'md-static', build: 'md-build',
            statement: 'md-statement', activity: 'md-activity',
            placeholder: 'md-corp-placeholder', textbox: 'md-corp-textbox' };
        const err = function (m) { return { md: errorSlide(name, lineNo, srcLine, m), isError: true }; };
        const classes = [];
        let transition = null, morph = false, words = null;
        for (const f of opts._flags) {
            if (SLIDE_FLAGS.indexOf(f) === -1) {
                return err('Unknown @slide flag `' + esc(f) + '`. Available: ' + SLIDE_FLAGS.filter(function (x) { return x !== 'centered'; }).join(', ') +
                    ' (plus bg=&lt;colour&gt;, build=auto, text=N, words=loose, duration=N, morphemes=STATE).');
            }
            if (f === 'morph') { morph = true; continue; }
            if (f === 'words') { words = 'exact'; continue; }
            if (f === 'fade' || f === 'cut') {
                if (transition) return err('`fade` and `cut` cannot both be set: a slide has one transition.');
                transition = f === 'fade' ? 'fade' : 'none';
                continue;
            }
            if (classes.indexOf(classMap[f]) === -1) classes.push(classMap[f]);
        }
        for (const k of Object.keys(opts)) {
            if (k.charAt(0) === '_') continue;
            if (['bg', 'id', 'build', 'text', 'words', 'duration', 'morphemes', 'y', 'gap', 'inset', 'shrink'].indexOf(k) === -1) {
                return err('Unknown @slide option `' + esc(k) + '`. Valid: bg=, id=, build=auto, text=N, shrink=N, words=loose, duration=N, morphemes=STATE (and, from a converter, y=, gap= and inset= in px).');
            }
            if (k === 'shrink' && !(/^\d+$/.test(opts[k]) && +opts[k] >= 40 && +opts[k] <= 100)) return err('`shrink=` is how far this slide may shrink to fit, in percent from 40 to 100 (the usual limit is 70 in corporate decks, 72 elsewhere), e.g. shrink=55.');
            if ((k === 'y' || k === 'gap' || k === 'inset') && !/^\d+(\.\d+)?$/.test(opts[k])) return err('`' + k + '=` takes px, e.g. ' + k + '=256.');
        }
        // @slide morph [words | words=loose] [duration=1.5] (SPEC 6.3):
        // written on the incoming slide; linkMorphSlides marks the one before
        if (opts.words !== undefined) {
            if (opts.words !== 'loose') return err('`words=` takes only loose (ignore punctuation and case); a bare `words` matches exactly.');
            words = 'loose';
        }
        if (words) morph = true;
        if (opts.duration !== undefined) {
            if (!/^\d+(\.\d+)?$/.test(opts.duration) || !(parseFloat(opts.duration) > 0)) return err('`duration=` takes seconds, e.g. duration=1.5.');
            if (!morph) return err('`duration=` is the length of a morph: write it as `@slide morph duration=' + esc(opts.duration) + '`.');
        }
        if (opts.morphemes !== undefined && MORPHEME_STATES.indexOf(opts.morphemes) === -1) {
            return err('`morphemes=' + esc(opts.morphemes) + '`: states are ' + MORPHEME_STATES.join(', ') + '.');
        }
        if (morph && transition) return err('`morph` is itself the transition into this slide, so it cannot take `' + (transition === 'fade' ? 'fade' : 'cut') + '` as well.');
        if (morph) classes.push('md-morph');
        if (opts.build !== undefined) {
            if (opts.build !== 'auto' && opts.build !== 'all') return err('`build=' + esc(opts.build) + '`: a slide builds with build=auto (its builds run without clicks) or build=all (every block after the heading arrives in reading order), or a bare build.');
            if (classes.indexOf('md-build') === -1) classes.push('md-build');
            classes.push(opts.build === 'all' ? 'md-build-all' : 'md-build-auto');
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
        if (!classes.length && !opts.bg && !transition && opts.text === undefined && opts.morphemes === undefined && opts.shrink === undefined &&
            opts.y === undefined && opts.gap === undefined && opts.inset === undefined) {
            return err('@slide needs at least one flag (' + SLIDE_FLAGS.filter(function (x) { return x !== 'centered'; }).join(', ') + ') or bg=&lt;colour&gt;.');
        }
        let attrs = '';
        if (classes.length) attrs += ' class="' + classes.join(' ') + '"';
        if (classes.indexOf('md-spare') !== -1) attrs += ' data-visibility="uncounted"';
        if (classes.indexOf('md-hidden') !== -1) attrs += ' data-visibility="hidden"';
        if (transition) attrs += ' data-transition="' + transition + '"';
        if (morph) attrs += ' data-auto-animate';
        if (words) attrs += ' data-md-words="' + words + '"';
        if (opts.duration !== undefined) attrs += ' data-auto-animate-duration="' + parseFloat(opts.duration) + '"';
        if (opts.morphemes !== undefined) attrs += ' data-md-morphemes="' + opts.morphemes + '"';
        if (opts.text !== undefined) attrs += ' data-corp-text="' + esc(opts.text) + '"';
        // how far the slide may shrink to fit (percent): autofit and the
        // corporate fit stop there instead of at 72% or 70%
        if (opts.shrink !== undefined) attrs += ' data-fit-floor="' + esc(opts.shrink) + '"';
        // corporate, converter-only: where the body starts and the space
        // between its blocks (px)
        if (opts.y !== undefined) attrs += ' data-corp-y="' + esc(opts.y) + '"';
        if (opts.gap !== undefined) attrs += ' data-corp-gap="' + esc(opts.gap) + '"';
        if (opts.inset !== undefined) attrs += ' data-corp-inset="' + esc(opts.inset) + '"';
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
            '<div class="md-quote-inner' + (has(opts, 'card') ? ' md-slip' : '') + '">\n\n' + quoted + '\n\n' +
            (opts.attrib ? '<p class="md-source">' + esc(opts.attrib).replace(/\*([^*]+)\*/g, '<em>$1</em>') + '</p>\n' : '') +
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
        body: 'line', text: true, flags: ['top', 'float'], build: [], keys: ['y', 'h'], numbers: ['y', 'h'],
        emit: function (d) {
            const cls = 'md-note' + (d.flags.indexOf('top') !== -1 ? ' md-note-top' : '') +
                (d.flags.indexOf('float') !== -1 ? ' md-note-float' : '') + (d.build ? ' fragment' : '');
            return '\n<div class="' + cls + '"' + placeAttrs(d.opts) + '>\n\n' + d.text + '\n\n</div>\n';
        }
    });

    /* @rule [COLOUR] [build]: a horizontal rule between blocks (a line
       written as --- would end the slide). Corporate mode draws the
       Dumfries deck's centred University Blue line. */
    registerDirective('rule', {
        body: 'line', positional: 1, build: [],
        emit: function (d, api) {
            let st = '';
            if (d.positional.length) {
                const c = colourValue(d.positional[0].value);
                if (!c) api.fail('`' + esc(d.positional[0].value) + '` is not a palette colour or #RRGGBB.');
                st = ' style="--rule-colour:' + (c.name ? 'var(--p-' + c.name + ')' : c.hex) + '"';
            }
            return '\n<div class="md-rule' + (d.build ? ' fragment' : '') + '"' + st + ' role="separator"></div>\n';
        }
    });

    /* Converter-only placement (corporate mode, SPEC 8): y= is the slide
       position of a block's top and h= its height, in px of the
       1920 x 1080 slide, as measured from a PowerPoint original. Written
       as data attributes and custom properties; outside corporate mode
       they do nothing. */
    function placeAttrs(o) {
        let st = '';
        if (o.y !== undefined) st += '--corp-y:' + o.y + 'px;';
        if (o.h !== undefined) st += '--corp-h:' + o.h + 'px;';
        return st ? ' style="' + st + '"' + (o.y !== undefined ? ' data-corp-top' : '') + (o.h !== undefined ? ' data-corp-h' : '') : '';
    }

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
    const CARD_FLAGS = ['wide', 'build', 'accent', 'dim', 'foot', 'answer', 'middle'];
    const CARD_STYLES = ['box', 'plain', 'bar', 'header', 'stat', 'strip'];

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
                // disc=COLOUR: the icon white (or ink) on a disc of that colour
                const dv = /^disc=(\S+)$/.exec(f);
                if (dv) {
                    const dc = colourValue(dv[1]);
                    if (!dc) api.fail('`disc=' + esc(dv[1]) + '` on the line `' + esc(c.src) + '` is not a palette colour or #RRGGBB.');
                    c.opts.disc = dc; return;
                }
                // converter-only sizes for one card (px), as on the block
                const sz = /^(h|text|head)=(\d+(?:\.\d+)?)$/.exec(f);
                if (sz) { c.opts[sz[1]] = parseFloat(sz[2]); return; }
                if (CARD_FLAGS.indexOf(f) !== -1) { c.set[f] = true; return; }
                const col = colourValue(f);
                if (col && !c.opts.colour) { c.opts.colour = col; return; }
                api.fail('unknown card flag `' + esc(f) + '` on the line `' + esc(c.src) + '`. Card flags: a colour (' +
                    PALETTE_HUES.join(', ') + ', light-…, or #RRGGBB), ' + CARD_FLAGS.join(', ') + ', icon=NAME, disc=COLOUR (and, from a converter, h=, text=, head= in px).');
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
            // height=auto written out: in corporate mode the block keeps its
            // content height instead of sharing the body's free space
            if (d.opts.height) cls.push('md-height-set');
            if (d.flags.indexOf('arrows') !== -1) cls.push('md-arrows');
            if (d.flags.indexOf('stack') !== -1) cls.push('md-stack');
            let style_ = '--cols:' + n + ';';
            if (widths) style_ += 'grid-template-columns:' + widths.map(function (w) { return w + 'fr'; }).join(' ') + ';';
            else if (style === 'strip') style_ += 'grid-template-columns:auto 1fr;';
            ['h', 'text', 'head', 'radius'].forEach(function (k) {
                if (d.opts[k] !== undefined) style_ += '--cards-' + k + ':' + d.opts[k] + 'px;';
            });
            if (d.opts.y !== undefined) style_ += '--corp-y:' + d.opts.y + 'px;';
            if (d.opts.gap !== undefined) style_ += '--cc-gap:' + d.opts.gap + 'px;column-gap:' + d.opts.gap + 'px;';
            let html = '\n<div class="' + cls.join(' ') + '" style="' + style_ + '"' + (d.opts.y !== undefined ? ' data-corp-top' : '') + (d.build ? ' data-md-steps' : '') + '>\n';
            // corporate mode: a bare `::` takes the next colour of the
            // deck's "cardColours" (default the Session decks' Part order)
            const corp = window.MGA_CORPORATE;
            if (corp && style !== 'plain' && style !== 'strip') {
                const cycle = (corp.cardColours && corp.cardColours.length ? corp.cardColours : ['blue', 'green', 'purple', 'red', 'pink'])
                    .map(colourValue).filter(Boolean);
                let k = 0;
                cards.forEach(function (c) {
                    if (c.src && !c.opts.colour && cycle.length) c.opts.colour = cycle[k++ % cycle.length];
                });
            }
            cards.forEach(function (c, i) {
                const f = fillOf(c.opts.colour);
                const cc = ['md-card'];
                if (c.opts.colour) cc.push('md-card-filled');
                Object.keys(c.set).forEach(function (k) { if (k !== 'build') cc.push('md-card-' + k); });
                const whole = d.build || c.set.build || c.set.answer;
                if (whole) cc.push('fragment');
                if (c.set.answer) cc.push('md-answer');
                let own = '';
                ['h', 'text', 'head'].forEach(function (k) { if (c.opts[k] !== undefined) own += '--cards-' + k + ':' + c.opts[k] + 'px;'; });
                let attrs = ' style="' + f.style + own + '--i:' + i + ';--n:' + cards.length + '"';
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
                    // two grades in one token (~~D3~~ C3): smaller, on one line
                    inner = tokens.map(function (t) { return cell('div', 'md-strip-token' + (/\s/.test(t.trim()) ? ' md-strip-pair' : ''), t); }).join('');
                    cc.push('md-strip');
                } else {
                    inner = api.expand(lines).trim() + '\n';
                }
                let icon = '';
                if (c.opts.icon) {
                    icon = '<i class="fad fa-' + c.opts.icon + ' md-icon md-card-icon" aria-hidden="true"></i>';
                    if (c.opts.disc) {
                        const df = fillOf(c.opts.disc);
                        icon = '<span class="md-icon-disc' + df.cls + '" style="' + df.style + '">' + icon + '</span>';
                    }
                    icon += '\n';
                } else if (c.opts.disc) {
                    api.fail('`disc=` on the line `' + esc(c.src) + '` needs an icon=NAME to go on it.');
                }
                // corporate mode, or with a disc: the icon sits beside the
                // card's heading (Dumfries 14 and 29) rather than above it
                const headLine = lines.findIndex(function (l) { return l.trim(); });
                if (icon && (window.MGA_CORPORATE || c.opts.disc) && headLine !== -1 && /^###\s/.test(lines[headLine])) {
                    const rest = lines.slice(); const h = rest.splice(headLine, 1)[0];
                    inner = '<div class="md-card-head">\n' + icon + '\n' + h + '\n\n</div>\n\n' + api.expand(rest).trim() + '\n';
                    icon = '';
                }
                html += '<div class="' + cc.join(' ') + f.cls + '"' + attrs + '>\n' + tag + icon + '\n' + inner + '\n</div>\n';
            });
            return html + '</div>\n';
        };
    }
    const CARDS_SPEC = {
        keys: ['cols', 'widths', 'style', 'height', 'h', 'text', 'head', 'radius', 'y', 'gap'],
        lists: ['widths'], numbers: ['cols', 'widths', 'h', 'text', 'head', 'radius', 'y', 'gap'],
        flags: ['arrows', 'stack']
    };
    registerDirective('cards', Object.assign({ body: 'markdown', emit: emitCards('cards') }, CARDS_SPEC));
    /* @card: the turned-corner card (a callout beside @note, @quote and the
       rest): any markdown, to @end or the end of the slide, on a card with
       its top right corner turned down. Each form draws it in its own way
       from the palette's card roles. `@quote ... card` puts a quotation on
       one. */
    registerDirective('card', {
        body: 'markdown', flags: ['ex'],
        emit: function (d, api) {
            if (!d.body.join('').trim()) api.fail('has no content.');
            // ex: example sentences, set in the form's contrasting face
            // (--ex-font); a list on it has no markers, a sub-item or a
            // %%aside%% is a note in the body face
            const ex = d.flags.indexOf('ex') !== -1;
            return '\n<div class="md-slip' + (ex ? ' md-ex-card' : '') + '">\n\n' + api.expand(d.body).trim() + '\n\n</div>\n';
        }
    });
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
        body: 'items', keys: ['y', 'h'], numbers: ['y', 'h'],
        emit: function (d, api) {
            const pos = (d.opts.y !== undefined ? '--corp-y:' + d.opts.y + 'px;' : '') + (d.opts.h !== undefined ? '--cards-h:' + d.opts.h + 'px;' : '');
            let html = '\n<div class="md-cards md-style-stat md-stats md-height-auto md-ncols-' + Math.min(d.items.length, 4) + '" style="--cols:' + Math.min(d.items.length, 4) + ';' + pos + '"' + (d.opts.y !== undefined ? ' data-corp-top' : '') + (d.build ? ' data-md-steps' : '') + '>\n';
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
        body: 'prefix', keys: ['head', 'widths', 'y', 'rows'], colours: ['head'], lists: ['widths', 'rows'], numbers: ['widths', 'y', 'rows'],
        flags: ['band', 'rowhead', 'caps', 'small', 'bars'], build: [],
        emit: function (d, api) {
            if (!/^\s*\|/.test(d.block[0] || '')) api.fail('applies to a markdown table, and the next block is not one (it should start with |).');
            // bars: a cell ending in (N%) gets a bar of that length beneath
            // its text (forms that draw bars style .md-bar; the rest hide it)
            if (d.flags.indexOf('bars') !== -1) {
                d.block = d.block.map(function (row, ri) {
                    if (ri < 2) return row;
                    return row.replace(/\((\d+(?:\.\d+)?)%\)(\s*)(?=\|)/g, '($1%)<span class="md-bar" style="--v:$1"></span>$2');
                });
            }
            const cls = ['md-table'];
            let style = '';
            if (d.opts.head) {
                const f = fillOf(d.opts.head);
                cls.push('md-table-head' + f.cls);
                style += f.style;
            }
            d.flags.forEach(function (f) { cls.push('md-table-' + f); });
            // build: one row per click; the table is laid out complete from
            // the start, so nothing moves as the rows arrive (applyBuilds)
            if (d.build) cls.push('md-table-build');
            if (d.opts.widths) {
                const total = d.opts.widths.reduce(function (a, b) { return a + b; }, 0);
                d.opts.widths.forEach(function (w, i) { style += '--w' + (i + 1) + ':' + (100 * w / total).toFixed(3) + '%;'; });
                cls.push('md-table-widths');
            }
            if (d.opts.y !== undefined) style += '--corp-y:' + d.opts.y + 'px;';
            // rows= (converter-only, px): each row's height in the original
            const rows = d.opts.rows ? ' data-corp-rows="' + d.opts.rows.join(',') + '"' : '';
            return '\n<div class="' + cls.join(' ') + '"' + (style ? ' style="' + style + '"' : '') + (d.opts.y !== undefined ? ' data-corp-top' : '') + rows + '>\n\n' + d.block.join('\n') + '\n\n</div>\n';
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
        body: 'items', keys: ['style'], flags: ['big'], build: ['level', 'up'],
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
            let html = '\n<div class="md-tree md-tree-' + style + (d.flags.indexOf('big') !== -1 ? ' md-tree-big' : '') + '"' + (d.build ? ' data-md-steps' : '') + '>\n';
            if (style === 'outline') {
                (function walk(list) {
                    list.forEach(function (n) {
                        const f = n.item.fields;
                        html += '<div class="md-to-row' + frag(stepOf(n)) + '" style="--d:' + n.depth + '">' +
                            (f.length > 1 ? '<span class="md-to-code">' + inlineHtml(f[0]) + '</span>' : '') +
                            '<span class="md-to-label">' + colourSetNames(inlineHtml(f[f.length - 1]), api.state) + '</span></div>\n';
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
                        '<div class="md-tn-label' + frag(stepOf(n)) + '">' + colourSetNames(inlineHtml(n.item.text), api.state) + '</div>';
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
       (buildTranscriptOverlays) and slides back down when left for a
       slide that is not an overlay (wireTranscriptOverlays); consecutive
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
            // each speaker numbered in order of first appearance (md-tr-spk-1,
            // -2, ...), so a form can tell speakers apart by more than the label
            const speakers = [];
            turns.forEach(function (t) { if (t.label && speakers.indexOf(t.label) === -1) speakers.push(t.label); });
            turns.forEach(function (t, ti) {
                const step = d.build ? ' fragment" data-md-step="' + steps[ti] : '';
                const spk = t.label ? ' md-tr-spk-' + (speakers.indexOf(t.label) + 1) : '';
                t.lines.forEach(function (l, li) {
                    const starts = l.text && /^\/\//.test(l.text.trim());
                    const id = morph ? ' data-id="tr-' + trHash((t.label || '') + '|' + (l.pause || l.text) + '|' + li) + '"' : '';
                    html += '<div class="md-tr-line' + spk + (l.pause ? ' md-tr-gap' : '') + (li > 0 ? ' md-tr-cont' : '') + (starts ? ' md-tr-ovstart' : '') + step + '"' + id + '>' +
                        '<span class="md-tr-num">' + l.n + '</span>' +
                        '<span class="md-tr-note">' + (l.note ? inlineHtml(l.note) : '') + '</span>' +
                        '<span class="md-tr-label">' + (li === 0 && t.label ? esc(t.label) : '') + '</span>' +
                        '<span class="md-tr-text">' + (l.pause ? '<span class="md-tr-pause">' + esc(l.pause) + '</span>' : fmt(l.text)) + '</span>' +
                        '</div>\n';
                });
            });
            // the slide: overlay transcripts change instantly (the panel
            // moves, in and out); morph slides auto-animate
            const slideAttrs = (overlay ? ' class="md-tr-overlay-slide" data-transition="none"' : '') +
                (morph ? ' data-auto-animate' : '');
            return (slideAttrs ? '<!-- .slide:' + slideAttrs + ' -->\n' : '') + html + '</div>\n';
        }
    });

    /* ---------- sets, menus and marks (SPEC 4.6 to 4.8, phase 2b) ---------- */

    /* @set NAME [text]: labelled items defined once per deck (or per
       course, through @include), one per line: Label :: colour :: icon
       :: optional. Aliases go comma-separated in the label field. A set
       is not displayed where it is written: collectSets reads every set
       in the deck before any slide expands, so [[Label]] anywhere is
       that set's tag, and @menu draws the set. A text set colours names
       in running text ([[Latin]] is blue text, not a pill). */
    const SET_SPEC = { body: 'items', positional: 1, flags: ['text'] };
    function setSlug(s) { return pieceSlug(s).slice(2); }
    function buildSet(d, fail) {
        const first = d.positional[0];
        const name = first && first.value;
        if (!name || !/^[\w-]+$/.test(name)) fail('needs a name first, e.g. `@set criteria` (letters, digits, - and _).');
        const text = d.flags.indexOf('text') !== -1;
        const seen = {};
        const items = d.items.map(function (it, i) {
            if (it.depth) fail('a set is one level: no line indented below another.', it);
            const f = it.fields;
            if (f.length > 4) fail('each line is Label :: colour :: icon :: optional (all but the label may be left out).', it);
            const labels = f[0].split(/\s*,\s*/).filter(Boolean);
            if (!labels.length) fail('every item needs a label.', it);
            labels.forEach(function (l) {
                const k = l.toLowerCase();
                if (seen[k]) fail('`' + esc(l) + '` appears twice in this set.', it);
                seen[k] = true;
            });
            let colour = null;
            if (f[1]) {
                colour = colourValue(f[1]);
                if (!colour) fail('`' + esc(f[1]) + '` is not a colour: use a palette name (' + PALETTE_HUES.join(', ') + ', light-…) or #RRGGBB.', it);
            }
            const icon = f[2] ? f[2].replace(/^fa-/, '') : null;
            if (icon && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon)) fail('`' + esc(f[2]) + '` is not an icon name: write the Font Awesome name, such as pen-nib.', it);
            if (icon && text) fail('a text set colours names in running text, so its items take no icon.', it);
            if (f[3] && f[3] !== 'optional') fail('the fourth field can only be `optional` (a paler stage).', it);
            return { label: labels[0], aliases: labels.slice(1), colour: colour, icon: icon,
                optional: f[3] === 'optional', index: i, id: 'tag-' + name + '-' + setSlug(labels[0]) };
        });
        return { name: name, text: text, items: items };
    }
    function collectSets(src, deck) {
        deck.tagIndex = {};
        if (src.indexOf('@set') === -1) return;
        const lines = src.split('\n');
        let fence = null;
        for (let i = 0; i < lines.length; i++) {
            const f = /^\s*(`{3,}|~{3,})/.exec(lines[i]);
            if (fence) { if (f && f[1].charAt(0) === fence.charAt(0)) fence = null; continue; }
            if (f) { fence = f[1]; continue; }
            if (!/^@set(\s|$)/.test(lines[i])) continue;
            try {
                const d = parseDirectiveLine(lines[i].replace(/^@set/, '').trim(), SET_SPEC);
                d.items = collectItems(lines, i + 1, 0).items;
                const s = buildSet(d, function (m) { throw new DirectiveError(m); });
                if (deck.sets[s.name]) continue;
                deck.sets[s.name] = s;
                s.items.forEach(function (it) {
                    [it.label].concat(it.aliases).forEach(function (l) {
                        const k = l.toLowerCase();
                        if (!deck.tagIndex[k]) deck.tagIndex[k] = { set: s, item: it };
                        else deck.warnings.push('@set ' + s.name + ': `' + l + '` is also in the set ' + deck.tagIndex[k].set.name + ', which wins for [[' + l + ']]');
                    });
                });
            } catch (e) {
                if (!(e instanceof DirectiveError)) throw e;
                // reported where the @set is expanded
            }
        }
    }
    /* Names from a text set are coloured with no markup inside @tree
       labels and @marks labels (SPEC 4.6): whole words only, outside
       HTML tags and [[pieces]] (which the inline pass handles) */
    function colourSetNames(html, deck) {
        if (!deck || !deck.sets) return html;
        if (!deck.nameRe) {
            const names = [], byName = {};
            Object.keys(deck.sets).forEach(function (k) {
                const set = deck.sets[k];
                if (!set.text) return;
                set.items.forEach(function (it) {
                    [it.label].concat(it.aliases).forEach(function (l) { if (!byName[l]) { byName[l] = it; names.push(l); } });
                });
            });
            names.sort(function (a, b) { return b.length - a.length; });
            deck.nameRe = names.length ? new RegExp('(^|[^\\p{L}\\p{N}])(' + names.map(function (n) {
                return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join('|') + ')(?![\\p{L}\\p{N}])', 'gu') : false;
            deck.nameItems = byName;
        }
        if (!deck.nameRe) return html;
        return html.split(/(<[^>]*>|\[\[(?:(?!\]\]).)*\]\](?:\{[\w-]+\})?)/).map(function (part, i) {
            if (i % 2) return part;
            return part.replace(deck.nameRe, function (m, pre, name) {
                const it = deck.nameItems[name];
                const c = it.colour;
                const open = c && c.name ? '<span class="md-c md-c-' + c.name + ' md-settext">'
                    : '<span class="md-settext"' + (c ? ' style="color:' + c.hex + '"' : '') + '>';
                return pre + open + name + '</span>';
            });
        }).join('');
    }

    registerDirective('set', Object.assign({
        emit: function (d, api) {
            const s = buildSet(d, api.fail);
            if (api.state.setsEmitted[s.name]) api.fail('a set named `' + esc(s.name) + '` is already defined earlier in this deck.');
            api.state.setsEmitted[s.name] = true;
            return '';
        }
    }, SET_SPEC));

    /* @menu SET STATE [style=strip|tabs|steps] [centre] [heading=build]
       (SPEC 4.7). Draws a set as navigation that holds still across
       slides: every item keeps its set id, and consecutive slides with a
       menu of the same set morph (linkMorphSlides). States: N (item N
       lit, the rest grey), 4,5, 2>3 (steps: the arrow between 2 and 3
       lit, the steps themselves not), all, labels (strip: all lit, the
       labels arrive on a click; labels=static shows them at once).
       strip: circles with icons, the default when every item has an
       icon; tabs: a stack of ribbon tabs; steps: step boxes with arrows,
       the default otherwise. centre: at mid-slide. The heading after a
       menu with one lit item sits under that item and moves along by
       morph (heading=build: it builds in on a click instead). */
    const MENU_STYLES = ['strip', 'tabs', 'steps'];
    registerDirective('menu', {
        body: 'line', positional: 2, keys: ['style', 'labels', 'heading'],
        flags: ['all', 'labels', 'centre', 'center'],
        emit: function (d, api) {
            const first = d.positional[0];
            if (!first || first.type !== 'name') api.fail('needs the name of a @set first, e.g. `@menu neologisms 2`.');
            const set = api.state.sets[first.value];
            const names = Object.keys(api.state.sets);
            if (!set) api.fail('there is no @set named `' + esc(first.value) + '` in this deck' + (names.length ? ' (sets: ' + names.join(', ') + ').' : '.'));
            if (set.text) api.fail('`' + esc(set.name) + '` is a text set (it colours names in running text); a menu draws a set of tags.');
            const n = set.items.length;
            const style = d.opts.style || (set.items.every(function (it) { return it.icon; }) ? 'strip' : 'steps');
            if (MENU_STYLES.indexOf(style) === -1) api.fail('`style=' + esc(style) + '`: styles are ' + MENU_STYLES.join(', ') + '.');
            if (d.opts.labels !== undefined && d.opts.labels !== 'static') api.fail('`labels=` takes only static (labels shown at once); a bare `labels` brings them in on a click.');
            if (d.opts.heading !== undefined && ['morph', 'build'].indexOf(d.opts.heading) === -1) api.fail('`heading=` is morph (the default: the heading moves along under the lit item) or build (it builds in on a click).');
            const labels = d.flags.indexOf('labels') !== -1 || d.opts.labels !== undefined;
            const all = d.flags.indexOf('all') !== -1;
            const tok = d.positional[1] && d.positional[1].value;
            const given = [tok !== undefined, all, labels].filter(Boolean).length;
            const STATES = 'a number (`2`), two numbers (`4,5`), the arrow between two steps (`2>3`), `all` or `labels`';
            if (!given) api.fail('say which item is lit: ' + STATES + '.');
            if (given > 1) api.fail('one state at a time: ' + STATES + '.');
            if (labels && style !== 'strip') api.fail('`labels` puts labels under a strip of circles; tabs and steps always show their labels (use `all`).');
            const lit = [];
            let arrow = -1;
            const inRange = function (k) {
                if (k < 1 || k > n) api.fail('item ' + k + ': the set `' + esc(set.name) + '` has ' + n + ' items.');
                return k - 1;
            };
            if (all || labels) { for (let k = 0; k < n; k++) lit.push(k); }
            else if (/^\d+(,\d+)*$/.test(tok)) { tok.split(',').forEach(function (k) { lit.push(inRange(+k)); }); }
            else if (/^\d+>\d+$/.test(tok)) {
                const ab = tok.split('>').map(Number);
                if (style !== 'steps') api.fail('`' + tok + '` lights the arrow between two steps, so it needs style=steps.');
                inRange(ab[0]); inRange(ab[1]);
                if (ab[1] !== ab[0] + 1) api.fail('`' + tok + '`: an arrow runs between neighbouring steps, e.g. ' + ab[0] + '>' + (ab[0] + 1) + '.');
                arrow = ab[0] - 1;
            } else api.fail('`' + esc(tok) + '` is not a state: write ' + STATES + '.');
            const centre = d.flags.indexOf('centre') !== -1 || d.flags.indexOf('center') !== -1;
            const cls = ['md-menu', 'md-menu-' + style];
            if (centre) cls.push('md-menu-centre');
            if (labels) cls.push('md-menu-labels' + (d.opts.labels === 'static' ? ' md-menu-labels-static' : ''));
            const one = lit.length === 1 && !all && !labels;
            let html = '\n<div class="' + cls.join(' ') + '" data-md-menu="' + esc(set.name) + '" role="list"' +
                ' style="--n:' + n + '"' + (one ? ' data-md-lit="' + lit[0] + '"' : '') + (arrow !== -1 ? ' data-md-arrow="' + arrow + '"' : '') +
                (d.opts.heading === 'build' ? ' data-md-heading="build"' : '') +
                (labels && d.opts.labels !== 'static' ? ' data-md-steps' : '') + '>\n';
            set.items.forEach(function (it, i) {
                const f = fillOf(it.colour);
                const on = lit.indexOf(i) !== -1;
                const ic = ['md-menu-item', on ? 'is-lit' : 'is-dim'];
                if (!it.colour) ic.push('md-menu-accent');
                if (it.optional) ic.push('md-menu-optional');
                if (style === 'tabs') ic.push('md-tag', 'md-settag');
                const icon = it.icon ? '<i class="fad fa-' + it.icon + ' md-icon" aria-hidden="true"></i>' : '';
                let inner;
                if (style === 'strip') {
                    inner = (icon || '<span class="md-menu-initial" aria-hidden="true">' + esc(it.label.charAt(0)) + '</span>') +
                        '<span class="md-menu-label' + (labels && d.opts.labels !== 'static' ? ' fragment" data-md-step="0' : '') + '">' + esc(it.label) + '</span>';
                } else {
                    inner = '<span class="md-menu-text">' + esc(it.label) + '</span>' + (style === 'tabs' ? icon : '');
                }
                // spans, as the tags they morph with are (reveal matches
                // data-id within one element name)
                html += '<span class="' + ic.join(' ') + f.cls + '" data-id="' + esc(it.id) + '" role="listitem"' +
                    (style === 'strip' ? ' title="' + esc(it.label) + '" aria-label="' + esc(it.label) + '"' : '') +
                    ' style="' + f.style + '--i:' + i + '">' + inner + '</span>\n';
                if (style === 'steps' && i < n - 1) {
                    html += '<span class="md-menu-arrow' + (i === arrow ? ' is-lit' : '') + (set.items[i + 1].colour ? fillOf(set.items[i + 1].colour).cls : ' md-menu-accent') +
                        '" data-id="md-menu-arrow-' + esc(set.name) + '-' + i + '" aria-hidden="true"></span>\n';
                }
            });
            return html + '</div>\n\n';
        }
    });

    /* @marks PATH alt="..." [caption="..."] [all] (SPEC 4.8): marks on an
       image, one step per line, positions in percent of the image:
         ring X,Y r=R [colour] ["label"] [pos=above|below|left|right]
              (r: a percentage of the image width; w= h= for an ellipse)
         box X,Y w=W h=H [colour] ["label"] [pos=...]   (X,Y top left)
         label X,Y "text" [colour] [rot=DEG]
         dim y=A,B | dim x=A,B | dim X,Y w=W h=H   (darkens the rest)
         zoom X,Y SCALE                  (zoom into the image as a step)
       A line starting + joins the step before; `all` shows every mark at
       once; a later line reusing an id= moves that mark (applyMarks
       moves it on the click). Every mark arrives on a click: the image
       stands alone first. */
    const MARK_KINDS = ['ring', 'box', 'label', 'dim', 'zoom'];
    const MARK_KEYS = { ring: ['r', 'w', 'h', 'id', 'pos'], box: ['w', 'h', 'id', 'pos'], label: ['id', 'rot'],
        dim: ['x', 'y', 'w', 'h', 'id'], zoom: ['scale'] };
    function parseMark(it, fail) {
        let text = it.raw.trim(), join = false;
        if (/^\+\s/.test(text)) { join = true; text = text.replace(/^\+\s+/, ''); }
        const km = /^(\w+)\s*(.*)$/.exec(text);
        const kind = km && km[1];
        if (MARK_KINDS.indexOf(kind) === -1) fail('each line starts with a kind of mark: ' + MARK_KINDS.join(', ') + ' (and + to join the step before).', it);
        const m = { kind: kind, join: join, opts: {}, it: it };
        const re = /([\w-]+)=(?:"([^"]*)"|(\S+))|"([^"]*)"|(\S+)/g;
        let t;
        while ((t = re.exec(km[2])) !== null) {
            if (t[1] !== undefined) {
                if (MARK_KEYS[kind].indexOf(t[1]) === -1) fail('`' + esc(t[1]) + '=` does not go with ' + kind + '. ' + kind + ' takes ' + MARK_KEYS[kind].map(function (k) { return k + '='; }).join(', ') + '.', it);
                m.opts[t[1]] = t[2] !== undefined ? t[2] : t[3];
            } else if (t[4] !== undefined) {
                if (m.text !== undefined) fail('one quoted label per mark.', it);
                m.text = t[4];
            } else {
                const b = t[5];
                if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(b) && !m.pos) { m.pos = b.split(',').map(parseFloat); continue; }
                if (kind === 'zoom' && numberLike(b) && m.pos && m.opts.scale === undefined) { m.opts.scale = b; continue; }
                const c = colourValue(b);
                if (c && !m.colour && kind !== 'dim' && kind !== 'zoom') { m.colour = c; continue; }
                fail('`' + esc(b) + '` is not understood here: positions are X,Y in percent of the image (47,52), colours palette names, labels "quoted".', it);
            }
        }
        const num = function (k, need) {
            const v = m.opts[k];
            if (v === undefined) { if (need) fail(kind + ' needs ' + k + '=.', it); return null; }
            if (!numberLike(v)) fail('`' + k + '=' + esc(v) + '` takes a number.', it);
            return parseFloat(v);
        };
        const g = {};
        if (kind === 'dim') {
            if (m.opts.y !== undefined || m.opts.x !== undefined) {
                const axis = m.opts.y !== undefined ? 'y' : 'x';
                if (m.opts.x !== undefined && m.opts.y !== undefined) fail('dim takes a strip across (y=A,B) or down (x=A,B), not both; for a box write dim X,Y w= h=.', it);
                const ab = String(m.opts[axis]).split(',').map(parseFloat);
                if (ab.length !== 2 || ab.some(isNaN) || ab[1] <= ab[0]) fail('`' + axis + '=` takes the two edges of the strip in percent, e.g. ' + axis + '=40,55.', it);
                if (axis === 'y') { g.x = 0; g.w = 100; g.y = ab[0]; g.h = ab[1] - ab[0]; }
                else { g.y = 0; g.h = 100; g.x = ab[0]; g.w = ab[1] - ab[0]; }
            } else {
                if (!m.pos) fail('dim takes a strip (dim y=40,55 or dim x=10,30) or a box (dim X,Y w= h=).', it);
                g.x = m.pos[0]; g.y = m.pos[1]; g.w = num('w', true); g.h = num('h', true);
            }
        } else {
            if (!m.pos) fail(kind + ' needs its position first, X,Y in percent of the image, e.g. ' + kind + ' 47,52.', it);
            g.x = m.pos[0]; g.y = m.pos[1];
            if (kind === 'ring') {
                const r = num('r'), w = num('w'), h = num('h');
                if (r === null && (w === null || h === null)) fail('ring needs r= (a percentage of the image width), or w= and h= for an ellipse.', it);
                if (r !== null) { g.w = 2 * r; g.h = null; } else { g.w = w; g.h = h; }
            }
            if (kind === 'box') { g.w = num('w', true); g.h = num('h', true); }
            if (kind === 'label') {
                if (m.text === undefined) fail('label needs its text in quotes, e.g. label 20,80 "Very frequent".', it);
                g.rot = num('rot') || 0;
            }
            if (kind === 'zoom') {
                g.k = num('scale', true);
                if (!(g.k > 0)) fail('zoom needs a scale above 0, e.g. zoom 40,40 2.5 (1 is the whole image).', it);
            }
        }
        if (m.opts.pos !== undefined && ['above', 'below', 'left', 'right'].indexOf(m.opts.pos) === -1) fail('`pos=` places the label: above, below, left or right.', it);
        if (kind === 'dim' || kind === 'zoom') { if (m.text !== undefined) fail(kind + ' takes no label.', it); }
        m.g = g;
        return m;
    }
    registerDirective('marks', {
        body: 'items', positional: 1, keys: ['alt', 'caption', 'id'], flags: ['all'],
        emit: function (d, api) {
            const p = d.positional[0];
            if (!p || p.type !== 'path') api.fail('needs the image first, e.g. `@marks ./img/map.png alt="..."`.');
            const all = d.flags.indexOf('all') !== -1;
            const marks = [], zooms = [];
            let step = -1;
            d.items.forEach(function (it, i) {
                const m = parseMark(it, api.fail);
                if (m.join && i === 0) api.fail('`+` joins the step before, and this is the first line.', it);
                if (!m.join) step++;
                const s = all ? -1 : step;
                if (m.kind === 'zoom') { zooms.push({ s: s, x: m.g.x, y: m.g.y, k: m.g.k }); return; }
                const id = m.opts.id;
                let mark = id ? marks.filter(function (x) { return x.id === id; })[0] : null;
                if (mark && mark.kind !== m.kind) api.fail('id=' + esc(id) + ' is a ' + mark.kind + ' earlier, so it cannot become a ' + m.kind + '.', it);
                if (!mark) { mark = { id: id || null, kind: m.kind, states: [] }; marks.push(mark); }
                const c = m.colour || (mark.states.length ? null : null);
                const prev = mark.states[mark.states.length - 1] || {};
                mark.states.push({ s: s, x: m.g.x, y: m.g.y, w: m.g.w, h: m.g.h, rot: m.g.rot,
                    c: c ? (c.name ? 'var(--p-' + c.name + ')' : c.hex) : (prev.c || null),
                    t: m.text !== undefined ? colourSetNames(inlineHtml(m.text), api.state) : (prev.t || ''), pos: m.opts.pos || prev.pos || 'above' });
            });
            const steps = all ? 0 : step + 1;
            const alt = d.opts.alt || d.opts.caption || '';
            const sid = d.opts.id || api.state.allocId(slugify(p.value));
            // each mark is drawn in its final state (what the handout and
            // the export show); applyMarks sets the state for each click
            const markHtml = marks.map(function (mk) {
                const f = mk.states[mk.states.length - 1];
                const style = markStyle(mk.kind, f);
                return '<div class="md-mark md-mark-' + mk.kind + '" data-md-states="' + esc(JSON.stringify(mk.states)) + '" style="' + style + '">' +
                    (mk.kind === 'dim' ? '' : '<span class="md-mark-text md-mark-' + (mk.kind === 'label' ? 'free' : f.pos) + '">' + f.t + '</span>') +
                    '</div>';
            }).join('\n');
            const zf = zooms[zooms.length - 1];
            let md = '<!-- .slide: class="md-fill md-marks-slide" id="' + esc(sid) + '" -->\n' +
                (alt ? '' : '<div class="md-alt-missing">missing alt text — add alt="…" to the @marks directive</div>\n') +
                '<div class="md-zoom-frame md-marks-frame"' + (steps ? ' data-md-steps' : '') + '>\n' +
                '<div class="md-marks-box"' + (zooms.length ? ' data-md-zooms="' + esc(JSON.stringify(zooms)) + '" style="' + zoomStyle(zf) + '"' : '') + '>\n' +
                '<img src="' + esc(p.value) + '" alt="' + esc(alt) + '" onload="this.parentNode.style.setProperty(\'--ar\', this.naturalWidth / this.naturalHeight)" onerror="' + IMG_ONERROR + '">\n' +
                markHtml + '\n</div>\n';
            for (let k = 0; k < steps; k++) md += '<span class="fragment md-mark-step" data-md-step="' + k + '"></span>';
            md += '\n</div>\n' + (d.opts.caption ? '<figcaption class="md-frame-caption">' + esc(d.opts.caption) + '</figcaption>\n' : '');
            return md;
        }
    });
    function markStyle(kind, st) {
        let s = '--x:' + st.x + ';--y:' + st.y + ';--w:' + (st.w === undefined ? 0 : st.w) + ';';
        if (st.h !== null && st.h !== undefined) s += '--h:' + st.h + ';';
        if (st.rot) s += '--rot:' + st.rot + 'deg;';
        if (st.c) s += '--mc:' + st.c + ';';
        return s;
    }
    function zoomStyle(z) {
        if (!z) return '';
        return '--zx:' + z.x + ';--zy:' + z.y + ';--zk:' + z.k + ';';
    }

    /* ---------- grammar: @parse and @passage (SPEC 4.10, 4.11, phase 3) ----------

       @parse [steps="class mh brackets form function clauses highlight"]
              [layout=leech] [paired] [left]
         [MCl (^S_NP His^M_d family^H_N) (^P_VP bought^H_V) (^A_AvP there.^H_Av)]

       One analysis per indented line; a line ending in // goes on with
       the next line (the break shown there), and // inside a line breaks
       it. Tokens, separated by spaces:
         word^A_B   a word, A above it (M, H, x), B below it (d, N, Aj);
                    either may be left out; \^ \_ \( ... are literal
         (^S_NP     opens a phrase: function above, type below the bracket;
                    ! marks it for the highlight band. A bracket glued to a
                    word with no ^ _ ! after it is just a bracket: (the
         [MCl {Se   open a clause or sentence, its label set small and
                    inline before the bracket (MCl SCl NCl CCl RCl ACl Cl
                    Se); anything else glued to [ { is a word: [that
         <^S_SCl    opens a rank-shifted clause: function above, label
                    below; <SCl sets the label inline, as [ does
         ) ] } >    close, alone or glued to the end of a word: house^H_N)]
         %%...%%    words set in the subtle colour (may span words)
       Every tier not named in steps= shows from the start; tiers named
       there arrive one per click (+ joins two into one click), after any
       builds above the block, and keep their space while hidden, so the
       words never move. A tier with nothing in it takes no click. paired:
       the list just before the analysis names the steps, item k arriving
       with step k (applyBuilds). The whole block is held back from the
       inline pass (md-raw), so its brackets are never read as marks. */
    const PZ_TIERS = ['class', 'mh', 'brackets', 'form', 'function', 'clauses', 'sentence', 'highlight'];
    const PZ_FN = { S: 'subject', P: 'predicator', O: 'object', Od: 'object', Oi: 'object',
        C: 'complement', Cs: 'complement', Co: 'complement', A: 'adverbial' };
    const PZ_CLAUSE = /^(MCl|SCl|NCl|CCl|RCl|ACl|Cl|Se)(?=$|[\^_!])/;
    const PZ_PAIRS = { '(': ')', '[': ']', '{': '}', '<': '>' };

    function pzLabels(spec) {
        // "^S_NP!" -> { above: 'S', below: 'NP', hl: true }; ^ and _ in any order
        const out = { above: '', below: '', hl: false };
        if (/!/.test(spec)) { out.hl = true; spec = spec.replace(/!/g, ''); }
        const re = /([\^_])((?:\\.|[^\^_])*)/g;
        let m;
        while ((m = re.exec(spec)) !== null) {
            const v = m[2].replace(/\\(.)/g, '$1');
            if (m[1] === '^') out.above = v; else out.below = v;
        }
        return out;
    }
    function pzWord(text) {
        return inlineHtml(esc(text).replace(/'/g, '’'));
    }

    /* one analysis -> lines of columns: { kind: open|word|close, ... } */
    function parseAnalysis(text, fail) {
        const lines = [[]];
        const stack = [];
        let hlCount = 0, dim = false;
        const cur = function () { return lines[lines.length - 1]; };
        const hls = function () { return stack.filter(function (o) { return o.hl; }).map(function (o) { return o.hl; }); };
        text.trim().split(/\s+/).forEach(function (tok) {
            if (tok === '//') { lines.push([]); return; }
            // opening brackets at the start of the token
            while (/^[(\[{<]/.test(tok)) {
                const ch = tok.charAt(0);
                let rest = tok.slice(1), col;
                if (ch === '(') {
                    if (/^[\^_!]/.test(rest)) {
                        const l = pzLabels(rest);
                        col = { kind: 'open', ch: ch, above: l.above, below: l.below, hl: l.hl ? ++hlCount : 0 };
                        rest = '';
                    } else col = { kind: 'open', ch: ch, above: '', below: '', hl: 0 };
                } else {
                    const cm = PZ_CLAUSE.exec(rest);
                    let inline = '';
                    if (cm) { inline = cm[1]; rest = rest.slice(cm[1].length); }
                    let l = { above: '', below: '', hl: false };
                    if (/^[\^_!]/.test(rest)) { l = pzLabels(rest); rest = ''; }
                    col = { kind: 'open', ch: ch, inline: inline, above: l.above, below: l.below, hl: l.hl ? ++hlCount : 0 };
                }
                col.hls = hls();
                stack.push(col);
                cur().push(col);
                tok = rest;
            }
            if (!tok) return;
            // closing brackets glued to the end
            let closers = '';
            while (/[)\]}>]$/.test(tok) && !/\\[)\]}>]$/.test(tok)) { closers = tok.slice(-1) + closers; tok = tok.slice(0, -1); }
            if (tok) {
                let dimHere = dim;
                if (/^%%/.test(tok)) { tok = tok.slice(2); dimHere = dim = true; }
                if (/%%$/.test(tok) && tok.length > 2) { tok = tok.slice(0, -2); dim = false; }
                else if (tok === '%%') { dim = false; tok = ''; }
                const lm = /^((?:\\.|[^\^_])*)(.*)$/.exec(tok);
                const l = pzLabels(lm[2]);
                if (lm[1] || l.above || l.below) {
                    cur().push({ kind: 'word', text: lm[1], above: l.above, below: l.below, dim: dimHere, hls: hls() });
                }
            }
            for (const c of closers) {
                const open = stack.pop();
                if (!open) fail('`' + c + '` closes a bracket that was never opened.');
                if (PZ_PAIRS[open.ch] !== c) fail('`' + open.ch + '` is closed by `' + c + '`; it needs `' + PZ_PAIRS[open.ch] + '`.');
                cur().push({ kind: 'close', ch: c, hls: hls().concat(open.hl ? [open.hl] : []) });
            }
        });
        if (stack.length) fail(stack.length + ' bracket' + (stack.length > 1 ? 's are' : ' is') + ' left open (`' + stack.map(function (o) { return o.ch; }).join(' ') + '`).');
        return lines.filter(function (l) { return l.length; });
    }

    registerDirective('parse', {
        body: 'items', keys: ['steps', 'layout', 'show'], sequences: ['steps'], flags: ['paired', 'left', 'plain', 'big'],
        emit: function (d, api) {
            if (d.opts.layout !== undefined && d.opts.layout !== 'leech') api.fail('`layout=` takes leech (labels at the left of each word); the default is the centred Corbett and Kay layout.');
            const groups = d.opts.steps || [];
            groups.forEach(function (g) {
                g.forEach(function (t) {
                    if (PZ_TIERS.indexOf(t) === -1) api.fail('`' + esc(t) + '` is not a tier. Tiers: ' + PZ_TIERS.join(', ') + ' (+ joins two into one click).');
                });
            });
            if (d.flags.indexOf('paired') !== -1 && !groups.length) api.fail('`paired` brings in the list before the analysis with its steps, so it needs steps="...".');
            // a line ending in // goes on with the next line
            const analyses = [];
            d.items.forEach(function (it) {
                const prev = analyses[analyses.length - 1];
                if (prev && /(^|\s)\/\/$/.test(prev.text)) prev.text += ' ' + it.text;
                else analyses.push({ text: it.text, item: it });
            });
            const parsed = analyses.map(function (a) {
                if (/(^|\s)\/\/$/.test(a.text)) a.text = a.text.replace(/\s*\/\/$/, '');
                return parseAnalysis(a.text, function (m) { api.fail(m, a.item); });
            });
            // which tiers have anything in them: an empty tier takes no click
            const used = {};
            parsed.forEach(function (lines) {
                lines.forEach(function (line) {
                    line.forEach(function (c) {
                        if (c.kind === 'word') { if (c.below) used['class'] = 1; if (c.above) used.mh = 1; }
                        else if (c.ch === '(' || c.ch === ')') {
                            used.brackets = 1;
                            if (c.below) used.form = 1;
                            if (c.above) used[PZ_FN[c.above] ? 'function' : 'mh'] = 1;
                        } else {
                            used[c.ch === '{' || c.ch === '}' ? 'sentence' : 'clauses'] = 1;
                            if (c.above) used[PZ_FN[c.above] ? 'function' : 'mh'] = 1;
                        }
                        if (c.hl) used.highlight = 1;
                    });
                });
            });
            const stepOf = {};
            let n = 0;
            groups.forEach(function (g) {
                const live = g.filter(function (t) { return used[t]; });
                if (!live.length) return;
                live.forEach(function (t) { stepOf[t] = n; });
                n++;
            });
            // show="class mh": on a slide of a step-by-step series, only these
            // tiers (and those in steps=) are visible; the others are laid
            // out but invisible, so the words stand where they will stand
            // when every tier is there
            // (show=words: the words alone, every tier reserved)
            const shown = d.opts.show ? String(d.opts.show).split(/[\s,+]+/).filter(function (t) { return t && t !== 'words'; }) : null;
            if (shown) shown.forEach(function (t) {
                if (PZ_TIERS.indexOf(t) === -1) api.fail('`' + esc(t) + '` in show= is not a tier. Tiers: ' + PZ_TIERS.join(', ') + '.');
            });
            const st = function (tier) {
                if (tier in stepOf) return ' fragment" data-md-step="' + stepOf[tier];
                return shown && shown.indexOf(tier) === -1 ? ' pz-reserved' : '';
            };
            const plain = d.flags.indexOf('plain') !== -1;
            const lab = function (cls, tier, text) {
                return text ? '<span class="' + cls + st(tier) + '">' + esc(text) + '</span>' : '<span class="' + cls + ' pz-empty"></span>';
            };
            const inHl = function (c) { return !!(c && ((c.hls || []).length || c.hl)); };
            const band = function (c, next, prev) {
                return inHl(c) ? '<span class="pz-band' + (inHl(prev) ? '' : ' pz-band-start') + (inHl(next) ? '' : ' pz-band-end') + st('highlight') + '"></span>' : '';
            };
            const above = function (c) {
                if (!c.above) return lab('pz-t', 'mh', '');
                const fn = PZ_FN[c.above];
                return fn ? lab('pz-t pz-fn' + (plain ? ' pz-plain' : ' ' + fn), 'function', c.above) : lab('pz-t pz-mh', 'mh', c.above);
            };
            const cls = ['pz'];
            if (d.opts.layout === 'leech') cls.push('pz-leech');
            if (d.flags.indexOf('left') !== -1) cls.push('pz-left');
            if (d.flags.indexOf('big') !== -1) cls.push('pz-big');
            let html = '<div class="' + cls.join(' ') + '"' + (n ? ' data-md-steps' : '') +
                (d.flags.indexOf('paired') !== -1 ? ' data-md-paired' : '') + '>';
            parsed.forEach(function (lines) {
                html += '<div class="pz-ex">';
                lines.forEach(function (line) {
                    html += '<div class="pz-line">';
                    let cluster = '', prev = null;
                    const flush = function () { if (cluster) html += '<span class="pz-k">' + cluster + '</span>'; cluster = ''; };
                    line.forEach(function (c, ci) {
                        const nx = line[ci + 1], pv = line[ci - 1];
                        if ((c.kind === 'open' || c.kind === 'word') && prev && (prev.kind === 'word' || prev.kind === 'close')) flush();
                        if (c.kind === 'open') {
                            const round = c.ch === '(';
                            const tier = round ? 'brackets' : (c.ch === '{' ? 'sentence' : 'clauses');
                            const mid = '<span class="pz-m pz-br' + (round ? '' : ' pz-cl') + st(tier) + '">' +
                                (c.inline ? '<span class="pz-inl">' + esc(c.inline) + '</span>' : '') + esc(c.ch) + '</span>';
                            cluster += '<span class="pz-c pz-open' + (round ? '' : ' pz-sq') + '">' + above(c) + mid +
                                lab('pz-b pz-form', round ? 'form' : tier, c.below) + band(c, nx, pv) + '</span>';
                        } else if (c.kind === 'word') {
                            cluster += '<span class="pz-c pz-word">' + above(c) +
                                '<span class="pz-m pz-w' + (c.dim ? ' pz-dim' : '') + '">' + (c.text ? pzWord(c.text) : '&nbsp;') + '</span>' +
                                lab('pz-b pz-class', 'class', c.below) + band(c, nx, pv) + '</span>';
                        } else {
                            const round = c.ch === ')';
                            cluster += '<span class="pz-c pz-close' + (round ? '' : ' pz-sq') + '"><span class="pz-t pz-empty"></span>' +
                                '<span class="pz-m pz-br' + (round ? '' : ' pz-cl') + st(round ? 'brackets' : (c.ch === '}' ? 'sentence' : 'clauses')) + '">' + esc(c.ch) + '</span>' +
                                '<span class="pz-b pz-empty"></span>' + band(c, nx, pv) + '</span>';
                        }
                        prev = c;
                    });
                    flush();
                    html += '</div>';
                });
                html += '</div>';
            });
            return '\n<!--md-raw-->' + html + '</div><!--/md-raw-->\n';
        }
    });

    /* @passage steps="P S O C A cj" [find]  (SPEC 4.11)
       Applies to the next paragraph, whose grammar marks ([S Tam]) or
       colour marks ([defended]{gold}) take their colour one step at a
       time: steps= names functions (S P O C A cj; O covers Od and Oi, C
       covers Cs and Co) or palette names, + joining two into one click.
       find: each function is first set in bold, then coloured on the next
       click (a conjunction, already bold, takes one click). A step whose
       marks are not in the passage takes no click. The colours wait on
       hidden markers (CSS :has), so the export shows the final state. */
    const PASSAGE_KEYS = { S: 'subject', P: 'predicator', O: 'object', Od: 'object', Oi: 'object',
        C: 'complement', Cs: 'complement', Co: 'complement', A: 'adverbial', cj: 'conjunction' };
    registerDirective('passage', {
        body: 'prefix', keys: ['steps'], sequences: ['steps'], flags: ['find'],
        emit: function (d, api) {
            const text = d.block.join('\n');
            if (/^\s*(\||>|#|[*+-]\s|\d+[.)]\s)/.test(d.block[0])) api.fail('applies to a paragraph of running text, and the next block is not one.');
            const steps = d.opts.steps || [];
            const find = d.flags.indexOf('find') !== -1;
            if (find && !steps.length) api.fail('`find` sets each function in bold before its colour, so it needs steps="...".');
            // what the passage holds
            const present = {};
            text.replace(/\[(Od|Oi|Cs|Co|cj|S|P|O|C|A) \S/g, function (m, g) { present[PASSAGE_KEYS[g]] = 1; return m; });
            text.replace(/\]\{([A-Za-z][\w-]*)\}/g, function (m, c) { const r = c === 'accent' ? 'accent' : resolveColour(c); if (r) present['c-' + r] = 1; return m; });
            let html = '', k = 0;
            steps.forEach(function (group) {
                const keys = group.map(function (t) {
                    if (PASSAGE_KEYS[t]) return PASSAGE_KEYS[t];
                    const c = t === 'accent' ? 'accent' : resolveColour(t);
                    if (c) return 'c-' + c;
                    api.fail('`' + esc(t) + '` is not a step: name a function (S P O C A cj) or a palette colour (' + PALETTE_HUES.join(', ') + ', light-…).');
                }).filter(function (key) { return present[key]; });
                if (!keys.length) return;
                const bold = find ? keys.filter(function (key) { return key !== 'conjunction'; }) : [];
                if (bold.length) {
                    html += '<span class="md-pstep fragment ' + bold.map(function (key) { return 'md-ps-b-' + key; }).join(' ') + '" data-md-step="' + (k++) + '"></span>';
                }
                html += '<span class="md-pstep fragment ' + keys.map(function (key) { return 'md-ps-c-' + key; }).join(' ') + '" data-md-step="' + (k++) + '"></span>';
            });
            return '\n<div class="md-passage"' + (k ? ' data-md-steps' : '') + '>\n\n' + text + '\n\n' +
                (html ? '<div class="md-pmarks" aria-hidden="true">' + html + '</div>\n' : '') + '</div>\n';
        }
    });

    /* @parse and @passage fit their width: an analysis never wraps (a wrap
       would part labels from their brackets), so a line wider than the
       slide shrinks the whole analysis, to 70% at most; past that, break
       the line by hand with // */
    function fitParses() {
        document.querySelectorAll('.reveal .slides .pz').forEach(function (pz) {
            const restore = unhideForMeasuring(pz);
            pz.style.removeProperty('font-size');
            const base = parseFloat(getComputedStyle(pz).fontSize);
            const lines = pz.querySelectorAll('.pz-line');
            const tooWide = function () {
                for (const l of lines) if (l.scrollWidth > pz.clientWidth + 1) return true;
                return false;
            };
            let k = 1;
            while (k > 0.7 + 1e-6 && tooWide()) {
                k = Math.round((k - 0.05) * 100) / 100;
                pz.style.fontSize = (base * k).toFixed(1) + 'px';
            }
            /* still too wide: start at the left edge, so only the end is cut */
            const over = tooWide();
            pz.classList.toggle('pz-over', over);
            if (over && window.MGA_LOCAL_PREVIEW && !pz.dataset.pzWarned) {
                pz.dataset.pzWarned = '1';
                const h = pz.closest('section').querySelector('h1, h2, h3');
                console.warn('[parse] an analysis is still too wide at 70%' + (h ? ': "' + h.textContent.trim() + '"' : '') + ' — break it with //');
            }
            restore();
        });
    }
    window.fitParses = fitParses;

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
                // `@section Part 1 :: blue`: a colour after ` :: `; in
                // corporate mode the markdown after it is the divider card
                let text = dm[2].trim(), colour = null;
                const cm = /^(.*?)\s+::\s+(\S+)$/.exec(text);
                if (cm && colourValue(cm[2])) { text = cm[1].trim(); colour = colourValue(cm[2]); }
                if (window.MGA_CORPORATE && text) {
                    const c = collectMarkdown(lines, i + 1);
                    const inner = expandChunk(c.body.join('\n'), deck, lineOffset + i + 1);
                    const f = fillOf(colour || { name: 'navy' });
                    out.push('<!-- .slide: class="corp-part-slide" -->\n## ' + text + '\n\n' +
                        '<div class="corp-part' + f.cls + '"' + (f.style ? ' style="' + f.style + '"' : '') + '>\n\n' +
                        inner.md.trim() + '\n\n</div>\n');
                    if (inner.hadError) hadError = true;
                    if (c.furniture.length) {
                        const fu = expandChunk(c.furniture.join('\n'), deck, lineOffset + c.next);
                        out.push(fu.md);
                        if (fu.hadError) hadError = true;
                    }
                    i = c.next;
                    continue;
                }
                r = emitSection(text, line, lineNo, name);
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
                if (opts.over !== undefined) {
                    // the markdown body laid over the image (SPEC 6.4)
                    const c = collectMarkdown(lines, i + 1);
                    if (!r.isError) {
                        const inner = expandChunk(c.body.join('\n'), deck, lineOffset + i + 1);
                        const ov = emitOver(opts, inner.md, line, lineNo, name);
                        r = ov.isError ? ov : { md: r.md + ov.md, isError: inner.hadError };
                    }
                    out.push(r.md);
                    if (r.isError) hadError = true;
                    if (c.furniture.length) {
                        const f = expandChunk(c.furniture.join('\n'), deck, lineOffset + c.next);
                        out.push(f.md);
                        if (f.hadError) hadError = true;
                    }
                    i = c.next;
                    continue;
                }
            } else if (kind === 'video') {
                // @video: a side column like @image-left when markdown follows
                let bodyEnd = lines.length;
                for (let j = i + 1; j < lines.length; j++) {
                    if (/^notes:/.test(lines[j])) { bodyEnd = j; break; }
                }
                r = emitVideo(opts, lines.slice(i + 1, bodyEnd), deck, line, lineNo, name);
                out.push(r.md);
                if (r.isError) hadError = true;
                for (let j = bodyEnd; j < lines.length; j++) out.push(lines[j]);
                return { md: out.join('\n'), hadError: hadError };
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
                let body = lines.slice(i + 1, bodyEnd);
                // bleed: a heading written before the directive would sit
                // under the image, so it moves to the top of the text column
                if (has(opts, 'bleed')) {
                    const lifted = [];
                    for (let k = out.length - 1; k >= 0; k--) {
                        if (/^ {0,3}#{1,6}\s/.test(out[k])) { lifted.unshift(out[k]); out.splice(k, 1); }
                    }
                    if (lifted.length) body = lifted.concat([''], body);
                }
                // the column's own directives (@pause, @columns, @note...) expand
                // as on any slide; an @source line goes to the foot of the slide
                const sources = body.filter(function (l) { return /^@source\b/.test(l); });
                body = body.filter(function (l) { return !/^@source\b/.test(l); });
                if (body.some(function (l) { return /^@/.test(l); })) {
                    const sub = expandChunk(body.join('\n'), deck, lineOffset + i + 1);
                    if (sub.hadError) hadError = true;
                    body = sub.md.split('\n');
                }
                r = emitSplit(kind, opts, body, allocId, line, lineNo, name);
                if (!r.isError && sources.length) {
                    const f = expandChunk(sources.join('\n'), deck, lineOffset + i + 1);
                    r.md += '\n' + f.md + '\n';
                }
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
                    'Unknown directive `@' + esc(kind) + '`. Available: @image, @image-seq, @image-left, @image-right, @compare, @zoom, @kenburns, @video, @slide, @section, @quote, @refs, @note' +
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

    /* A directive that makes several slides from one chunk (@zoom, a
       transcript overlay...) still answers to the chunk's @slide hidden and
       nohandout: they are carried to every slide it made. */
    function carrySlideFlags(md) {
        const pieces = md.split(/(\n---?\n)/);
        if (pieces.length < 3) return md;
        const first = /<!--\s*\.slide:[^>]*class="([^"]*)"/.exec(pieces[0]);
        const carry = first ? first[1].split(/\s+/).filter(function (c) { return c === 'md-nohandout' || c === 'md-hidden'; }) : [];
        if (!carry.length) return md;
        return pieces.map(function (p, i) {
            if (i === 0 || /^\n---?\n$/.test(p)) return p;
            return mergeSlideComments('<!-- .slide: class="' + carry.join(' ') + '"' +
                (carry.indexOf('md-hidden') !== -1 ? ' data-visibility="hidden"' : '') + ' -->\n' + p);
        }).join('');
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
        const deck = { name: name, allocId: makeIdAllocator(), named: {}, warnings: [], sets: {}, setsEmitted: {} };
        // sets are collected from the whole deck before any slide expands,
        // so a tag or menu may come before its @set
        collectSets(src, deck);
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
            // a slide that held only definitions (@set) is not a slide
            if (!r.md.trim() && /^@set\b/m.test(part)) return null;
            const merged = carrySlideFlags(mergeSlideComments(r.md));
            const mstate = /data-md-morphemes="(\w+)"/.exec(merged);
            return inlineMarks(wrapFillSlides(merged), makeInlineCtx(deck.warnings, deck, mstate && mstate[1]));
        });
        // drop the emptied slides with one separator each
        const kept = [];
        out.forEach(function (p, i) {
            if (p === null) {
                if (kept.length && /^\n--?-?\n$/.test(kept[kept.length - 1])) kept.pop();
                else if (i + 1 < out.length) out[i + 1] = '';
                return;
            }
            kept.push(p);
        });
        return { markdown: kept.join(''), hadError: hadError, warnings: deck.warnings };
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
                    // (an export with spares=0 leaves them out altogether)
                    if (split.spares && (window.MGA_EXPORT || {}).spares !== false) {
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
        const STEP = 0.04, FLOOR_USUAL = 0.72;
        const skip = '.title-slide, .md-fill, .md-section, .directive-error-slide, [data-autofit="off"]';
        document.querySelectorAll('.reveal .slides section').forEach(function (section) {
            if (section.querySelector('section')) return;          // a vertical stack
            if (section.matches(skip)) return;
            if (!section.children.length) return;
            const restore = unhideForMeasuring(section);
            const FLOOR = fitFloor(section, FLOOR_USUAL);
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
            src.style.removeProperty('padding-left');
            const prev = src.previousElementSibling;
            if (!prev) return;
            // after a displayed quotation, a left-aligned source starts
            // where the quotation's text starts
            if (prev.matches('blockquote') && getComputedStyle(src).textAlign.match(/left|start/)) {
                const p = prev.querySelector('p') || prev;
                const restoreQ = unhideForMeasuring(src);
                const q = p.getBoundingClientRect().left, s0 = src.getBoundingClientRect().left;
                const sec = src.closest('section'), sr = sec.getBoundingClientRect();
                const scale = sec.offsetWidth ? sr.width / sec.offsetWidth : 1;
                const d = (q - s0) / scale;
                if (d > 1 && d < 300) src.style.paddingLeft = d.toFixed(1) + 'px';
                restoreQ();
                return;
            }
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
            if (note.classList.contains('md-note-float')) return;   // a reminder box shows from the start
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
            // the export's final state (?fragments=false) shows every step
            if (document.documentElement.classList.contains('mga-final') || last.classList.contains('visible')) note.classList.add('visible');
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
            // @refs: list items never build (the stylesheet always showed
            // them, so they took clicks that changed nothing)
            const isStatic = sec.classList.contains('md-static') || sec.classList.contains('md-refs');
            if (isStatic || (!listBuild && !sec.classList.contains('md-build'))) {
                lis.forEach(function (li) { li.classList.remove('fragment'); });
            } else if (sec.classList.contains('md-build') && !sec.classList.contains('md-refs')) {
                lis.forEach(function (li) { li.classList.add('fragment'); });
            }

            // @table build: each body row is a click
            Array.prototype.filter.call(sec.querySelectorAll('.md-table-build tbody > tr'), own).forEach(function (tr) {
                tr.classList.add('fragment');
            });
            // @slide build=all: every block after the heading (headings,
            // paragraphs, tables, figures; list items one by one) arrives
            // in reading order
            if (sec.classList.contains('md-build-all')) {
                const walk = function (parent) {
                    Array.prototype.forEach.call(parent.children, function (el) {
                        if (/^(H1|H2)$/.test(el.tagName) || el.classList.contains('md-source') ||
                            el.classList.contains('md-menu') || el.classList.contains('md-menu-head') ||
                            el.tagName === 'ASIDE' || el.classList.contains('fragment')) return;
                        if (/^(UL|OL)$/.test(el.tagName)) { el.querySelectorAll('li').forEach(function (li) { li.classList.add('fragment'); }); return; }
                        if (el.classList.contains('md-fill-inner')) { walk(el); return; }
                        if (el.matches('.md-table-build')) return;
                        // a block holding builds of its own (a table of
                        // answers) arrives first, then its builds in turn
                        el.classList.add('fragment');
                    });
                };
                walk(sec);
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

            // a card that holds nothing but a building list (@card ex with
            // examples): the card arrives with its first item rather than
            // standing empty before it
            Array.prototype.filter.call(sec.querySelectorAll('.md-slip:not(.fragment)'), own).forEach(function (card) {
                const first = card.firstElementChild;
                if (!first || !/^(UL|OL)$/.test(first.tagName) || first.nextElementSibling) return;
                const li = first.querySelector(':scope > li');
                if (!li || !li.classList.contains('fragment')) return;
                li.classList.remove('fragment');
                card.classList.add('fragment');
                const idx = li.getAttribute('data-fragment-index');
                if (idx !== null) { card.setAttribute('data-fragment-index', idx); li.removeAttribute('data-fragment-index'); }
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

            // a strip's click marks (grades replaced at reassessment,
            // {~~D3~>C3~~}) change together on one click
            let stripped = 0;
            Array.prototype.filter.call(sec.querySelectorAll('.md-strip'), own).forEach(function (strip, k) {
                const fs = strip.querySelectorAll('.fragment');
                if (fs.length < 2) return;
                stripped++;
                fs.forEach(function (f) { f.setAttribute('data-md-group', 'strip-' + k); });
            });

            // explicit order where needed
            const stepped = Array.prototype.filter.call(sec.querySelectorAll('[data-md-step]'), own);
            if (!markers.length && !stepped.length && !stripped) return;
            // @parse paired: the list just before the analysis names its
            // steps; item k arrives with step k (the last step takes any
            // items beyond the number of steps)
            const paired = new Map();
            Array.prototype.filter.call(sec.querySelectorAll('[data-md-paired]'), own).forEach(function (block) {
                let list = block.previousElementSibling;
                while (list && !/^(OL|UL)$/.test(list.tagName)) list = list.previousElementSibling;
                if (!list) return;
                list.querySelectorAll(':scope > li').forEach(function (li, k) {
                    li.classList.add('fragment');
                    paired.set(li, { block: block, k: k });
                });
            });
            const frags = Array.prototype.filter.call(sec.querySelectorAll('.fragment'), own);
            const groups = {}, blocks = new Map();
            let next = 0;
            frags.forEach(function (f) {
                if (paired.has(f)) return;
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
            paired.forEach(function (p, li) {
                const steps = Array.prototype.map.call(p.block.querySelectorAll('[data-md-step]'),
                    function (e) { return parseInt(e.getAttribute('data-md-step'), 10) || 0; });
                const last = steps.length ? Math.max.apply(null, steps) : 0;
                li.querySelectorAll('li.fragment').forEach(function (x) { x.classList.remove('fragment'); });
                li.setAttribute('data-fragment-index', (blocks.has(p.block) ? blocks.get(p.block) : next) + Math.min(p.k, last));
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
            under.mgaSource = leaves[j];
            Array.prototype.forEach.call(leaves[j].childNodes, function (n) { under.appendChild(n.cloneNode(true)); });
            under.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
            under.querySelectorAll('.fragment').forEach(function (e) { e.classList.remove('fragment'); });
            under.querySelectorAll('[data-id]').forEach(function (e) { e.removeAttribute('data-id'); });
            sec.insertBefore(under, sec.firstChild);
        });
    }

    /* Overlay panels move with the slide changes (SPEC 4.18, Q7):
       arriving from a slide that is not an overlay, the panel slides up
       (md-tr-arrive); between overlay slides it holds still (md-tr-hold);
       leaving for a slide that is not an overlay, forwards or back, the
       panel slides down and the faded copy returns to full strength.
       Reveal hides the slide being left at once (overlay slides have no
       transition), so the leaving panel and copy are drawn in a layer on
       the incoming slide for 0.6 s. If the incoming slide is the one
       the panel covered, its own content comes back to full strength
       under the panel; otherwise the copy returns to full strength and
       then gives way to the new slide (0.4 s). Section transitions are
       off for the change, so nothing slides under the layer. */
    const TR_LEAVE = 600, TR_HANDOVER = 400;
    function isOverlaySlide(s) { return !!(s && s.querySelector(':scope > .md-transcript.md-tr-overlay, :scope > .md-overlay-under')); }
    function clearTranscriptLeaving() {
        document.querySelectorAll('.reveal .md-tr-leaving').forEach(function (l) { l.remove(); });
        document.querySelectorAll('.reveal .slides section.md-tr-return, .reveal .slides section.md-tr-after')
            .forEach(function (s) { s.classList.remove('md-tr-return', 'md-tr-after'); });
    }
    function wireTranscriptOverlays(deck) {
        if (!document.querySelector('.reveal .md-tr-overlay')) return;
        const root = document.documentElement;
        const still = function () {
            return root.classList.contains('mga-final') || root.classList.contains('print-pdf') ||
                (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        };
        let timers = [];
        deck.on('beforeslidechange', function (e) {
            const from = deck.getCurrentSlide();
            const to = deck.getSlide(e.indexh, e.indexv);
            if (!from || !to || from === to) return;
            timers.forEach(clearTimeout); timers = [];
            clearTranscriptLeaving();
            from.classList.remove('md-tr-arrive', 'md-tr-hold');
            const fromOv = isOverlaySlide(from), toOv = isOverlaySlide(to);
            if (toOv) to.classList.add(fromOv ? 'md-tr-hold' : 'md-tr-arrive');
            // no section transition into or out of an overlay slide: the
            // copy and the layer below must not move
            const rv = document.querySelector('.reveal');
            if (fromOv !== toOv) {
                rv.classList.add('md-tr-cut');
                timers.push(setTimeout(function () { rv.classList.remove('md-tr-cut'); }, 50));
            }
            if (!fromOv || toOv || still()) return;
            const panel = from.querySelector(':scope > .md-tr-overlay');
            const under = from.querySelector(':scope > .md-overlay-under');
            if (!panel) return;
            const back = !!(under && under.mgaSource === to);
            const cs = getComputedStyle(from);
            const layer = document.createElement('div');
            layer.className = 'md-tr-leaving' + (back ? ' md-tr-back' : '');
            layer.setAttribute('aria-hidden', 'true');
            ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-size', 'line-height', 'text-align']
                .forEach(function (k) { layer.style.setProperty(k, cs.getPropertyValue(k)); });
            if (under && !back) {
                // the slide's own ground, and the copy's own colours (the
                // incoming slide may be dark)
                const bg = deck.getSlideBackground(from);
                const grounds = [bg && bg.querySelector('.slide-background-content'), bg,
                    document.querySelector('.reveal-viewport'), document.body].filter(Boolean)
                    .map(function (el) { return getComputedStyle(el); });
                const clear = function (c) { return /rgba\(.*, 0\)$|^transparent$/.test(c); };
                const withColour = grounds.find(function (g) { return !clear(g.backgroundColor); });
                const withImage = grounds.find(function (g) { return g.backgroundImage !== 'none'; });
                const paper = cs.getPropertyValue('--r-background-color').trim();
                layer.style.setProperty('--tr-ground', paper || (withColour ? withColour.backgroundColor : 'transparent'));
                if (withImage) {
                    layer.style.setProperty('--tr-ground-image', withImage.backgroundImage);
                    layer.style.setProperty('--tr-ground-size', withImage.backgroundSize);
                }
                const u = under.cloneNode(true);
                Array.prototype.forEach.call(under.children, function (c, k) {
                    const cs2 = getComputedStyle(c), d = u.children[k];
                    if (d) ['color', 'font-family', 'font-weight', 'font-variant-caps', 'letter-spacing']
                        .forEach(function (key) { d.style.setProperty(key, cs2.getPropertyValue(key)); });
                });
                [u].concat(Array.prototype.slice.call(u.querySelectorAll('[data-auto-animate-target]'))).forEach(function (x) {
                    x.removeAttribute('data-id'); x.removeAttribute('data-auto-animate-target');
                });
                layer.appendChild(u);
            }
            const p = panel.cloneNode(true);
            // auto-animate styles key on these attributes and would hold the clone still
            [p].concat(Array.prototype.slice.call(p.querySelectorAll('[data-id], [data-auto-animate-target]'))).forEach(function (x) {
                x.removeAttribute('data-id'); x.removeAttribute('data-auto-animate-target');
            });
            p.querySelectorAll('.fragment').forEach(function (x) {
                if (!x.classList.contains('visible')) x.remove(); else x.classList.remove('fragment');
            });
            layer.appendChild(p);
            to.appendChild(layer);
            to.classList.add(back ? 'md-tr-return' : 'md-tr-after');
            if (back) {
                timers.push(setTimeout(clearTranscriptLeaving, TR_LEAVE + 50));
            } else {
                timers.push(setTimeout(function () { layer.classList.add('md-tr-handover'); }, TR_LEAVE));
                timers.push(setTimeout(clearTranscriptLeaving, TR_LEAVE + TR_HANDOVER + 50));
            }
        });
    }

    /* ---------- morph (SPEC 6.3, phase 2b) ----------

       Reveal's auto-animate does the moving; this adds what PowerPoint's
       Morph does and reveal does not:
       - linkMorphSlides: @slide morph is written on the incoming slide
         only, so the slide before is marked here; slides with a menu of
         the same set, or morpheme words sharing pieces, morph with no
         markup. A slide newly marked here that would otherwise chain
         into a neighbour it should not morph with gets
         data-auto-animate-restart.
       - @slide morph words: every word of both slides becomes a piece.
       - mgaMorphMatcher (revconfig.js autoAnimateMatcher): an element
         that builds in on the new slide is left out of matching (unless
         its partner was itself a build, which reveal keeps shown);
         words and morpheme pieces move without scaling.
       - ghostUnmatched: elements of the old slide with no partner fade
         out over the morph instead of vanishing. */
    function leafSlides() {
        return Array.prototype.filter.call(document.querySelectorAll('.reveal .slides section'), function (s) {
            return !s.querySelector('section') && s.getAttribute('data-visibility') !== 'hidden';
        });
    }
    const WORD_SKIP = '[data-id], .md-word, code, pre, svg, script, style, aside, .md-mark, .md-menu, ' +
        '.md-overlay-under, .visually-hidden, .md-alt-missing, .md-video-cue, .md-pause, .directive-error';
    function wrapWords(sec, mode) {
        if (sec.getAttribute('data-md-wrapped') === mode) return;
        sec.setAttribute('data-md-wrapped', mode);
        const counts = {};
        // a slide wrapped before (another mode) gets its words re-keyed
        sec.querySelectorAll('.md-word').forEach(function (w) { w.setAttribute('data-id', wordId(w.textContent)); });
        const nodes = [];
        const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, null);
        let n;
        while ((n = walker.nextNode())) {
            if (!n.nodeValue.trim()) continue;
            if (n.parentElement.closest(WORD_SKIP)) continue;
            nodes.push(n);
        }
        nodes.forEach(function (node) {
            const frag = document.createDocumentFragment();
            node.nodeValue.split(/(\s+)/).forEach(function (tok) {
                if (!tok) return;
                if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
                const sp = document.createElement('span');
                sp.className = 'md-word';
                sp.textContent = tok;
                sp.setAttribute('data-id', wordId(tok));
                frag.appendChild(sp);
            });
            node.parentNode.replaceChild(frag, node);
        });
        function wordId(tok) {
            let key = tok;
            if (mode === 'loose') key = tok.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '') || tok;
            counts[key] = (counts[key] || 0) + 1;
            return 'w:' + key + ':' + counts[key];
        }
    }
    /* Text sitting beside pieces in the same element becomes a span, so
       it can fade out (old slide) or in (new slide) like any element */
    function wrapLoose(sec) {
        sec.querySelectorAll('.md-piece, .md-mw').forEach(function (p) {
            const parent = p.parentElement;
            if (!parent || parent.hasAttribute('data-md-loose')) return;
            parent.setAttribute('data-md-loose', '');
            Array.prototype.slice.call(parent.childNodes).forEach(function (c) {
                if (c.nodeType !== 3 || !c.nodeValue.trim()) return;
                const sp = document.createElement('span');
                sp.className = 'md-loose';
                parent.replaceChild(sp, c);
                sp.appendChild(c);
            });
        });
    }
    function linkMorphSlides() {
        const leaves = leafSlides();
        const orig = leaves.map(function (s) { return s.hasAttribute('data-auto-animate'); });
        const linked = leaves.map(function () { return false; });
        const menuOf = function (s) { const m = s.querySelector('.md-menu'); return m && m.getAttribute('data-md-menu'); };
        const pieceIds = function (s) {
            return Array.prototype.map.call(s.querySelectorAll('.md-mp[data-id]'), function (e) { return e.getAttribute('data-id'); });
        };
        for (let i = 1; i < leaves.length; i++) {
            const prev = leaves[i - 1], cur = leaves[i];
            let link = cur.classList.contains('md-morph');
            // the automatic links give way to an explicit @slide fade or
            // cut; corporate decks make none (PowerPoint's corporate decks
            // have no transitions: a tracker simply stays where it is)
            const auto = !cur.hasAttribute('data-transition') && !window.MGA_CORPORATE;
            if (!link && auto && menuOf(cur) && menuOf(cur) === menuOf(prev)) link = true;
            if (!link && auto && cur.querySelector('.md-mp')) {
                const a = pieceIds(prev);
                link = pieceIds(cur).some(function (id) { return a.indexOf(id) !== -1; });
            }
            const words = cur.getAttribute('data-md-words');
            if (words) { wrapWords(prev, words); wrapWords(cur, words); }
            if (!link) continue;
            linked[i] = true;
            prev.setAttribute('data-auto-animate', '');
            cur.setAttribute('data-auto-animate', '');
            cur.classList.add('md-morph-in');
            wrapLoose(prev); wrapLoose(cur);
        }
        for (let i = 1; i < leaves.length; i++) {
            if (linked[i] || !leaves[i].hasAttribute('data-auto-animate') || !leaves[i - 1].hasAttribute('data-auto-animate')) continue;
            if (!orig[i] || !orig[i - 1]) leaves[i].setAttribute('data-auto-animate-restart', '');
        }
    }

    let lastMorph = null;
    function mgaMorphMatcher(from, to) {
        const hiddenBuild = function (el, scope) {
            const f = el.closest('.fragment');
            return f && scope.contains(f) && !f.classList.contains('visible') ? f : null;
        };
        const inBuild = function (el, scope) { const f = el.closest('.fragment'); return f && scope.contains(f); };
        const pairs = this.getAutoAnimatePairs(from, to).filter(function (p) {
            if (p.to.closest('.md-mp-gone') || p.from.closest('.md-mp-gone')) return false;
            if (hiddenBuild(p.to, to) && !inBuild(p.from, from)) return false;
            return true;
        });
        pairs.forEach(function (p) {
            if (p.to.matches('.md-word, .md-mp, .md-loose')) p.options = Object.assign({}, p.options, { scale: false });
        });
        lastMorph = { from: from, to: to, pairs: pairs };
        return pairs;
    }
    window.mgaMorphMatcher = mgaMorphMatcher;

    const GHOST_SKIP = '.md-pause, aside, .notes, .visually-hidden, .md-alt-missing, .md-video-cue, .md-mark-step, ' +
        'script, style, .md-morph-ghosts, .fragment:not(.visible)';
    const GHOST_STYLES = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-caps', 'line-height',
        'letter-spacing', 'color', 'text-align', 'text-transform', 'background-color', 'border-radius'];
    function clearGhosts() {
        document.querySelectorAll('.reveal .md-morph-ghosts').forEach(function (g) { g.remove(); });
    }
    function ghostUnmatched(e) {
        clearGhosts();
        const from = e.fromSlide, to = e.toSlide;
        if (!lastMorph || lastMorph.from !== from || lastMorph.to !== to) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const matched = lastMorph.pairs.map(function (p) { return p.from; });
        const fr = from.getBoundingClientRect();
        const scale = from.offsetWidth ? fr.width / from.offsetWidth : 1;
        if (!fr.width) return;
        const layer = document.createElement('div');
        layer.className = 'md-morph-ghosts';
        layer.setAttribute('aria-hidden', 'true');
        (function walk(el) {
            Array.prototype.forEach.call(el.children, function (c) {
                if (matched.indexOf(c) !== -1) return;
                if (matched.some(function (m) { return c.contains(m); })) { walk(c); return; }
                if (c.matches(GHOST_SKIP)) return;
                const r = c.getBoundingClientRect();
                if (r.width < 2 || r.height < 2) return;
                const cs = getComputedStyle(c);
                if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
                const g = c.cloneNode(true);
                g.removeAttribute('id');
                g.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); });
                g.querySelectorAll('[data-id]').forEach(function (x) { x.removeAttribute('data-id'); });
                g.removeAttribute('data-id');
                g.querySelectorAll('.fragment:not(.visible)').forEach(function (x) { x.remove(); });
                g.querySelectorAll('.fragment').forEach(function (x) { x.classList.remove('fragment'); });
                g.classList.remove('fragment');
                GHOST_STYLES.forEach(function (k) { g.style.setProperty(k, cs.getPropertyValue(k)); });
                // the ancestors as shells with no box of their own, so
                // rules that depend on them (a tab in a menu) still apply
                let top = g;
                for (let a = c.parentElement; a && a !== from; a = a.parentElement) {
                    const shell = a.cloneNode(false);
                    shell.removeAttribute('id');
                    shell.removeAttribute('data-id');
                    shell.classList.remove('fragment');
                    shell.style.cssText = 'display: contents';
                    shell.appendChild(top);
                    top = shell;
                }
                g.style.position = 'absolute';
                g.style.boxSizing = 'border-box';
                g.style.margin = '0';
                g.style.left = ((r.left - fr.left) / scale) + 'px';
                g.style.top = ((r.top - fr.top) / scale) + 'px';
                g.style.width = (r.width / scale) + 'px';
                g.style.height = (r.height / scale) + 'px';
                g.style.transform = 'none';
                layer.appendChild(top);
            });
        })(from);
        if (!layer.children.length) return;
        to.appendChild(layer);
        const dur = parseFloat(to.getAttribute('data-auto-animate-duration')) || (window.Reveal ? Reveal.getConfig().autoAnimateDuration : 1) || 1;
        layer.style.transition = 'opacity ' + (dur * 0.6).toFixed(2) + 's ease';
        requestAnimationFrame(function () { requestAnimationFrame(function () { layer.style.opacity = '0'; }); });
        setTimeout(function () { layer.remove(); }, dur * 1000 + 150);
    }

    /* @menu: the heading after a menu with one lit item (or a lit arrow)
       takes a stable id, so consecutive menu slides move it along by
       morph, and sits under that item (positionMenuHeads, measured) */
    function markMenuHeads() {
        document.querySelectorAll('.reveal .slides .md-menu[data-md-lit], .reveal .slides .md-menu[data-md-arrow]').forEach(function (menu) {
            if (menu.classList.contains('md-menu-centre')) return;
            const h = menu.nextElementSibling;
            if (!h || !/^H[1-3]$/.test(h.tagName)) return;
            h.classList.add('md-menu-head');
            h.setAttribute('data-id', 'md-menu-head-' + menu.getAttribute('data-md-menu'));
            if (menu.getAttribute('data-md-heading') === 'build') h.classList.add('fragment');
        });
    }
    function positionMenuHeads() {
        let prevStrip = null;
        // the slide shown before this one (the previous sibling, or the
        // last slide of the stack before)
        const prevSlideOf = function (sec) {
            let p = sec.previousElementSibling;
            while (p && p.tagName !== 'SECTION') p = p.previousElementSibling;
            if (!p && sec.parentElement.tagName === 'SECTION') {
                p = sec.parentElement.previousElementSibling;
                while (p && p.tagName !== 'SECTION') p = p.previousElementSibling;
            }
            if (p && p.querySelector(':scope > section')) {
                const kids = p.querySelectorAll(':scope > section'); p = kids[kids.length - 1];
            }
            return p;
        };
        document.querySelectorAll('.reveal .slides .md-menu-head').forEach(function (h) {
            const menu = h.previousElementSibling;
            if (!menu || !menu.matches('.md-menu')) return;
            h.style.removeProperty('margin-left');
            h.style.removeProperty('left');
            h.style.removeProperty('transform');
            const item = menu.hasAttribute('data-md-arrow')
                ? menu.querySelectorAll('.md-menu-arrow')[+menu.getAttribute('data-md-arrow')]
                : menu.querySelectorAll('.md-menu-item')[+menu.getAttribute('data-md-lit')];
            const sec = h.closest('section');
            // layout positions (offsetLeft), not screen rectangles: while a
            // morph or a fade is running the rectangles carry its
            // transforms, and a heading placed then sat off its item
            const offsetIn = function (el) {
                let x = 0;
                while (el && el !== sec) { x += el.offsetLeft; el = el.offsetParent; }
                return x;
            };
            if (getComputedStyle(h).position === 'absolute') {
                // a heading the form places under a strip's lit item
                // (Thumb Index): centred under the item, kept inside the
                // slide's side margins. Set here in pixels: the form's
                // percentage translate inside min()/max() came out as none
                // on most slides, leaving the heading starting at the stem
                if (!item || !menu.matches('.md-menu-strip') || !sec) return;
                const restoreA = unhideForMeasuring(h);
                const pad = parseFloat(getComputedStyle(h).getPropertyValue('--tb-pad')) || 0;
                const w = h.offsetWidth, W = sec.clientWidth;
                const c = offsetIn(item) + item.offsetWidth / 2;
                let x = Math.max(pad, Math.min(W - pad - w, c - w / 2));
                // the same item lit on the slide before, morphing in: the
                // heading keeps that slide's left edge, so a heading that
                // changes (Abbreviation to Abbrev.) changes in place
                const key = menu.getAttribute('data-md-menu') + ':' + menu.getAttribute('data-md-lit');
                if (prevStrip && prevStrip.key === key && sec.hasAttribute('data-auto-animate') &&
                    prevStrip.sec === prevSlideOf(sec)) {
                    x = Math.max(pad, Math.min(W - pad - w, prevStrip.x));
                }
                prevStrip = { key: key, x: x, sec: sec };
                h.style.left = x.toFixed(1) + 'px';
                h.style.transform = 'none';
                restoreA();
                return;
            }
            if (!item) return;
            const restore = unhideForMeasuring(h);
            const avail = h.parentElement.clientWidth -
                (parseFloat(getComputedStyle(h.parentElement).paddingLeft) || 0) - (parseFloat(getComputedStyle(h.parentElement).paddingRight) || 0);
            const hw = h.offsetWidth;
            const hx = offsetIn(h), ix = offsetIn(item);
            const left = ix - hx, right = ix + item.offsetWidth - hx;
            const centre = (left + right) / 2;
            // aligned with the item's nearer edge; a form that sets
            // --menu-head-align: centre centres it under the item instead
            const centred = getComputedStyle(h).getPropertyValue('--menu-head-align').trim() === 'centre';
            let ml = centred ? centre - hw / 2 : centre < avail / 2 ? left : right - hw;
            ml = Math.max(0, Math.min(avail - hw, ml));
            h.style.marginLeft = ml.toFixed(1) + 'px';
            restore();
        });
    }
    window.positionMenuHeads = positionMenuHeads;

    /* @marks: show each mark in its state for the slide's current click
       (the steps are hidden fragments; a mark moved by a later line takes
       that line's place and colour). The export shows the final state. */
    function applyMarks(sec) {
        if (!sec) return;
        const final = document.documentElement.classList.contains('mga-final');
        sec.querySelectorAll('.md-marks-frame').forEach(function (frame) {
            let cur = -1;
            frame.querySelectorAll('.md-mark-step').forEach(function (st) {
                if (st.classList.contains('visible')) cur = Math.max(cur, +st.getAttribute('data-md-step'));
            });
            if (final) cur = Infinity;
            frame.querySelectorAll('.md-mark').forEach(function (mk) {
                const states = JSON.parse(mk.getAttribute('data-md-states'));
                let st = null;
                states.forEach(function (x) { if (x.s <= cur) st = x; });
                mk.classList.toggle('is-off', !st);
                const use = st || states[0];
                mk.setAttribute('style', markStyle(mk.className.match(/md-mark-(\w+)/)[1], use));
                const t = mk.querySelector('.md-mark-text');
                if (t) {
                    const html = use.t || '';
                    if (t.innerHTML !== html) t.innerHTML = html;
                    if (!t.classList.contains('md-mark-free')) t.className = 'md-mark-text md-mark-' + (use.pos || 'above');
                }
            });
            const box = frame.querySelector('.md-marks-box[data-md-zooms]');
            if (box) {
                let z = null;
                JSON.parse(box.getAttribute('data-md-zooms')).forEach(function (x) { if (x.s <= cur) z = x; });
                if (z) box.style.cssText += ';' + zoomStyle(z);
                else ['--zx', '--zy', '--zk'].forEach(function (k) { box.style.removeProperty(k); });
            }
        });
    }
    function wireMarks(deck) {
        const sync = function (e) {
            (e.fragments || [e.fragment]).forEach(function (f) {
                if (f && f.classList.contains('md-mark-step')) applyMarks(f.closest('section'));
            });
        };
        deck.on('fragmentshown', sync);
        deck.on('fragmenthidden', sync);
        deck.on('slidechanged', function (e) { applyMarks(e.currentSlide); });
        deck.on('ready', function () {
            document.querySelectorAll('.reveal .slides .md-marks-slide').forEach(applyMarks);
        });
        // a print view with a page per build: each page is a copy of the
        // slide with its own builds shown, so each takes its own marks
        deck.on('pdf-ready', function () {
            document.querySelectorAll('.reveal .slides .md-marks-slide').forEach(applyMarks);
        });
        document.querySelectorAll('.reveal .slides .md-marks-slide').forEach(applyMarks);
    }

    /* @video: the hidden cue fragment plays the video once from the start
       (it stops on its last frame); stepping back stops it and rewinds */
    function wireVideos(deck) {
        // export and print views: every video shows its poster
        if (document.documentElement.classList.contains('mga-final') || (window.MGA_EXPORT || {}).print) {
            document.querySelectorAll('.reveal video[data-autoplay]').forEach(function (v) { v.removeAttribute('data-autoplay'); });
            // the cue that plays a video changes nothing on paper
            document.querySelectorAll('.reveal .md-video-cue').forEach(function (c) { c.classList.remove('fragment'); });
            return;
        }
        const each = function (e, fn) {
            (e.fragments || [e.fragment]).forEach(function (f) {
                if (!f || !f.classList.contains('md-video-cue')) return;
                const v = f.closest('section').querySelector('video[data-md-video="' + f.getAttribute('data-md-video') + '"]');
                if (v) fn(v);
            });
        };
        deck.on('fragmentshown', function (e) {
            each(e, function (v) {
                try { v.currentTime = 0; } catch (x) {}
                const p = v.play();
                if (p && p.catch) p.catch(function () {});
            });
        });
        deck.on('fragmenthidden', function (e) {
            each(e, function (v) { v.pause(); try { v.currentTime = 0; } catch (x) {} });
        });
    }

    /* bleed on @image-left/right: how far the screen reaches past the
       slide on each side, in slide pixels (refitSlides keeps it current) */
    function setBleedExtents() {
        const slides = document.querySelector('.reveal .slides');
        if (!slides || !window.Reveal || !Reveal.getScale) return;
        const s = Reveal.getScale() || 1;
        const c = Reveal.getConfig();
        // a print view: the page is the slide plus reveal's margin
        if (Reveal.isPrintView && Reveal.isPrintView()) {
            slides.style.setProperty('--bleed-x', (Math.floor(c.width * (1 + c.margin)) - c.width) / 2 + 'px');
            slides.style.setProperty('--bleed-y', (Math.floor(c.height * (1 + c.margin)) - c.height) / 2 + 'px');
            return;
        }
        const viewport = document.querySelector('.reveal').getBoundingClientRect();
        slides.style.setProperty('--bleed-x', Math.max(0, (viewport.width / s - c.width) / 2).toFixed(1) + 'px');
        slides.style.setProperty('--bleed-y', Math.max(0, (viewport.height / s - c.height) / 2).toFixed(1) + 'px');
    }
    window.setBleedExtents = setBleedExtents;

    /* ?coords: clicking an image (or a @marks image) shows the point's
       position in percent of the image, logs it and copies it, for
       writing @marks lines and @zoom focus= */
    if (/[?&]coords\b/.test(location.search) && typeof document.addEventListener === 'function') {
        document.documentElement.classList.add('mga-coords');
        document.addEventListener('click', function (e) {
            const t = e.target.closest && (e.target.closest('.md-marks-box') ||
                (e.target.tagName === 'IMG' && e.target.closest('.reveal .slides') ? e.target : null));
            if (!t) return;
            const r = t.getBoundingClientRect();
            const fx = function (v) { return (Math.round(v * 10) / 10).toString(); };
            const txt = fx((e.clientX - r.left) / r.width * 100) + ',' + fx((e.clientY - r.top) / r.height * 100);
            let tip = document.getElementById('mga-coords-tip');
            if (!tip) { tip = document.createElement('div'); tip.id = 'mga-coords-tip'; document.body.appendChild(tip); }
            tip.textContent = txt;
            tip.style.left = (e.clientX + 12) + 'px';
            tip.style.top = (e.clientY + 12) + 'px';
            console.log('[coords] ' + txt + '  (' + (t.getAttribute('src') || (t.querySelector('img') || {}).getAttribute && t.querySelector('img').getAttribute('src')) + ')');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(function () {});
            e.stopPropagation();
        }, true);
    }

    /* ---------- corporate mode (SPEC 8, phase 4) ----------

       corpWrapSlides (MgaBuilds.init, before the builds) gives each
       ordinary slide the template's furniture: the logo block (CSS), the
       title placeholder (the heading), one body box for everything else,
       the takeaway panel built from the slide's @note lines, and the
       source line. The rest run from refitSlides after layout. */
    const CORP_BLOCKS = '.md-cards, .md-table, table, .md-stats, .corp-part, .md-menu, .md-split, figure, .md-fullimg';
    function corpWrapSlides() {
        const corp = window.MGA_CORPORATE;
        if (!corp) return;
        const rootPh = corp.body === 'placeholder';
        document.querySelectorAll('.reveal .slides section').forEach(function (sec) {
            if (sec.querySelector('section')) return;
            if (sec.classList.contains('corp-title') || sec.classList.contains('corp-content') ||
                sec.classList.contains('corp-bleed')) return;
            sec.setAttribute('data-autofit', 'off');
            // image slides (md-fill) keep their content in an inner column
            const inner = sec.querySelector(':scope > .md-fill-inner');
            if (inner) {
                while (inner.firstChild) sec.insertBefore(inner.firstChild, inner);
                inner.remove();
            }
            const kids = Array.prototype.slice.call(sec.childNodes);
            const head = kids.find(function (n) { return n.nodeType === 1 && /^H[12]$/.test(n.tagName); });
            const bgImage = sec.getAttribute('data-background-image');
            // a full-bleed image with no heading covers the slide, logo included
            if (!head && (sec.classList.contains('md-fill') || bgImage)) { sec.classList.add('corp-bleed'); return; }
            // with a heading, an @image fills the body below the title
            if (bgImage) {
                const fig = document.createElement('figure');
                fig.className = 'corp-image';
                const img = document.createElement('img');
                img.src = bgImage;
                const alt = sec.querySelector(':scope > .visually-hidden');
                img.alt = alt ? alt.textContent.trim() : '';
                if (alt) alt.remove();
                if (sec.getAttribute('data-background-size') === 'cover') img.style.objectFit = 'cover';
                fig.appendChild(img);
                sec.appendChild(fig);
                ['data-background-image', 'data-background-size', 'data-background-position'].forEach(function (a) { sec.removeAttribute(a); });
            }
            sec.classList.add('corp-content');
            const text = parseFloat(sec.getAttribute('data-corp-text'));
            if (text > 0) sec.style.setProperty('--corp-text', (2 * text) + 'px');
            const body = document.createElement('div');
            body.className = 'corp-body';
            const notes = [];
            kids.forEach(function (n) {
                if (n === head) return;
                if (n.nodeType === 3 && !n.textContent.trim()) return;
                if (n.nodeType === 1 && (n.tagName === 'ASIDE' || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' ||
                    n.classList.contains('md-source') || n.classList.contains('md-overlay-under'))) return;
                if (n.nodeType === 1 && n.classList.contains('md-note')) { notes.push(n); return; }
                body.appendChild(n);
            });
            // re-read: the image figure was appended after the children list
            if (bgImage) { const f = sec.querySelector(':scope > figure.corp-image'); if (f) body.appendChild(f); }
            sec.appendChild(body);
            if (notes.length) {
                const panel = document.createElement('div');
                panel.className = 'corp-note';
                notes.forEach(function (n) {
                    const y = n.style.getPropertyValue('--corp-y'), h = n.style.getPropertyValue('--corp-h');
                    if (y) { panel.style.top = y; panel.style.bottom = 'auto'; }
                    if (h) { panel.style.height = h; panel.style.minHeight = '0'; }
                    if (n.classList.contains('fragment') && notes.length === 1) {
                        // a built note: the whole panel arrives
                        n.classList.remove('fragment');
                        panel.classList.add('fragment');
                        Array.prototype.forEach.call(n.attributes, function (a) {
                            if (/^data-fragment-index$/.test(a.name)) panel.setAttribute(a.name, a.value);
                        });
                    }
                    panel.appendChild(n);
                });
                sec.appendChild(panel);
                sec.classList.add('corp-has-note');
                // the body stops 24 px above the panel
                if (panel.style.top) body.style.bottom = (1080 - parseFloat(panel.style.top) + 24) + 'px';
            }
            const y = parseFloat(sec.getAttribute('data-corp-y')), gap = parseFloat(sec.getAttribute('data-corp-gap'));
            if (y >= 0) sec.style.setProperty('--corp-top', y + 'px');
            if (gap >= 0) body.style.setProperty('--corp-flow-gap', gap + 'px');
            // a text box drawn as a roundRect: its text sits this far inside
            const inset = parseFloat(sec.getAttribute('data-corp-inset'));
            if (inset >= 0) body.style.setProperty('--corp-inset', inset + 'px');
            // PowerPoint breaks a long address after a hyphen; Chromium will
            // not inside a URL-like run, so offer it the same break
            sec.querySelectorAll('a').forEach(function (a) {
                const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
                let t;
                while ((t = w.nextNode())) t.textContent = t.textContent.replace(/(\w-)(?=\w)/g, '$1\u200B');
            });
            if (body.querySelector(CORP_BLOCKS)) sec.classList.add('corp-has-blocks');
            body.querySelectorAll('.md-table[data-corp-rows]').forEach(function (t) {
                const hs = t.getAttribute('data-corp-rows').split(',').map(parseFloat);
                t.querySelectorAll('tr').forEach(function (tr, k) { if (hs[k] > 0) tr.style.height = hs[k] + 'px'; });
            });
            const ph = (rootPh && !sec.classList.contains('md-corp-textbox')) || sec.classList.contains('md-corp-placeholder');
            if (ph && !sec.classList.contains('corp-has-blocks')) body.classList.add('corp-ph');
        });
    }

    /* PowerPoint's roundRect (adj 3553): the corner radius is 3.553% of the
       box's shorter side, so it changes with each box (a fixed CSS radius
       cannot), and the text rectangle is inset a further 0.29289 x radius
       inside the shape's own insets */
    const CORP_ROUND = '.md-cards .md-card.md-card-filled, .md-stats .md-card, .corp-note, .corp-part, .md-cards.md-style-strip .md-strip';
    function corpRadii() {
        if (!window.MGA_CORPORATE) return;
        document.querySelectorAll('.reveal .slides section.corp-content').forEach(function (sec) {
            const restore = unhideForMeasuring(sec);
            sec.querySelectorAll(CORP_ROUND).forEach(function (el) {
                el.style.borderRadius = '';
                el.style.padding = '';
                // style=header: the header is the shape, the card has none
                if (el.closest('.md-style-header')) return;
                // one radius for every rounded shape (Marc, 1 November;
                // PowerPoint's 3.553% of each shape's shorter side varied)
                const fixed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--corp-radius'));
                const r = fixed > 0 ? Math.min(fixed, Math.min(el.offsetWidth, el.offsetHeight) / 2) : 0.03553 * Math.min(el.offsetWidth, el.offsetHeight);
                if (!r) return;
                const cs = getComputedStyle(el), k = 0.29289 * r;
                el.style.borderRadius = r.toFixed(2) + 'px';
                if (el.closest('.md-style-bar')) return;
                el.style.padding = ['Top', 'Right', 'Bottom', 'Left'].map(function (side) {
                    return (parseFloat(cs['padding' + side]) + k).toFixed(2) + 'px';
                }).join(' ');
            });
            restore();
        });
    }

    /* Hand-written decks: text that overflows a card shrinks, 1 pt at a
       time, to 70% of the preset size; every card in the block takes the
       same size. A block or card with a converter's text=, h= or y= is
       left alone. */
    /* How far a corporate slide's body may run past its box: as in
       PowerPoint, text may run on below the body (its text boxes are
       taller than the body box: Session 1 slide 3), to 24 px from the
       slide's foot; with a takeaway panel, not at all. */
    function corpBodyOver(sec, body) {
        if (!body) return false;
        const slack = sec.classList.contains('corp-has-note') ? 0 :
            Math.max(0, sec.offsetHeight - body.offsetTop - body.clientHeight - 24);
        return body.scrollHeight > body.clientHeight + slack + 1;
    }

    /* @slide shrink=N: how far a slide may shrink to fit (N percent) */
    function fitFloor(sec, usual) {
        const n = parseFloat(sec.getAttribute('data-fit-floor'));
        return n >= 40 && n <= 100 ? n / 100 : usual;
    }

    function corpFitCards() {
        if (!window.MGA_CORPORATE) return;
        // every card block on a slide shrinks together (phase 6b: a band
        // above the cards gives up its space too, ETS 9 and 12)
        document.querySelectorAll('.reveal .slides section.corp-content').forEach(function (sec) {
            // a converter's numbers (text=, h=, y=) mean the sizes are PowerPoint's
            const conv = /--cards-(text|h):|--corp-y/;
            const blocks = Array.prototype.filter.call(sec.querySelectorAll('.md-cards'), function (block) {
                return !conv.test(block.getAttribute('style') || '');
            });
            const cards = [];
            blocks.forEach(function (block) {
                Array.prototype.forEach.call(block.children, function (c) {
                    if (c.classList.contains('md-card') && !conv.test(c.getAttribute('style') || '')) cards.push(c);
                });
            });
            sec.classList.remove('md-overflow');
            if (!cards.length) return;
            const restore = unhideForMeasuring(sec);
            cards.forEach(function (c) { c.style.removeProperty('font-size'); c.style.removeProperty('--cards-fit-head'); });
            // the slide's own text beside the cards (a lead, notes below)
            // shrinks with them, through --corp-text
            const body = sec.querySelector(':scope > .corp-body');
            const setText = parseFloat(sec.getAttribute('data-corp-text'));
            if (setText > 0) sec.style.setProperty('--corp-text', (2 * setText) + 'px'); else sec.style.removeProperty('--corp-text');
            const leadEl = body && Array.prototype.find.call(body.children, function (el) { return /^(P|UL|OL)$/.test(el.tagName); });
            // tables beside the cards (ETS 7) too, unless a converter set their rows
            const tables = body ? Array.prototype.filter.call(body.querySelectorAll('table'), function (t) {
                return !t.closest('[data-corp-rows]');
            }) : [];
            tables.forEach(function (t) { t.style.removeProperty('font-size'); t.style.removeProperty('--cc-table-row'); });
            const tBase = tables.map(function (t) {
                return [parseFloat(getComputedStyle(t).fontSize), parseFloat(getComputedStyle(t).getPropertyValue('--cc-table-row')) || 0];
            });
            const lead = leadEl ? parseFloat(getComputedStyle(leadEl).fontSize) : 0;
            const bodyOver = function () { return corpBodyOver(sec, body); };
            const bases = cards.map(function (c) { return parseFloat(getComputedStyle(c).fontSize); });
            // headings shrink with the text (only where no converter set them)
            const heads = cards.map(function (c) {
                const h = c.querySelector(':scope > h3, :scope > .md-card-head > h3');
                return h && !/--cards-head/.test(c.getAttribute('style') || '') ? parseFloat(getComputedStyle(h).fontSize) : 0;
            });
            const over = function () { return bodyOver() || cards.some(function (c) { return c.scrollHeight > c.clientHeight + 1; }); };
            // 1 pt at a time on the first card's size, to 70% (or @slide shrink=)
            const step = 2 / bases[0];
            const floor = fitFloor(sec, 0.7);
            let f = 1;
            while (over() && f - step >= floor - 1e-9) {
                f -= step;
                cards.forEach(function (c, i) {
                    c.style.fontSize = (bases[i] * f).toFixed(2) + 'px';
                    if (heads[i]) c.style.setProperty('--cards-fit-head', (heads[i] * f).toFixed(2) + 'px');
                });
                if (lead) sec.style.setProperty('--corp-text', (lead * f).toFixed(2) + 'px');
                tables.forEach(function (t, i) {
                    t.style.fontSize = (tBase[i][0] * f).toFixed(2) + 'px';
                    if (tBase[i][1]) t.style.setProperty('--cc-table-row', (tBase[i][1] * f).toFixed(2) + 'px');
                });
            }
            if (over()) {
                console.warn('[corporate] card text still overflows at ' + Math.round(floor * 100) + '%: "' +
                    ((sec.querySelector('h1, h2') || {}).textContent || '').trim() + '"');
                sec.classList.add('md-overflow');
            }
            restore();
        });
    }

    /* Text slides (no cards, table or statistics) whose text runs past
       the body shrink too, 1 pt at a time to 70% of their size, through
       --corp-text (phase 6b: Dumfries 23, 30 to 33); autofit is off on
       corporate slides. */
    function corpFitText() {
        if (!window.MGA_CORPORATE) return;
        document.querySelectorAll('.reveal .slides section.corp-content').forEach(function (sec) {
            const body = sec.querySelector(':scope > .corp-body');
            if (!body || body.querySelector('.md-cards, table, .md-stats, figure, [data-corp-top]')) return;
            const restore = unhideForMeasuring(sec);
            sec.style.removeProperty('--corp-text');
            body.style.removeProperty('--corp-para-after');
            body.style.removeProperty('gap');
            const after = parseFloat(getComputedStyle(body).getPropertyValue('--corp-para-after')) || 0;
            const gap = parseFloat(getComputedStyle(body).rowGap) || 0;
            const set = parseFloat(sec.getAttribute('data-corp-text'));
            if (set > 0) sec.style.setProperty('--corp-text', (2 * set) + 'px');
            const base = parseFloat(getComputedStyle(body).fontSize);
            const over = function () { return corpBodyOver(sec, body); };
            let size = base;
            const floor = fitFloor(sec, 0.7);
            while (over() && size - 2 >= base * floor - 1e-9) {
                size -= 2;
                sec.style.setProperty('--corp-text', size + 'px');
                // the space between paragraphs shrinks with the text
                if (after) body.style.setProperty('--corp-para-after', (after * size / base).toFixed(2) + 'px');
                if (gap) body.style.gap = (gap * size / base).toFixed(2) + 'px';
            }
            if (over()) {
                console.warn('[corporate] text still overflows at ' + Math.round(floor * 100) + '%: "' +
                    ((sec.querySelector('h1, h2') || {}).textContent || '').trim() + '"');
                sec.classList.add('md-overflow');
            }
            restore();
        });
    }

    /* PowerPoint for Mac lays each glyph's advance out in whole 1/8 pt
       (0.25 px here), so its line widths differ from the browser's by up
       to a pixel or two over a long line, and a line that fits in one can
       wrap in the other. For every text block on a corporate slide this
       works out where PowerPoint would break (greedy, breaking at spaces
       and after hyphens, trailing spaces hanging), then nudges the
       block's width, usually by a fraction of a pixel, so that the
       browser breaks in the same places. Text is left-aligned (or
       centred, where the nudge is split), so the nudge is invisible. */
    let corpCanvas = null;
    function corpLineBreaks() {
        if (!window.MGA_CORPORATE) return;
        corpCanvas = corpCanvas || document.createElement('canvas').getContext('2d');
        const ctx = corpCanvas;
        if ('fontKerning' in ctx) ctx.fontKerning = 'none';
        // measured afresh each pass: one that runs before the webfonts
        // arrive measures the fallback font
        const advCache = {};
        function adv(font, ch) {
            const k = font + '\u0000' + ch;
            if (!(k in advCache)) { ctx.font = font; advCache[k] = ctx.measureText(ch).width; }
            return advCache[k];
        }
        const isBlock = function (el) { return !/^inline/.test(getComputedStyle(el).display); };
        document.querySelectorAll('.reveal section.corp-content, .reveal section.corp-title').forEach(function (sec) {
            const blocks = new Map();
            const w = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
            let n;
            while ((n = w.nextNode())) {
                if (!n.textContent.trim()) continue;
                let b = n.parentElement;
                while (b !== sec && !isBlock(b)) b = b.parentElement;
                if (b === sec || b.closest('aside')) continue;
                if (!blocks.has(b)) blocks.set(b, []);
                blocks.get(b).push(n);
            }
            const restore = unhideForMeasuring(sec);
            blocks.forEach(function (nodes, el) {
                if ('corpNudge' in el.dataset) {
                    el.style[el.dataset.corpNudgeProp] = el.dataset.corpNudge;
                    delete el.dataset.corpNudge; delete el.dataset.corpNudgeProp;
                }
                const cs = getComputedStyle(el);
                if (cs.whiteSpace !== 'normal' || cs.display === 'flex' || cs.display === 'grid') return;
                // the float width (clientWidth is rounded to a whole pixel)
                let avail = parseFloat(cs.width);
                if (cs.boxSizing === 'border-box' || cs.display === 'table-cell') avail -= parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) +
                    parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
                if (!(avail > 0)) return;
                const chars = [];
                nodes.forEach(function (t) {
                    const ps = getComputedStyle(t.parentElement);
                    const font = ps.fontStyle + ' ' + ps.fontWeight + ' ' + ps.fontSize + ' ' + ps.fontFamily;
                    for (const ch of t.textContent) {
                        const c = /\s/.test(ch) ? ' ' : ch;
                        if (c === ' ' && (!chars.length || chars[chars.length - 1].c === ' ')) continue;
                        chars.push({ c: c, a: adv(font, c) });
                    }
                });
                while (chars.length && chars[chars.length - 1].c === ' ') chars.pop();
                while (chars.length && chars[0].c === ' ') chars.shift();
                const segs = [];
                let cur = { w: 0, q: 0, sp: 0, spq: 0 };
                chars.forEach(function (ch, i) {
                    const q = Math.round(ch.a * 4) / 4;
                    if (ch.c === ' ') { cur.sp = ch.a; cur.spq = q; segs.push(cur); cur = { w: 0, q: 0, sp: 0, spq: 0 }; return; }
                    cur.w += ch.a; cur.q += q;
                    const next = chars[i + 1];
                    if (ch.c === '-' && i > 0 && next && next.c !== ' ' && /\w/.test(chars[i - 1].c)) {
                        segs.push(cur); cur = { w: 0, q: 0, sp: 0, spq: 0 };
                    }
                });
                if (cur.w) segs.push(cur);
                if (segs.length < 2) return;
                // a list item's text starts after its hanging indent
                const lines = [];
                let line = [], q = 0;
                segs.forEach(function (sg) {
                    if (line.length && q + sg.q > avail) { lines.push(line); line = []; q = 0; }
                    line.push(sg); q += sg.q + sg.spq;
                });
                lines.push(line);
                let lo = 0, hi = Infinity;
                lines.forEach(function (L, i) {
                    let wd = 0;
                    L.forEach(function (sg, k) { wd += sg.w + (k < L.length - 1 ? sg.sp : 0); });
                    lo = Math.max(lo, wd);
                    if (i < lines.length - 1) hi = Math.min(hi, wd + L[L.length - 1].sp + lines[i + 1][0].w);
                });
                if (avail >= lo && avail < hi) return;
                if (!(lo < hi)) return;
                // Chromium lets a line overflow by a few 1/64 px, so stay a
                // quarter pixel inside the range where possible
                const eps = Math.min(0.25, (hi - lo) / 2);
                const delta = (avail < lo ? lo + eps : hi - eps) - avail;
                const centred = cs.textAlign === 'center';
                const prop = centred ? 'paddingLeft' : cs.display === 'table-cell' ? 'paddingRight' :
                    (cs.position === 'absolute' ? 'width' : 'marginRight');
                el.dataset.corpNudge = el.style[prop];
                el.dataset.corpNudgeProp = prop;
                if (prop === 'width') el.style.width = (parseFloat(cs.width) + delta).toFixed(3) + 'px';
                else if (prop === 'marginRight') el.style.marginRight = (parseFloat(cs.marginRight) - delta).toFixed(3) + 'px';
                else if (prop === 'paddingRight') el.style.paddingRight = (parseFloat(cs.paddingRight) - delta).toFixed(3) + 'px';
                else el.style.paddingLeft = (parseFloat(cs.paddingLeft) - delta).toFixed(3) + 'px';
            });
            restore();
        });
    }

    /* PowerPoint for Mac puts the first baseline of a text box the font's
       ascent below the top with the ascent rounded to a whole point
       (0.94185 x size: 22.6 pt at 24 pt becomes 23 pt), while Chromium
       rounds ascent and descent to whole pixels. The first block of each
       box is moved (position: relative, so nothing after it moves) to
       PowerPoint's baseline; in practice 22 to 32 pt first lines come
       down 1 px. */
    function corpFirstBaselines() {
        if (!window.MGA_CORPORATE) return;
        const firsts = [];
        document.querySelectorAll('.reveal .md-cards .md-card, .reveal .corp-note, .reveal .corp-part, .reveal .corp-band').forEach(function (box) {
            let el = box.firstElementChild;
            while (el && (el.classList.contains('md-card-tag') || el.tagName === 'I')) el = el.nextElementSibling;
            if (el && el.classList.contains('md-note')) el = el.firstElementChild || el;
            if (el && /^(UL|OL)$/.test(el.tagName)) el = el.firstElementChild;
            if (el) firsts.push(el);
        });
        document.querySelectorAll('.reveal .corp-body:not(.corp-ph) > p:first-child, .reveal .corp-body:not(.corp-ph) > :is(ul, ol):first-child > li:first-child').forEach(function (el) {
            firsts.push(el);
        });
        firsts.forEach(function (el) {
            el.style.top = '';
            const restore = unhideForMeasuring(el);
            const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let t;
            while ((t = w.nextNode()) && !t.textContent.trim());
            if (t) {
                const i = t.textContent.search(/\S/);
                const r = document.createRange();
                r.setStart(t, i); r.setEnd(t, i + 1);
                const rc = r.getClientRects()[0];
                const cs = getComputedStyle(el);
                const box = el.getBoundingClientRect();
                const k = el.offsetHeight ? box.height / el.offsetHeight : 1;     // reveal's scale
                const fs = parseFloat(getComputedStyle(t.parentElement).fontSize);
                if (rc && k > 0 && fs) {
                    // Chromium's glyph box starts the whole-pixel ascent above the baseline
                    const actual = (rc.top - box.top) / k - parseFloat(cs.paddingTop) - parseFloat(cs.borderTopWidth) + Math.round(0.94185 * fs);
                    const target = Math.round(0.94185 * fs / 2) * 2;
                    const d = target - actual;
                    if (Math.abs(d) > 0.01 && Math.abs(d) < 4) {
                        if (cs.position === 'static') el.style.position = 'relative';
                        el.style.top = d.toFixed(2) + 'px';
                    }
                }
            }
            restore();
        });
    }
    window.corpRadii = corpRadii;
    window.corpFitCards = corpFitCards;
    window.corpFitText = corpFitText;
    window.corpLineBreaks = corpLineBreaks;
    window.corpFirstBaselines = corpFirstBaselines;

    /* Student version (SPEC 10; student=1 in a print view): slides marked
       @slide nohandout leave the deck, and answers ({answer x}, @terms
       answers, a card's answer flag) are hidden. An answer stops being a
       build, so it takes no click and, in a one-page-per-build export,
       no page of its own. Its space stays, for writing in. */
    function applyStudentVersion() {
        if (!(window.MGA_EXPORT && window.MGA_EXPORT.student)) return;
        document.querySelectorAll('.reveal .slides section.md-nohandout').forEach(function (s) {
            const stack = s.parentElement && s.parentElement.tagName === 'SECTION' ? s.parentElement : null;
            s.remove();
            if (stack && !stack.querySelector('section')) stack.remove();
        });
        document.querySelectorAll('.reveal .slides .md-answer').forEach(function (a) {
            a.classList.remove('fragment');
            a.removeAttribute('data-fragment-index');
            a.removeAttribute('data-md-step');
            a.classList.add('md-answer-hidden');
        });
    }

    /* An affix written with a leading hyphen (-mageddon, -ness) must
       not break after its hyphen when a narrow card or table cell wraps
       it: a word joiner (U+2060) goes between the hyphen and the letter.
       Only a hyphen at the start of a word, so compounds (fish-oil-pilled)
       still break as usual. Not in corporate mode, whose line breaks
       follow PowerPoint's. */
    function joinAffixHyphens(root) {
        if (document.documentElement.classList.contains('corp')) return;
        const walker = document.createTreeWalker(root || document.querySelector('.reveal .slides') || document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (n) {
                return n.nodeValue.indexOf('-') === -1 || (n.parentElement && n.parentElement.closest('code, pre, script, style'))
                    ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        const re = /(^|[\s(\[\u2018\u201C'"\/])-(?=\p{L})/gu;
        let n;
        while ((n = walker.nextNode())) {
            const v = n.nodeValue.replace(re, '$1-\u2060');
            if (v !== n.nodeValue) n.nodeValue = v;
        }
    }
    window.joinAffixHyphens = joinAffixHyphens;

    /* Some forms hang a quotation's first line into the margin so its
       opening quotation mark sits outside the text. A quotation written
       without one would hang its first word instead: unhang it. */
    function unhangQuotes() {
        document.querySelectorAll('.reveal .slides blockquote p, .reveal .slides .md-split-body > p:first-child').forEach(function (p) {
            if (!/^[\s]*[\u2018\u201C'"\u00AB\u2039\u201E\u201A]/.test(p.textContent)) p.classList.add('md-no-hang');
        });
    }

    window.MgaBuilds = {
        id: 'mga-builds',
        init: function (deck) {
            applyStudentVersion();
            joinAffixHyphens();
            unhangQuotes();
            corpWrapSlides();
            buildTranscriptOverlays();
            wireTranscriptOverlays(deck);
            markMenuHeads();
            linkMorphSlides();
            applyBuilds();
            wireAutoBuilds(deck);
            wireMarks(deck);
            wireVideos(deck);
            deck.on('autoanimate', ghostUnmatched);
            deck.on('slidechanged', function (e) { if (!e.currentSlide.hasAttribute('data-auto-animate')) clearGhosts(); });
        }
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
