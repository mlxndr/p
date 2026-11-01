/* meta.js — single-source deck metadata.
 *
 * A deck's index.html carries two empty placeholder sections:
 *     <section data-meta="title"></section>
 *     <section data-meta="closing"></section>
 * buildMetaSlides() fills them from ./meta.json merged over the site-wide
 * defaults in ../inc/site.json (per-field: a key present in meta.json wins;
 * omit a key to inherit the default). It also sets document.title.
 *
 * meta.json fields (all optional except title):
 *   title, subtitle        subtitle may contain *italics* (markdown emphasis)
 *   author                 a string — or authors: [{name, affiliation, email}]
 *   affiliation, email     used for the single-author case
 *   event, location, date  e.g. "ICAME47", "Koblenz", "May 2026"
 *   logos                  e.g. ["leverhulme", "uog"], ["uog"], or []
 *   url                    QR target; defaults to baseUrl + current path
 *   closing                false suppresses the generated closing slide;
 *                          "title" repeats the title slide as the closing slide
 *   series                 "English Words | history, meaning, and structure":
 *                          a series line in small caps above the title (after
 *                          | a smaller second line); also on @section slides
 *                          and the handout header
 *   advisory               ["Swearing and taboo words %%(quoted data)%%"]:
 *                          an advisory slide after the title (and a note on
 *                          the landing page); none unless the deck asks
 *
 * A deck that wants a bespoke opening keeps a title.md section instead of
 * the placeholder; the two mechanisms coexist.
 */
