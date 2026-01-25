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
    width: 1050,
    height: 700,
    margin: 0.1,
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
            // MAIN (4)
            { name: 'Black on Cream', theme: '../inc/css/th-l-cr.css' },
            { name: 'White on Twilight Background', theme: '../inc/css/th-d-bg-twilight.css' },
            { name: 'High Accessibility', theme: '../inc/css/th-l-acc.css' },
            { name: 'University of Glasgow', theme: '../inc/css/th-l-bg-uog-cr-1.css' },
            { name: 'Historical Thesaurus', theme: '../inc/css/th-l-bg-ht-cr.css' },
            // ALL SANS-SERIF (3)
            {
                name: 'Black on Cream',
                theme: '../inc/css/th-l-cr-m.css'
            },
            {
                name: 'Black on Cream, Thin Body Text',
                theme: '../inc/css/th-l-cr-m-thin.css'
            },
            {
                name: 'White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight-m.css'
            },
            // LIGHT THEMES (4)
            { name: 'Terracotta Academic', theme: '../inc/css/th-l-terracotta.css' },
            { name: 'Black on Cream', theme: '../inc/css/th-l-cr-m.css'},
            { name: 'Black on Cream, Thin Body Text', theme: '../inc/css/th-l-cr-m-thin.css'},
            { name: 'White on Twilight Background', theme: '../inc/css/th-d-bg-twilight-m.css'},
            // LIGHT THEMES (3)
            { name: 'Paper', theme: '../inc/css/th-l-bg-paper.css' },
            { name: 'Plaster', theme: '../inc/css/th-l-bg-plaster.css' },
            { name: 'Canvas', theme: '../inc/css/th-l-bg-canvas.css' },
            // DARK THEMES (7)
            { name: 'Black', theme: '../inc/css/th-d-bk.css' },
            { name: 'Blue', theme: '../inc/css/th-d-bu.css' },
            { name: 'Blue with Inverted Fonts', theme: '../inc/css/th-d-bu-invert.css' },
            { name: 'Green', theme: '../inc/css/th-d-gr.css' },
            { name: 'Polygons Blue', theme: '../inc/css/th-d-bg-polygonblue.css' },
            { name: 'Polygons Red', theme: '../inc/css/th-d-bg-polygonred.css' },
            { name: 'Black Rows', theme: '../inc/css/th-d-bg-rows.css' },
            // UNIVERSITY OF GLASGOW (4)
            { name: 'UofG Cream', theme: '../inc/css/th-l-bg-uog-cr-2.css' },
            { name: 'UofG Blue', theme: '../inc/css/th-d-bg-uog-bu.css' },
            { name: 'UofG Blue with Inverted Fonts', theme: '../inc/css/th-d-bg-uog-bu-invert.css' },
            { name: 'UofG Black', theme: '../inc/css/th-d-bg-uog-bl.css' },
            // EXPERIMENTAL (5)
            { name: 'Indoor Kid', theme: '../inc/css/th-l-indoor.css' },
            { name: 'Cream with Inverted Fonts', theme: '../inc/css/th-l-e-cr-invert.css' },
            { name: 'Twilight with Inverted Fonts', theme: '../inc/css/th-d-e-bg-twilight-invert.css' },
            { name: 'Light Green', theme: '../inc/css/th-d-e-lgr.css' },
            { name: 'Orange', theme: '../inc/css/th-d-e-or.css' }
        ],
        transitions: true,
        custom: [
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
                const transitionsTab = toolbar.querySelector('li[data-panel="Transitions"]');
                const infoTab = toolbar.querySelector('li[data-panel="Custom0"]');
                const closeButton = toolbar.querySelector('#close');

                if (slidesTab && themesTab && transitionsTab && infoTab && closeButton) {
                    // Reorder DOM: Slides, Themes, Transitions, Info, Close
                    toolbar.insertBefore(slidesTab, closeButton);
                    toolbar.insertBefore(themesTab, closeButton);
                    toolbar.insertBefore(transitionsTab, closeButton);
                    toolbar.insertBefore(infoTab, closeButton);

                    // Update data-button attributes to match new order for keyboard nav
                    slidesTab.setAttribute('data-button', '0');
                    themesTab.setAttribute('data-button', '1');
                    transitionsTab.setAttribute('data-button', '2');
                    infoTab.setAttribute('data-button', '3');
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
            { startIdx: 5, name: 'All Sans-Serif', icon: 'fa-font-case' },
            { startIdx: 8, name: 'Light Themes', icon: 'fa-lightbulb-on' },
            { startIdx: 11, name: 'Dark Themes', icon: 'fa-moon-stars' },
            { startIdx: 18, name: 'University of Glasgow', icon: 'fa-university' },
            { startIdx: 22, name: 'Experimental', icon: 'fa-flask' }
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
    });
})();
