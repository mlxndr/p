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
            // MAIN (3)
            {
                name: 'Black on Cream',
                theme: '../inc/css/th-l-cr.css',
                light: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            {
                name: 'White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight.css',
                light: false,
                hasImage: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#183153'
            },
            {
                name: 'High Accessibility',
                theme: '../inc/css/th-l-acc.css',
                light: true,
                accessible: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#EDD1B0'
            },
            // FONT VARIANTS (3)
            {
                name: 'All Sans-Serif: Black on Cream',
                theme: '../inc/css/th-l-cr-m.css',
                light: true,
                sansSerif: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            {
                name: 'All Sans-Serif: Black on Cream, Thin Body Text',
                theme: '../inc/css/th-l-cr-m-thin.css',
                light: true,
                sansSerif: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            {
                name: 'All Sans-Serif: White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight-m.css',
                light: false,
                hasImage: true,
                sansSerif: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#183153'
            },
            // LIGHT THEMES (3)
            {
                name: 'Paper',
                theme: '../inc/css/th-l-bg-paper.css',
                light: true,
                hasImage: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            {
                name: 'Plaster',
                theme: '../inc/css/th-l-bg-plaster.css',
                light: true,
                hasImage: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            {
                name: 'Canvas',
                theme: '../inc/css/th-l-bg-canvas.css',
                light: true,
                hasImage: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            // DARK THEMES (7)
            {
                name: 'Black',
                theme: '../inc/css/th-d-bk.css',
                light: false,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#000000'
            },
            {
                name: 'Blue',
                theme: '../inc/css/th-d-bu.css',
                light: false,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#183153'
            },
            {
                name: 'Blue with Inverted Fonts',
                theme: '../inc/css/th-d-bu-invert.css',
                light: false,
                iconColourFG: '#183153',
                iconColourBG: '#FFFFFF'
            },
            {
                name: 'Green',
                theme: '../inc/css/th-d-gr.css',
                light: false,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#353935'
            },
            {
                name: 'Polygons Blue',
                theme: '../inc/css/th-d-bg-polygonblue.css',
                light: false,
                hasImage: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#183153'
            },
            {
                name: 'Polygons Red',
                theme: '../inc/css/th-d-bg-polygonred.css',
                light: false,
                hasImage: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#2e1a1a'
            },
            {
                name: 'Black Rows',
                theme: '../inc/css/th-d-bg-rows.css',
                light: false,
                hasImage: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#183153'
            },
            // UNIVERSITY OF GLASGOW (3)
            {
                name: 'UofG Blue',
                theme: '../inc/css/th-d-bg-uog-bu.css',
                light: false,
                hasImage: true,
                university: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#003865'
            },
            {
                name: 'UofG Blue with Inverted Fonts',
                theme: '../inc/css/th-d-bg-uog-bu-invert.css',
                light: false,
                hasImage: true,
                university: true,
                iconColourFG: '#003865',
                iconColourBG: '#FFFFFF'
            },
            {
                name: 'UofG Black',
                theme: '../inc/css/th-d-bg-uog-bl.css',
                light: false,
                hasImage: true,
                university: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#000000'
            },
            // EXPERIMENTAL (5)
            {
                name: 'Indoor Kid',
                theme: '../inc/css/th-l-indoor.css',
                light: true,
                iconColourFG: '#0D0D0D',
                iconColourBG: '#F2F2EA'
            },
            {
                name: 'Cream with Inverted Fonts',
                theme: '../inc/css/th-l-e-cr-invert.css',
                light: true,
                iconColourFG: '#F2F2EA',
                iconColourBG: '#0D0D0D'
            },
            {
                name: 'Twilight with Inverted Fonts',
                theme: '../inc/css/th-d-e-bg-twilight-invert.css',
                light: false,
                hasImage: true,
                iconColourFG: '#FFFFFF',
                iconColourBG: '#183153'
            },
            {
                name: 'Light Green',
                theme: '../inc/css/th-d-e-lgr.css',
                light: false,
                iconColourFG: '#326A2B',
                iconColourBG: '#A7BFC0'
            },
            {
                name: 'Orange',
                theme: '../inc/css/th-d-e-or.css',
                light: false,
                iconColourFG: '#F88605',
                iconColourBG: '#742100'
            }
        ],
        transitions: true,
        custom: [
            {
                title: 'Info',
                icon: '<i class="fad fa-info"></i>',
                content: '<div class="slide-menu-info"><br><small>' +
                        '<p><i class="fad fa-chalkboard-teacher"></i> Created using <a href="https://revealjs.com" target="blank">reveal.js</a> & <a href="https://github.com/denehyg/reveal.js-menu" target="blank">reveal.js-menu</a></p>' +
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
        }

        // Get themes config for stacking icons
        const themesConfig = Reveal.getConfig().menu.themes;
        const themeItems = document.querySelectorAll('.slide-menu-panel[data-panel="Themes"] li');

        themeItems.forEach((item, index) => {
            const config = themesConfig[index];
            if (!config) return;

            const iconContainer = document.createElement('span');
            iconContainer.className = 'theme-icons';

            // Light/dark indicator
            if (config.light === true) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-lightbulb-on theme-icon';
                iconContainer.appendChild(icon);
            } else if (config.light === false) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-moon-stars theme-icon';
                iconContainer.appendChild(icon);
            }

            // Background image indicator
            if (config.hasImage) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-images theme-icon';
                iconContainer.appendChild(icon);
            }

            // University indicator
            if (config.university) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-university theme-icon';
                iconContainer.appendChild(icon);
            }

            // Sans-serif font indicator
            if (config.sansSerif) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-font-case theme-icon';
                iconContainer.appendChild(icon);
            }

            // Accessibility indicator
            if (config.accessible) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-universal-access theme-icon';
                iconContainer.appendChild(icon);
            }

            // Colour indicator (uses duotone check-square)
            if (config.iconColourFG || config.iconColourBG) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-check-square theme-icon';
                if (config.iconColourFG) {
                    icon.style.setProperty('--fa-primary-color', config.iconColourFG);
                }
                if (config.iconColourBG) {
                    icon.style.setProperty('--fa-secondary-color', config.iconColourBG);
                }
                iconContainer.appendChild(icon);
            }

            item.insertBefore(iconContainer, item.firstChild);
        });

        // Add section headers to theme list
        const themePanel = document.querySelector('.slide-menu-panel[data-panel="Themes"] ul');
        if (themePanel) {
            const items = themePanel.querySelectorAll('li:not(.theme-section-header)');
            let lastType = '';

            items.forEach((item, idx) => {
                let currentType = '';

                // Determine section by index (themes are in fixed order)
                if (idx < 3) currentType = 'Main';
                else if (idx < 6) currentType = 'Font Variants';
                else if (idx < 9) currentType = 'Light Themes';
                else if (idx < 16) currentType = 'Dark Themes';
                else if (idx < 19) currentType = 'University of Glasgow';
                else currentType = 'Experimental';

                if (currentType && currentType !== lastType) {
                    const header = document.createElement('li');
                    header.className = 'theme-section-header';
                    header.textContent = currentType;
                    item.parentNode.insertBefore(header, item);
                    lastType = currentType;
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