(function () {
    'use strict';

    /* Registry of shared logos (paths relative to a deck folder). The
       theme-sync in script-loader.js swaps mono/white variants, keyed on
       the class names. */
    var LOGOS = {
        leverhulme: { src: (window.MGA_ROOT || '../') + 'img/leverhulme_cmyk_black2.png', cls: 'theme-logo leverhulme-logo', h: 104, alt: 'Leverhulme Trust Logo' },
        uog:        { src: (window.MGA_ROOT || '../') + 'img/uog_mono.png',               cls: 'theme-logo uog-logo',        h: 95,  alt: 'University of Glasgow Logo' },
        ht:         { src: (window.MGA_ROOT || '../') + 'img/ht-black-colour.png',        cls: 'theme-logo ht-logo',         h: 95,  alt: 'Historical Thesaurus of English Logo' }
    };

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* *italics*, | line breaks, ^^small caps^^ and %%subtle%% in metadata strings */
    function emph(s) {
        return esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>')
                     .replace(/\s*\|\s*/g, '<br>')
                     .replace(/\^\^([^^]+)\^\^/g, '<span style="font-variant-caps: all-small-caps;">$1</span>')
                     .replace(/%%([^%]+)%%/g, '<span class="subtle">$1</span>');
    }

    /* The series line: name in small caps, after | a smaller second line */
    function seriesHtml(series) {
        var sp = String(series).split('|');
        return '<div class="md-series pres-series"><span class="md-series-name">' + emph(sp[0].trim()) + '</span>' +
            (sp.length > 1 ? '<span class="md-series-sub">' + emph(sp.slice(1).join('|').trim()) + '</span>' : '') + '</div>\n';
    }

    function advisoryHtml(meta) {
        var items = [].concat(meta.advisory);
        return '<h2>Content advisory</h2>\n<ul class="md-advisory-list">' +
            items.map(function (a) { return '<li>' + emph(a) + '</li>'; }).join('') + '</ul>';
    }

    function logoImg(key) {
        var l = LOGOS[key];
        if (!l) { console.warn('[meta] unknown logo "' + key + '"'); return ''; }
        return '<img src="' + l.src + '" height="' + l.h + 'em" alt="' + l.alt + '" class="' + l.cls + '">';
    }

    function authorList(meta) {
        if (meta.authors && meta.authors.length) return meta.authors;
        return [{ name: meta.author, affiliation: meta.affiliation, email: meta.email }];
    }

    function namesLine(authors) {
        return authors.map(function (a) { return esc(a.name); })
                      .join(' <span class="subtle">and</span> ');
    }

    /* One affiliation line: joint affiliation collapses to a single entry */
    function affiliationLine(authors) {
        var affs = [];
        authors.forEach(function (a) {
            if (a.affiliation && affs.indexOf(a.affiliation) === -1) affs.push(a.affiliation);
        });
        return affs.map(esc).join(' <span class="subtle">and</span> ');
    }

    function emailsLine(authors) {
        var mails = authors.map(function (a) { return a.email; }).filter(Boolean);
        return mails.map(esc).join(', ');
    }

    function titleSlideHtml(meta) {
        var authors = authorList(meta);
        var eventLine = [
            meta.event ? emph(meta.event) : null,
            meta.location ? emph(meta.location) : null
        ].filter(Boolean).join(', ');
        var logos = (meta.logos || []).map(logoImg).filter(Boolean);
        var html = '';
        /* Single-logo decks take a more restrained variant: sentence-case
           title, names with the event+date as their subtle line, the one
           logo on the right, a full rule above. */
        var single = logos.length === 1;
        /* Small caps come from a class (base.css), not an inline style,
           so a theme can turn them off */
        var titleClass = single ? 'pres-title-headingfont' : 'pres-title-headingfont pres-title-sc';
        /* A lecture in a series (teaching decks) with one logo: the logo
           at the top right, level with the series line */
        var logoTop = single && meta.series;
        if (logoTop) html += '<div class="pres-logo-top">' + logos[0] + '</div>\n';
        html += (meta.series ? seriesHtml(meta.series) : '<br><br>') +
            '<h1 class="' + titleClass + '" style="font-size: 2.2em !important; font-weight: 700">' + emph(meta.title) + '</h1>\n';
        if (meta.subtitle) {
            html += '<p class="pres-subtitle-mainfont" style="font-size: 1.2em; text-align: center; padding-bottom: 1em; font-weight: 300;">' + emph(meta.subtitle) + '</p>\n';
        }
        html += '<table class="titlebr" width="100%">\n';
        if (single) {
            var subLine = [eventLine || null,
                meta.date ? emph(meta.date) : null].filter(Boolean).join(', ');
            html += '<tr><td colspan="2"><hr></td></tr>\n<tr>\n';
            html += '<td class="tpa4-l">' + namesLine(authors) +
                    (subLine ? '<br><span class="subtle">' + subLine + '</span>' : '') + '</td>\n';
            html += '<td class="tpa4-r" style="vertical-align: bottom;">' + (logoTop ? '' : logos[0]) + '</td>\n';
            html += '</tr>\n';
        } else {
            html += '<tr>\n';
            html += '<td class="tpa4-l">' + namesLine(authors) + '<br><span class="subtle">' + affiliationLine(authors) + '</span></td>\n';
            html += '<td class="tpa4-r">' + eventLine +
                    (meta.date ? '<br><span class="subtle">' + emph(meta.date) + '</span>' : '') + '</td>\n';
            html += '</tr>\n';
            if (logos.length) {
                html += '<tr><td colspan="2"><hr></td></tr>\n<tr>\n';
                html += '<td class="tpa4-l">' + logos[0] + '</td><td class="tpa4-r">' + logos.slice(1).join(' ') + '</td>\n';
                html += '</tr>\n';
            }
        }
        html += '</table>';
        return html;
    }

    /* Corporate title slide (SPEC 8; UoG 2026 template, slide 1): the
       photograph, the logo block, and the gradient band holding title and
       subtitle. "photoFrame": "x,y,w" (percent of the slide) reproduces a
       PowerPoint picture frame exactly; otherwise the photograph covers
       the slide, centred on "photoFocus": "x,y" (percent). "photoAlt"
       describes it. With no photograph the band sits on University Blue. */
    function corpTitleHtml(meta) {
        var html = '';
        if (meta.photo) {
            var st;
            var fr = String(meta.photoFrame || '').split(',').map(parseFloat);
            if (fr.length === 3 && fr.every(function (v) { return !isNaN(v); })) {
                st = 'left:' + fr[0] + '%;top:' + fr[1] + '%;width:' + fr[2] + '%;height:auto;';
            } else {
                var fo = String(meta.photoFocus || '50,50').split(',');
                st = 'left:0;top:0;width:100%;height:100%;object-position:' + fo[0] + '% ' + (fo[1] || 50) + '%;';
            }
            if (!meta.photoAlt) console.warn('[meta] "photo" needs "photoAlt", a description of the photograph');
            html += '<img class="corp-photo" src="' + esc(meta.photo) + '" alt="' + esc(meta.photoAlt || '') + '" style="' + st + '">';
        }
        html += '<img class="corp-logo" src="' + (window.MGA_ROOT || '../') + 'img/uog_block.png" alt="University of Glasgow">';
        html += '<div class="corp-band"><h1>' + emph(meta.title) + '</h1>' +
            (meta.subtitle ? '<p>' + emph(meta.subtitle) + '</p>' : '') + '</div>';
        return html;
    }

    function closingSlideHtml(meta) {
        var authors = authorList(meta);
        var mails = emailsLine(authors);
        var url = meta.url ||
            ((meta.baseUrl || 'https://mga.is') + window.location.pathname);
        var logos = (meta.logos || []).map(logoImg).filter(Boolean);
        var html = '';
        html += '<br><br><h1 class="pres-title-headingfont pres-title-sc" style="font-size: 2.2em !important; font-weight: 700">' + emph(meta.title) + '</h1>\n';
        if (meta.subtitle) {
            html += '<p class="pres-subtitle-mainfont" style="font-size: 1.2em; text-align: center; padding-bottom: 1em; font-weight: 300;">' + emph(meta.subtitle) + '</p>\n';
        }
        html += '<br><br>\n<table class="titlebr" width="100%">\n<tr>\n';
        html += '<td class="tpa4-l">' + namesLine(authors) +
                (mails ? '<br><span class="subtle" style="font-size: 0.7em;">' + mails + '</span>' : '') + '</td>\n';
        html += '<td class="tpa4-r" style="vertical-align: bottom;">Slides:</td>\n';
        html += '</tr>\n<tr><td colspan="2"><hr></td></tr>\n<tr>\n';
        html += '<td class="tpa4-l" style="line-height: 2.2;">' + logos.join('<br>') + '</td>\n';
        html += '<td class="tpa4-r" style="vertical-align: middle;"><canvas id="qr-code" class="qr-code" width="280" height="280" data-url="' + esc(url) + '"></canvas></td>\n';
        html += '</tr>\n</table>';
        return html;
    }

    function fetchJson(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
            return r.json();
        });
    }

    function buildMetaSlides() {
        var wantsMeta = document.querySelector('section[data-meta]');
        return Promise.all([
            fetchJson((window.MGA_ROOT || '../') + 'inc/site.json').catch(function () { return {}; }),
            fetchJson('./meta.json').catch(function () { return null; })
        ]).then(function (res) {
            var site = res[0], deck = res[1];
            if (!deck) {
                if (wantsMeta) console.warn('[meta] meta.json missing but data-meta placeholders present');
                return;
            }
            var meta = {};
            Object.keys(site).forEach(function (k) { meta[k] = site[k]; });
            Object.keys(deck).forEach(function (k) { meta[k] = deck[k]; });

            /* Browser-tab title always comes from meta.json */
            var tabTitle = meta.title + (meta.subtitle ? ': ' + meta.subtitle : '');
            document.title = tabTitle.replace(/\*/g, '').replace(/\s*\|\s*/g, ' ');

            document.querySelectorAll('section[data-meta]').forEach(function (sec) {
                var kind = sec.getAttribute('data-meta');
                /* "closing": false in meta.json suppresses the closing slide */
                if (kind === 'closing' && meta.closing === false) {
                    sec.parentNode.removeChild(sec);
                    return;
                }
                /* Corporate decks: the template's title slide, which is
                   also the closing slide unless "closing" is false */
                if (window.MGA_CORPORATE) {
                    sec.classList.add('corp-title');
                    if (!meta.photo) sec.classList.add('corp-no-photo');
                    sec.setAttribute('data-autofit', 'off');
                    sec.innerHTML = corpTitleHtml(meta);
                } else {
                    sec.classList.add('title-slide');
                    if (kind === 'title') sec.innerHTML = titleSlideHtml(meta);
                    if (kind === 'closing') {
                        sec.innerHTML = meta.closing === 'title' ? titleSlideHtml(meta) : closingSlideHtml(meta);
                    }
                }
                /* "advisory": a slide of its own straight after the title */
                if (kind === 'title' && meta.advisory && [].concat(meta.advisory).length) {
                    var adv = document.createElement('section');
                    adv.className = 'md-advisory md-centred';
                    adv.id = 'advisory';
                    adv.innerHTML = advisoryHtml(meta);
                    sec.parentNode.insertBefore(adv, sec.nextSibling);
                }
            });
        });
    }

    window.buildMetaSlides = buildMetaSlides;
})();
