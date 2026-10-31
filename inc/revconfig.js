// Build config with user preference support
(function() {
    // Deck defaults from meta.json (read by head.js): "transition" between
    // slides (corporate decks: none), "listBuild" (lists build item by
    // item; default true, corporate false). Reduced motion: no transition.
    const meta = window.MGA_META || {};
    const TRANSITIONS = ['none', 'fade', 'slide', 'convex', 'concave', 'zoom'];
    let deckTransition = meta.corporate ? 'none' : (meta.transition || 'slide');
    if (TRANSITIONS.indexOf(deckTransition) === -1) {
        console.warn('[meta] "transition" must be one of ' + TRANSITIONS.join(', ') + '; using slide');
        deckTransition = 'slide';
    }
    const transition = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : deckTransition;
    const listBuild = meta.listBuild !== undefined ? meta.listBuild !== false : !meta.corporate;
    // Corporate mode (SPEC 8) behaves like a PowerPoint slide show: no
    // margin (letterboxed in black), no progress bar, no menu disc, no
    // theme or transition panels, no transitions
    const corp = !!window.MGA_CORPORATE;

    // Theme catalogue for the menu: owned by inc/head.js (which also chose
    // the opening theme before first paint), grouped into sections whose
    // headers are generated below, so nothing here needs keeping in sync.
    const themeSections = (window.MGA_THEMES || []).map(function (s) {
        return { name: s.name, themes: s.themes.map(function (t) {
            return { name: t.name, theme: t.href };
        }) };
    });

    Reveal.initialize({
    // MgaBuilds (directives.js) must follow RevealMarkdown: it adjusts the
    // rendered slides' builds before reveal counts their fragments
    plugins: [ RevealMarkdown ].concat(window.MgaBuilds ? [ window.MgaBuilds ] : [],
        [ RevealMenu, RevealNotes, PdfExport, Appearance, OneTimer ]),
    width: 1920,
    height: 1080,
    margin: corp ? 0 : 0.08,   // about 4% clear on each side: projectors often crop the edges
    minScale: 0.2,       // minimum scaling
    maxScale: 2.0,        // maximum scaling
    navigationMode: 'linear',
    showSlideNumber: 'print',
    // print views opened from the export page (SPEC 10): builds=1 gives
    // one page per build; a slide never runs onto a second page
    pdfSeparateFragments: !!(window.MGA_EXPORT && window.MGA_EXPORT.builds),
    pdfMaxPagesPerSlide: 1,
    controls: false,
    progress: !corp,
    center: false,
    hash: true,
    transition: transition,
    backgroundTransition: corp ? 'none' : 'fade',
    // Morph (SPEC 6.3): builds on the new slide stay out of matching,
    // words and morpheme pieces move without scaling (directives.js)
    autoAnimateMatcher: window.mgaMorphMatcher || null,
    // export (?fragments=false, print-pdf) shows each slide's final state,
    // so nothing animates between slides
    autoAnimate: !/[?&](fragments=false|print-pdf)\b/.test(location.search),
    markdown: {
        smartypants: true,
        gfm: true,
        breaks: true,
        // Lists build item by item unless the deck says otherwise
        animateLists: listBuild
    },
    menu: {
        side: 'left',
        width: 'normal',
        numbers: true,
        titleSelector: 'h1, h2, h3',
        useTextContentForMissingTitles: true,
        hideMissingTitles: false,
        openButton: !corp,  // hidden on fine-pointer devices via CSS; the touch affordance
        keyboard: true,
        markers: false,
        themes: corp ? false : themeSections.flatMap(function(s) { return s.themes; }),
        transitions: !corp,
        custom: [
            {
                title: 'Info',
                icon: '',
                content: '<div class="slide-menu-info"><br><small>' +
                        '<p><i class="fad fa-code"></i> Created using <a href="https://revealjs.com" target="blank">reveal.js</a> & <a href="https://github.com/denehyg/reveal.js-menu" target="blank">reveal.js-menu</a></p>' +
                        '<p><i class="fad fa-user-edit"></i> Customisations by <a href="https://mga.is" target="blank">Marc Alexander</a></p>' +
                        '<p><i class="fad fa-font"></i> Concourse, Equity, Century Supra fonts by <a href="https://mbtype.com/" target="blank">Matthew Butterick</a>, accessible font <a href="https://luciole-vision.com/en/" target="blank">Luciole</a> by the <a href="https://www.ctrdv.fr" target="blank">Centre Technique Régional pour la Déficience Visuelle</a>, and monospaced font by <a href="https://www.jetbrains.com/lp/mono">JetBrains</a></p>' +
                        '<p><i class="fad fa-images"></i> Slide backgrounds by <a href="https://basicappleguy.com/" target="blank">BasicAppleGuy</a> and <a href="https://unsplash.com" target="blank">Unsplash</a></p>' +
                        '<p><i class="fad fa-code-merge"></i> Hosted on <a href="https://mlxndr.github.io/" target="blank">GitHub</a></p></small>' +
                        '</div>'
            }
        ],
        loadIcons: false,
        },
    });

    // Corporate: a click on the slide advances, as in PowerPoint (the
    // clicker's Page Down and Page Up already move next and back);
    // links, the menu and text selection are left alone
    if (corp) {
        document.querySelector('.reveal').addEventListener('click', function (e) {
            if (e.button !== 0 || e.target.closest('a, button, input, .slide-menu, .slide-menu-overlay, video')) return;
            if (document.documentElement.classList.contains('mga-coords')) return;
            const sel = window.getSelection && window.getSelection();
            if (sel && String(sel).length) return;
            Reveal.next();
        });
    }

    // Enhance menu after it's ready
    Reveal.on('menu-ready', function() {
        // A top band for the panel: the jackdaw (a link home to the
        // directory page) on the left, mirroring the footer toolbar
        const menuEl = document.querySelector('.slide-menu');
        if (menuEl && !menuEl.querySelector('.menu-topbar')) {
            const bar = document.createElement('div');
            bar.className = 'menu-topbar';
            const jd = document.createElement('a');
            jd.className = 'menu-jackdaw';
            jd.href = '../';
            jd.title = 'All presentations';
            jd.setAttribute('aria-label', 'All presentations');
            bar.appendChild(jd);
            // the export page (PDFs, handouts, the markdown source)
            const ex = document.createElement('a');
            ex.className = 'menu-export';
            ex.href = '?export';
            ex.textContent = 'Export';
            ex.title = 'PDFs, handouts and the markdown source';
            bar.appendChild(ex);
            menuEl.appendChild(bar);
        }

        // Order the footer tabs: Slides, Themes, Transitions, Info, Close.
        // The plugin inserts custom panels early, so reorder and re-key
        // the data-button indices it uses for keyboard navigation.
        const toolbar = document.querySelector('.slide-menu-toolbar');
        if (toolbar) {
            setTimeout(function() {
                const order = ['Slides', 'Themes', 'Transitions', 'Custom0'];
                const closeButton = toolbar.querySelector('#close');
                if (closeButton) {
                    order.forEach(function(panel, n) {
                        const tab = toolbar.querySelector('li[data-panel="' + panel + '"]');
                        if (tab) {
                            toolbar.insertBefore(tab, closeButton);
                            tab.setAttribute('data-button', String(n));
                        }
                    });
                }
            }, 50);
        }

        // Palette picker (forms only): a row of swatches at the top of the
        // Themes panel, light palettes then dark. Mouse: click. Keyboard:
        // Tab to the swatches, move with the arrow keys, choose with Enter
        // or Space. Hidden while the theme is not a form.
        const themeLink = function () { return document.getElementById('theme'); };
        const palettes = window.MGA_PALETTES || [];
        const themesPanel = document.querySelector('.slide-menu-panel[data-panel="Themes"]');
        let picker = null;
        function refitSoon() {
            if (window.updateThemeElements) window.updateThemeElements();
            setTimeout(function () { if (window.refitSlides) window.refitSlides(); }, 300);
        }
        function markPicker() {
            if (!picker) return;
            const link = themeLink();
            const form = link && window.mgaFormByHref ? window.mgaFormByHref(link.getAttribute('href')) : null;
            picker.hidden = !form;
            picker.querySelectorAll('button').forEach(function (b) {
                const on = b.getAttribute('data-palette') === window.MGA_PALETTE;
                b.classList.toggle('active', on);
                b.setAttribute('aria-checked', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
            });
        }
        window.mgaMarkPalettePicker = markPicker;
        function choosePalette(key) {
            if (window.mgaSetPalette) window.mgaSetPalette(key);
            markPicker();
            refitSoon();
        }
        if (themesPanel && palettes.length && !themesPanel.querySelector('.mga-palette-picker')) {
            picker = document.createElement('div');
            picker.className = 'mga-palette-picker';
            picker.setAttribute('role', 'radiogroup');
            picker.setAttribute('aria-label', 'Palette');
            const sw = function (p) {
                return '<button type="button" role="radio" data-palette="' + p.key + '" title="' + p.name + '"' +
                    ' aria-label="' + p.name + '" style="--sw-paper:' + p.paper + ';--sw-accent:' + p.accent + '"></button>';
            };
            picker.innerHTML = '<span class="mga-palette-label">Palette</span>' +
                '<span class="mga-palette-row">' + palettes.filter(function (p) { return p.mode === 'light'; }).map(sw).join('') + '</span>' +
                '<span class="mga-palette-row">' + palettes.filter(function (p) { return p.mode === 'dark'; }).map(sw).join('') + '</span>';
            themesPanel.insertBefore(picker, themesPanel.firstChild);
            picker.addEventListener('click', function (e) {
                const b = e.target.closest('button[data-palette]');
                if (b) choosePalette(b.getAttribute('data-palette'));
            });
            markPicker();

            window.addEventListener('keydown', function (e) {
                if (!document.querySelector('.slide-menu.active') || picker.hidden) return;
                const buttons = Array.prototype.slice.call(picker.querySelectorAll('button'));
                const on = buttons.indexOf(document.activeElement);
                if (on === -1) return;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    buttons[(on + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length].focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    choosePalette(buttons[on].getAttribute('data-palette'));
                } else {
                    return;
                }
                e.preventDefault();
                e.stopImmediatePropagation();
            }, true);
        }

        // Transition list icons (monochrome duotone, matching the Info panel)
        const transitionIcons = {
            'None': 'fa-eye-slash',
            'Fade': 'fa-transporter-2',
            'Slide': 'fa-arrows',
            'Convex': 'fa-circle-notch',
            'Concave': 'fa-circle-notch concave',
            'Zoom': 'fa-search-plus'
        };
        document.querySelectorAll('.slide-menu-panel[data-panel="Transitions"] li').forEach(function(item) {
            const iconClass = transitionIcons[item.textContent.trim()];
            if (iconClass) {
                const icon = document.createElement('i');
                icon.className = 'fad ' + iconClass + ' transition-icon';
                item.insertBefore(icon, item.firstChild);
            }
        });

        // Add section headers to the theme list, generated from themeSections
        // so they can never drift out of sync with the theme entries.
        const themePanel = document.querySelector('.slide-menu-panel[data-panel="Themes"] ul');
        if (themePanel) {
            const items = Array.from(themePanel.querySelectorAll('li'));

            // Compute each section's start index from the structure
            let idx = 0;
            const sections = themeSections.map(function(s) {
                const entry = { startIdx: idx, name: s.name };
                idx += s.themes.length;
                return entry;
            });

            // Insert headers in reverse order to preserve indices
            // (a section with an empty name gets no header at all)
            sections.slice().reverse().forEach(section => {
                if (section.name && items[section.startIdx]) {
                    const header = document.createElement('li');
                    header.className = 'theme-section-header';
                    header.innerHTML = '<span>' + section.name + '</span>';
                    items[section.startIdx].parentNode.insertBefore(header, items[section.startIdx]);
                }
            });
        }

    });
})();
