// Build config with user preference support
(function() {
    // Determine transition based on reduced motion preference
    const transition = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'slide';

    // Check if user prefers dark theme and no theme is saved
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = !savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // If user prefers dark and no saved theme, switch to dark theme on load
    if (prefersDark) {
        const themeLink = document.getElementById('theme');
        if (themeLink) {
            themeLink.setAttribute('href', '../inc/css/th-d-bg-twilight.css');
        }
    } else if (savedTheme && /^\.\.\/inc\/css\/[\w-]+\.css$/.test(savedTheme)) {
        // Restore the visitor's saved theme (script-loader.js saves it on
        // every change). If the file has since been retired, fall back to
        // the default and forget the preference.
        const themeLink = document.getElementById('theme');
        if (themeLink && themeLink.getAttribute('href') !== savedTheme) {
            themeLink.addEventListener('error', function () {
                themeLink.setAttribute('href', '../inc/css/th-l-cr.css');
                try { localStorage.removeItem('theme'); } catch (e) {}
            }, { once: true });
            themeLink.setAttribute('href', savedTheme);
        }
    }

    // Theme catalogue for the menu, grouped into sections. Section headers
    // in the menu are generated from this structure, so adding, removing or
    // reordering entries here is safe: no indices to keep in sync by hand.
    // The curated set (2026-07): retired themes live in inc/css/retired/.
    // Display names are free to change; filenames stay fixed because saved
    // preferences in visitors' localStorage point at them.
    const themeSections = [
        { name: '', themes: [
            { name: 'Cream', theme: '../inc/css/th-l-cr.css' },
        ]},
        { name: 'Colours', themes: [
            { name: 'Terracotta', theme: '../inc/css/th-l-terracotta.css' },
            { name: 'Burgundy', theme: '../inc/css/th-l-burgundy.css' },
            { name: 'Slate', theme: '../inc/css/th-l-slate.css' },
            { name: 'Petrol', theme: '../inc/css/th-l-petrol.css' },
            { name: 'Racing Green', theme: '../inc/css/th-d-library.css' },
            { name: 'Twilight', theme: '../inc/css/th-d-bg-twilight.css' },
            { name: 'Midnight', theme: '../inc/css/th-d-bu-invert.css' },
        ]},
        { name: 'Light', themes: [
            { name: 'Marginalia', theme: '../inc/css/th-l-marginalia.css' },
            { name: 'Letterpress', theme: '../inc/css/th-l-letterpress.css' },
            { name: 'High Accessibility', theme: '../inc/css/th-l-acc.css' },
        ]},
        { name: 'Institutional', themes: [
            { name: 'University of Glasgow', theme: '../inc/css/th-l-uog.css' },
            { name: 'Historical Thesaurus', theme: '../inc/css/th-l-ht.css' },
            { name: 'Historical Thesaurus Cream', theme: '../inc/css/th-l-bg-ht-cr.css' },
        ]},
        { name: 'Variants', themes: [
            { name: 'Manuscript', theme: '../inc/css/th-l-e-cr-invert.css' },
            { name: 'Cream Sans', theme: '../inc/css/th-l-cr-m-thin.css' },
        ]},
    ];

    Reveal.initialize({
    plugins: [ RevealMarkdown, RevealMenu, RevealNotes, PdfExport, Appearance, OneTimer ],
    width: 1920,
    height: 1080,
    margin: 0.04,
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
        // Function to get metadata
        getMetadata: function() {
            return {
                author: document.querySelector('meta[name="author"]').getAttribute('content'),
                technologies: document.querySelector('meta[name="technologies"]').getAttribute('content'),
                lastUpdated: document.querySelector('meta[name="last-updated"]').getAttribute('content')
            };
        },
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
