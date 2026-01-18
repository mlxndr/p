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
                name: '★ Black on Cream',
                theme: '../inc/css/th-l-cr.css'
            },
            { 
                name: '★ White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight.css'
            },
            { 
                name: '★ High Accessibility', 
                theme: '../inc/css/th-l-acc.css'
            },
            { 
                name: 'All Sans-Serif: Black on Cream',
                theme: '../inc/css/th-l-cr-m.css'
            },
            { 
                name: 'All Sans-Serif: Black on Cream, Thin Body Text',
                theme: '../inc/css/th-l-cr-m-thin.css'
            },
            { 
                name: 'All Sans-Serif: White on Twilight Background',
                theme: '../inc/css/th-d-bg-twilight-m.css'
            },
            { 
                name: 'Light: Paper',
                theme: '../inc/css/th-l-bg-paper.css'
            },
            { 
                name: 'Light: Plaster',
                theme: '../inc/css/th-l-bg-plaster.css'
            },
            { 
                name: 'Light: Canvas',
                theme: '../inc/css/th-l-bg-canvas.css'
            },
            { 
                name: 'Dark: Black',
                theme: '../inc/css/th-d-bk.css'
            },
            { 
                name: 'Dark: Blue',
                theme: '../inc/css/th-d-bu.css'
            },
            { 
                name: 'Dark: Blue with Inverted Fonts',
                theme: '../inc/css/th-d-bu-invert.css'
            },
            { 
                name: 'Dark: Green',
                theme: '../inc/css/th-d-gr.css'
            },
            { 
                name: 'Dark: Polygons Blue', 
                theme: '../inc/css/th-d-bg-polygonblue.css'
            },
            { 
                name: 'Dark: Polygons Red', 
                theme: '../inc/css/th-d-bg-polygonred.css'
            },
            { 
                name: 'Dark: Black Rows', 
                theme: '../inc/css/th-d-bg-rows.css'
            },
            { 
                name: 'Experimental: Indoor Kid', 
                theme: '../inc/css/th-l-indoor.css'
            },
            { 
                name: 'Experimental: UofG Blue', 
                theme: '../inc/css/th-d-bg-uog-bu.css'
            },
            { 
                name: 'Experimental: UofG Blue with Inverted Fonts', 
                theme: '../inc/css/th-d-bg-uog-bu-invert.css'
            },
            { 
                name: 'Experimental: UofG Black', 
                theme: '../inc/css/th-d-bg-uog-bl.css'
            },
            { 
                name: 'Experimental: Cream with Inverted Fonts', 
                theme: '../inc/css/th-l-e-cr-invert.css'
            },
            { 
                name: 'Experimental: Twilight with Inverted Fonts', 
                theme: '../inc/css/th-d-e-bg-twilight-invert.css'
            },
            { 
                name: 'Experimental: Light Green', 
                theme: '../inc/css/th-d-e-lgr.css'
            },
            { 
                name: 'Experimental: Orange', 
                theme: '../inc/css/th-d-e-or.css'
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
        // Inject theme icons
        const themeItems = document.querySelectorAll('.slide-menu-panel[data-panel="Themes"] li');
        themeItems.forEach(item => {
            const text = item.textContent;
            let iconClass = 'fa-circle'; // default for color-only themes

            if (text.includes('Accessibility') || text.includes('Accessible')) {
                iconClass = 'fa-universal-access';
            } else if (text.includes('Light:') || text.includes('Cream') || text.includes('Paper') || text.includes('Plaster') || text.includes('Canvas')) {
                iconClass = 'fa-lightbulb-on';
            } else if (text.includes('Polygons') || text.includes('Rows') || text.includes('Twilight') || text.includes('Background')) {
                iconClass = 'fa-images';
            } else if (text.includes('Dark:')) {
                iconClass = 'fa-moon-stars';
            }

            // Prepend icon
            const icon = document.createElement('i');
            icon.className = `fad ${iconClass} theme-icon`;
            item.insertBefore(icon, item.firstChild);
        });

        // Add section headers to theme list
        const themePanel = document.querySelector('.slide-menu-panel[data-panel="Themes"] ul');
        if (themePanel) {
            const items = themePanel.querySelectorAll('li');
            let lastType = '';

            items.forEach(item => {
                const text = item.textContent;
                let currentType = '';

                if (text.startsWith('★')) currentType = 'Favorites';
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
    });
})();