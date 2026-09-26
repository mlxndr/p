// Build config with user preference support
(function() {
    // Determine transition based on reduced motion preference
    const transition = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'slide';

    // Theme catalogue for the menu: owned by inc/head.js (which also chose
    // the opening theme before first paint), grouped into sections whose
    // headers are generated below, so nothing here needs keeping in sync.
    const themeSections = (window.MGA_THEMES || []).map(function (s) {
        return { name: s.name, themes: s.themes.map(function (t) {
            return { name: t.name, theme: t.href };
        }) };
    });

    Reveal.initialize({
    plugins: [ RevealMarkdown, RevealMenu, RevealNotes, PdfExport, Appearance, OneTimer ],
    width: 1920,
    height: 1080,
    margin: 0.08,         // about 4% clear on each side: projectors often crop the edges
    minScale: 0.2,       // minimum scaling
    maxScale: 2.0,        // maximum scaling
    navigationMode: 'linear',
    showSlideNumber: 'print',
    pdfSeparateFragments: false,
    controls: false,
    progress: true,
    center: false,
    hash: true,
    transition: transition,
    markdown: {
        smartypants: true,
        gfm: true,
        breaks: true,
        // Optionally animate Markdown lists
        animateLists: true
    },
    menu: {
        side: 'left',
        width: 'normal',
        numbers: true,
        titleSelector: 'h1, h2, h3',
        useTextContentForMissingTitles: true,
        hideMissingTitles: false,
        openButton: true,   // hidden on fine-pointer devices via CSS; the touch affordance
        keyboard: true,
        markers: false,
        themes: themeSections.flatMap(function(s) { return s.themes; }),
        transitions: true,
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

        // Layout picker: a row of icons at the top of the Themes panel.
        // Mouse: click. Keyboard: with the Themes panel open, the number
        // keys 1-4 choose a layout directly; or Tab to the icons, move
        // with the arrow keys and choose with Enter or Space.
        const layoutLink = document.getElementById('layout');
        const layouts = window.MGA_LAYOUTS || [];
        const themesPanel = document.querySelector('.slide-menu-panel[data-panel="Themes"]');
        let picker = null;
        // Refit once the new layout stylesheet is really in force. The load
        // event alone proved unreliable for a stylesheet the browser has
        // cached, so also watch for the sheet itself to change over, and
        // refit once more shortly after for good measure.
        function refitWhenApplied(link, href) {
            let done = false;
            const want = new URL(href, location.href).href;
            function refit() {
                if (done) return;
                done = true;
                if (window.updateThemeElements) window.updateThemeElements();
                setTimeout(function () {
                    if (window.refitSlides) window.refitSlides();
                }, 400);
            }
            link.addEventListener('load', refit, { once: true });
            const t0 = performance.now();
            (function poll() {
                let ready = false;
                try { ready = !!(link.sheet && link.sheet.href === want && link.sheet.cssRules); } catch (e) {}
                if (ready) { requestAnimationFrame(refit); return; }
                if (performance.now() - t0 < 3000) requestAnimationFrame(poll); else refit();
            })();
        }
        function chooseLayout(key) {
            const l = layouts.filter(function (x) { return x.key === key; })[0];
            if (!l || !layoutLink) return;
            if (layoutLink.getAttribute('href') !== l.href) {
                layoutLink.setAttribute('href', l.href);
                refitWhenApplied(layoutLink, l.href);
            }
            window.MGA_LAYOUT = key;
            try { localStorage.setItem('layout', key); } catch (e) {}
            picker.querySelectorAll('button').forEach(function (b) {
                const on = b.getAttribute('data-layout') === key;
                b.classList.toggle('active', on);
                b.setAttribute('aria-checked', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
            });
        }
        if (themesPanel && layouts.length && !themesPanel.querySelector('.mga-layout-picker')) {
            picker = document.createElement('div');
            picker.className = 'mga-layout-picker';
            picker.setAttribute('role', 'radiogroup');
            picker.setAttribute('aria-label', 'Layout');
            picker.innerHTML = '<span class="mga-layout-label">Layout</span>' +
                layouts.map(function (l, n) {
                    return '<button type="button" role="radio" data-layout="' + l.key + '"' +
                        ' title="' + l.name + ' (' + (n + 1) + ')" aria-label="' + l.name + '">' +
                        l.icon + '</button>';
                }).join('');
            themesPanel.insertBefore(picker, themesPanel.firstChild);
            picker.addEventListener('click', function (e) {
                const b = e.target.closest('button[data-layout]');
                if (b) chooseLayout(b.getAttribute('data-layout'));
            });
            chooseLayout(window.MGA_LAYOUT);

            // Keys, taken before the menu plugin sees them
            window.addEventListener('keydown', function (e) {
                const menuOpen = document.querySelector('.slide-menu.active');
                if (!menuOpen) return;
                const buttons = Array.prototype.slice.call(picker.querySelectorAll('button'));
                const onPicker = buttons.indexOf(document.activeElement);
                const themesActive = themesPanel.classList.contains('active-menu-panel');
                if (themesActive && /^[1-9]$/.test(e.key) && layouts[+e.key - 1]) {
                    chooseLayout(layouts[+e.key - 1].key);
                } else if (onPicker !== -1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                    const next = (onPicker + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length;
                    buttons[next].focus();
                } else if (onPicker !== -1 && (e.key === 'Enter' || e.key === ' ')) {
                    chooseLayout(buttons[onPicker].getAttribute('data-layout'));
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
