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
    }

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
        numbers: false,
        titleSelector: 'h1, h2, h3',
        useTextContentForMissingTitles: true,
        hideMissingTitles: false,
        openButton: false,
        keyboard: true,
        markers: true,
        themes: [
            // MAIN (6)
            { name: 'Black on Cream', theme: '../inc/css/th-l-cr.css' },
            { name: 'White on Twilight Background', theme: '../inc/css/th-d-bg-twilight.css' },
            { name: 'High Accessibility', theme: '../inc/css/th-l-acc.css' },
            { name: 'University of Glasgow', theme: '../inc/css/th-l-bg-uog-cr-1.css' },
            { name: 'Historical Thesaurus', theme: '../inc/css/th-l-bg-ht-cr.css' },
            { name: 'Terracotta', theme: '../inc/css/th-l-terracotta.css' },
            // ALL SANS-SERIF (3)
            { name: 'Black on Cream', theme: '../inc/css/th-l-cr-m.css'},
            { name: 'Black on Cream, Thin Body Text', theme: '../inc/css/th-l-cr-m-thin.css' },
            { name: 'White on Twilight Background', theme: '../inc/css/th-d-bg-twilight-m.css' },
            // LIGHT THEMES (6)
            { name: 'Black on Cream', theme: '../inc/css/th-l-cr-m.css'},
            { name: 'Black on Cream, Thin Body Text', theme: '../inc/css/th-l-cr-m-thin.css'},
            { name: 'White on Twilight Background', theme: '../inc/css/th-d-bg-twilight-m.css'},
            // DARK THEMES (7)
            { name: 'Black', theme: '../inc/css/th-d-bk.css' },
            { name: 'Blue', theme: '../inc/css/th-d-bu.css' },
            { name: 'Blue with Inverted Fonts', theme: '../inc/css/th-d-bu-invert.css' },
            { name: 'Green', theme: '../inc/css/th-d-gr.css' },
            { name: 'Polygons Blue', theme: '../inc/css/th-d-bg-polygonblue.css' },
            { name: 'Polygons Red', theme: '../inc/css/th-d-bg-polygonred.css' },
            { name: 'Black Rows', theme: '../inc/css/th-d-bg-rows.css' },
            // EXPERIMENTAL (6)
            { name: 'UofG Cream', theme: '../inc/css/th-l-bg-uog-cr-2.css' },
            { name: 'Indoor Kid', theme: '../inc/css/th-l-indoor.css' },
            { name: 'Cream with Inverted Fonts', theme: '../inc/css/th-l-e-cr-invert.css' },
            { name: 'Twilight with Inverted Fonts', theme: '../inc/css/th-d-e-bg-twilight-invert.css' },
            { name: 'Light Green', theme: '../inc/css/th-d-e-lgr.css' },
            { name: 'Orange', theme: '../inc/css/th-d-e-or.css' },
        ],
        transitions: true,
        custom: [
            {
                title: 'Fonts',
                icon: '<i class="fad fa-font"></i>',
                content:
                    '<div class="font-section-header"><span>Presets</span><i class="fad fa-stars"></i></div>' +
                    '<ul class="slide-menu-items font-presets">' +
                        '<li class="slide-menu-item" data-preset="default" data-item="0">Equity / Concourse</li>' +
                        '<li class="slide-menu-item" data-preset="century" data-item="1">Century / Concourse</li>' +
                        '<li class="slide-menu-item" data-preset="concourse" data-item="2">All Concourse</li>' +
                        '<li class="slide-menu-item" data-preset="all-century" data-item="3">All Century</li>' +
                        '<li class="slide-menu-item" data-preset="accessible" data-item="4">Accessible</li>' +
                    '</ul>' +
                    '<div class="font-section-header"><span>Heading Font</span><i class="fad fa-heading"></i></div>' +
                    '<ul class="slide-menu-items font-headings">' +
                        '<li class="slide-menu-item" data-heading="equity" data-item="5">Equity</li>' +
                        '<li class="slide-menu-item" data-heading="concourse" data-item="6">Concourse</li>' +
                        '<li class="slide-menu-item" data-heading="century" data-item="7">Century Supra</li>' +
                        '<li class="slide-menu-item" data-heading="luciole" data-item="8">Luciole</li>' +
                        '<li class="slide-menu-item" data-heading="mono" data-item="9">Monaspace Neon</li>' +
                    '</ul>' +
                    '<div class="font-section-header"><span>Body Font</span><i class="fad fa-paragraph"></i></div>' +
                    '<ul class="slide-menu-items font-body">' +
                        '<li class="slide-menu-item" data-body="equity" data-item="10">Equity</li>' +
                        '<li class="slide-menu-item" data-body="concourse" data-item="11">Concourse</li>' +
                        '<li class="slide-menu-item" data-body="century" data-item="12">Century Supra</li>' +
                        '<li class="slide-menu-item" data-body="luciole" data-item="13">Luciole</li>' +
                        '<li class="slide-menu-item" data-body="mono" data-item="14">Monaspace Neon</li>' +
                    '</ul>'
            },
            {
                title: 'Info',
                icon: '<i class="fad fa-info"></i>',
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
        // Add Menu title at top
        const toolbar = document.querySelector('.slide-menu-toolbar');
        if (toolbar) {
            const title = document.createElement('div');
            title.className = 'slide-menu-title';
            title.textContent = 'Menu';
            toolbar.parentNode.insertBefore(title, toolbar);

            // Reorder toolbar tabs AND fix keyboard navigation
            // Plugin uses data-button attributes for keyboard nav, not DOM order
            setTimeout(function() {
                const slidesTab = toolbar.querySelector('li[data-panel="Slides"]');
                const themesTab = toolbar.querySelector('li[data-panel="Themes"]');
                const fontsTab = toolbar.querySelector('li[data-panel="Custom0"]');
                const transitionsTab = toolbar.querySelector('li[data-panel="Transitions"]');
                const infoTab = toolbar.querySelector('li[data-panel="Custom1"]');
                const closeButton = toolbar.querySelector('#close');

                if (slidesTab && themesTab && fontsTab && transitionsTab && infoTab && closeButton) {
                    // Reorder DOM: Slides, Themes, Fonts, Transitions, Info, Close
                    toolbar.insertBefore(slidesTab, closeButton);
                    toolbar.insertBefore(themesTab, closeButton);
                    toolbar.insertBefore(fontsTab, closeButton);
                    toolbar.insertBefore(transitionsTab, closeButton);
                    toolbar.insertBefore(infoTab, closeButton);

                    // Update data-button attributes to match new order for keyboard nav
                    slidesTab.setAttribute('data-button', '0');
                    themesTab.setAttribute('data-button', '1');
                    fontsTab.setAttribute('data-button', '2');
                    transitionsTab.setAttribute('data-button', '3');
                    infoTab.setAttribute('data-button', '4');
                }
            }, 50);

        }

        // Apply background gradient via JS - force inline style
        // Run after delay to ensure plugin is fully ready
        setTimeout(function() {
            const menus = document.querySelectorAll('.slide-menu');
            menus.forEach(function(menu) {
                // Force gradient with inline style - highest priority
                menu.setAttribute('style',
                    'background: linear-gradient(180deg, #0d0d0d 0%, #2a2a2a 100%) !important; ' +
                    'background-color: #1a1a1a !important;'
                );
            });
        }, 100);

        // Add section headers with icons to theme list
        const sections = [
            { startIdx: 0, name: 'Main', icon: 'fa-stars' },
            { startIdx: 6, name: 'All Sans-Serif', icon: 'fa-font-case' },
            { startIdx: 9, name: 'Light Themes', icon: 'fa-lightbulb-on' },
            { startIdx: 12, name: 'Dark Themes', icon: 'fa-moon-stars' },
            { startIdx: 19, name: 'Experimental', icon: 'fa-flask' }
        ];

        const themePanel = document.querySelector('.slide-menu-panel[data-panel="Themes"] ul');
        if (themePanel) {
            const items = Array.from(themePanel.querySelectorAll('li'));

            // Insert headers in reverse order to preserve indices
            sections.slice().reverse().forEach(section => {
                if (items[section.startIdx]) {
                    const header = document.createElement('li');
                    header.className = 'theme-section-header';
                    header.innerHTML = '<span>' + section.name + '</span><i class="fad ' + section.icon + '"></i>';
                    items[section.startIdx].parentNode.insertBefore(header, items[section.startIdx]);
                }
            });
        }

        // Add transition icons
        const transitionItems = document.querySelectorAll('.slide-menu-panel[data-panel="Transitions"] li');
        const transitionIcons = {
            'None': 'fa-eye-slash',
            'Fade': 'fa-transporter-2',
            'Slide': 'fa-arrows',
            'Convex': 'fa-circle-notch',
            'Concave': 'fa-circle-notch concave',
            'Zoom': 'fa-search-plus'
        };

        transitionItems.forEach(item => {
            const text = item.textContent.trim();
            const iconClass = transitionIcons[text];
            if (iconClass) {
                const icon = document.createElement('i');
                icon.className = `fad ${iconClass} transition-icon`;
                item.insertBefore(icon, item.firstChild);
            }
        });

        // ========================================
        // Font Chooser Logic
        // ========================================

        // Font class arrays for easy removal
        const headingClasses = ['heading-equity', 'heading-concourse', 'heading-century',
                                'heading-luciole', 'heading-mono'];
        const bodyClasses = ['body-equity', 'body-concourse', 'body-century',
                             'body-luciole', 'body-mono'];

        // Preset definitions (null means use CSS default)
        const presets = {
            default:      { heading: null, body: null },
            century:      { heading: 'century', body: null },
            concourse:    { heading: 'concourse', body: 'concourse' },
            'all-century': { heading: 'century', body: 'century' },
            accessible:   { heading: 'luciole', body: 'luciole' }
        };

        const reveal = document.querySelector('.reveal');

        // Restore saved fonts on load
        const savedHeading = localStorage.getItem('font-heading') || null;
        const savedBody = localStorage.getItem('font-body') || null;
        if (savedHeading) reveal.classList.add('heading-' + savedHeading);
        if (savedBody) reveal.classList.add('body-' + savedBody);

        // Apply fonts and update UI
        function applyFonts(heading, body) {
            reveal.classList.remove(...headingClasses, ...bodyClasses);
            if (heading) reveal.classList.add('heading-' + heading);
            if (body) reveal.classList.add('body-' + body);
            localStorage.setItem('font-heading', heading || '');
            localStorage.setItem('font-body', body || '');
            updateFontSelections(heading, body);
        }

        function updateFontSelections(heading, body) {
            // Clear all selections
            document.querySelectorAll('[data-preset], [data-heading], [data-body]')
                .forEach(el => el.classList.remove('selected'));

            // Mark current heading selection
            if (heading) {
                const h = document.querySelector('[data-heading="' + heading + '"]');
                if (h) h.classList.add('selected');
            }
            // Mark current body selection
            if (body) {
                const b = document.querySelector('[data-body="' + body + '"]');
                if (b) b.classList.add('selected');
            }
            // Check if current combo matches a preset
            for (const [name, preset] of Object.entries(presets)) {
                if (preset.heading === heading && preset.body === body) {
                    const p = document.querySelector('[data-preset="' + name + '"]');
                    if (p) p.classList.add('selected');
                    break;
                }
            }
        }

        // Preset click handlers
        document.querySelectorAll('[data-preset]').forEach(item => {
            item.addEventListener('click', function() {
                const preset = presets[this.dataset.preset];
                applyFonts(preset.heading, preset.body);
            });
        });

        // Heading font click handlers
        document.querySelectorAll('[data-heading]').forEach(item => {
            item.addEventListener('click', function() {
                const currentBody = localStorage.getItem('font-body') || null;
                applyFonts(this.dataset.heading, currentBody);
            });
        });

        // Body font click handlers
        document.querySelectorAll('[data-body]').forEach(item => {
            item.addEventListener('click', function() {
                const currentHeading = localStorage.getItem('font-heading') || null;
                applyFonts(currentHeading, this.dataset.body);
            });
        });

        // Initialize selection state
        updateFontSelections(savedHeading, savedBody);
    });
})();
