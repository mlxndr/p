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
            {
                name: 'Black on Cream',
                theme: '../inc/css/th-l-cr.css',
                light: true,
                iconColourFG: '#0d0d0d',
                iconColourBG: '#f5f0e6'
            },
            {
                name: 'White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight.css',
                light: false,
                hasImage: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#2d3436'
            },
            {
                name: 'High Accessibility',
                theme: '../inc/css/th-l-acc.css',
                light: true,
                accessible: true,
                iconColourFG: '#000000',
                iconColourBG: '#fffef0'
            },
            {
                name: 'All Sans-Serif: Black on Cream',
                theme: '../inc/css/th-l-cr-m.css',
                light: true,
                sansSerif: true,
                iconColourFG: '#0d0d0d',
                iconColourBG: '#f5f0e6'
            },
            {
                name: 'All Sans-Serif: Black on Cream, Thin Body Text',
                theme: '../inc/css/th-l-cr-m-thin.css',
                light: true,
                sansSerif: true,
                iconColourFG: '#0d0d0d',
                iconColourBG: '#f5f0e6'
            },
            {
                name: 'All Sans-Serif: White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight-m.css',
                light: false,
                hasImage: true,
                sansSerif: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#2d3436'
            },
            {
                name: 'Light: Paper',
                theme: '../inc/css/th-l-bg-paper.css',
                light: true,
                hasImage: true,
                iconColourFG: '#0d0d0d',
                iconColourBG: '#e8e0d0'
            },
            {
                name: 'Light: Plaster',
                theme: '../inc/css/th-l-bg-plaster.css',
                light: true,
                hasImage: true,
                iconColourFG: '#0d0d0d',
                iconColourBG: '#f0ebe0'
            },
            {
                name: 'Light: Canvas',
                theme: '../inc/css/th-l-bg-canvas.css',
                light: true,
                hasImage: true,
                iconColourFG: '#0d0d0d',
                iconColourBG: '#f0e8d8'
            },
            {
                name: 'Dark: Black',
                theme: '../inc/css/th-d-bk.css',
                light: false,
                iconColourFG: '#ffffff',
                iconColourBG: '#000000'
            },
            {
                name: 'Dark: Blue',
                theme: '../inc/css/th-d-bu.css',
                light: false,
                iconColourFG: '#ffffff',
                iconColourBG: '#1a1a2e'
            },
            {
                name: 'Dark: Blue with Inverted Fonts',
                theme: '../inc/css/th-d-bu-invert.css',
                light: false,
                iconColourFG: '#1a1a2e',
                iconColourBG: '#ffffff'
            },
            {
                name: 'Dark: Green',
                theme: '../inc/css/th-d-gr.css',
                light: false,
                iconColourFG: '#ffffff',
                iconColourBG: '#1a2e1a'
            },
            {
                name: 'Dark: Polygons Blue',
                theme: '../inc/css/th-d-bg-polygonblue.css',
                light: false,
                hasImage: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#1a1a2e'
            },
            {
                name: 'Dark: Polygons Red',
                theme: '../inc/css/th-d-bg-polygonred.css',
                light: false,
                hasImage: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#2e1a1a'
            },
            {
                name: 'Dark: Black Rows',
                theme: '../inc/css/th-d-bg-rows.css',
                light: false,
                hasImage: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#000000'
            },
            {
                name: 'Experimental: Indoor Kid',
                theme: '../inc/css/th-l-indoor.css',
                light: true,
                iconColourFG: '#333333',
                iconColourBG: '#f5f5dc'
            },
            {
                name: 'Experimental: UofG Blue',
                theme: '../inc/css/th-d-bg-uog-bu.css',
                light: false,
                hasImage: true,
                university: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#003865'
            },
            {
                name: 'Experimental: UofG Blue with Inverted Fonts',
                theme: '../inc/css/th-d-bg-uog-bu-invert.css',
                light: false,
                hasImage: true,
                university: true,
                iconColourFG: '#003865',
                iconColourBG: '#ffffff'
            },
            {
                name: 'Experimental: UofG Black',
                theme: '../inc/css/th-d-bg-uog-bl.css',
                light: false,
                hasImage: true,
                university: true,
                iconColourFG: '#ffffff',
                iconColourBG: '#000000'
            },
            {
                name: 'Experimental: Cream with Inverted Fonts',
                theme: '../inc/css/th-l-e-cr-invert.css',
                light: true,
                iconColourFG: '#f5f0e6',
                iconColourBG: '#0d0d0d'
            },
            {
                name: 'Experimental: Twilight with Inverted Fonts',
                theme: '../inc/css/th-d-e-bg-twilight-invert.css',
                light: false,
                hasImage: true,
                iconColourFG: '#2d3436',
                iconColourBG: '#ffffff'
            },
            {
                name: 'Experimental: Light Green',
                theme: '../inc/css/th-d-e-lgr.css',
                light: false,
                iconColourFG: '#ffffff',
                iconColourBG: '#2d5a2d'
            },
            {
                name: 'Experimental: Orange',
                theme: '../inc/css/th-d-e-or.css',
                light: false,
                iconColourFG: '#ffffff',
                iconColourBG: '#8b4000'
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

            // Colour indicator (uses duotone circle)
            if (config.iconColourFG || config.iconColourBG) {
                const icon = document.createElement('i');
                icon.className = 'fad fa-circle theme-icon';
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

            items.forEach(item => {
                const text = item.textContent;
                let currentType = '';

                // First 3 are Main themes (no star prefix now)
                const itemIndex = Array.from(themePanel.querySelectorAll('li:not(.theme-section-header)')).indexOf(item);
                if (itemIndex < 3) currentType = 'Main';
                else if (text.includes('Sans-Serif')) currentType = 'Font Variants';
                else if (text.startsWith('Light:')) currentType = 'Light Themes';
                else if (text.startsWith('Dark:')) currentType = 'Dark Themes';
                else if (text.startsWith('Experimental:')) currentType = 'Experimental';

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
