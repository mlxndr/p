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
    transition: 'slide',
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
                name: 'Experimental: Blue with Inverted Fonts',
                theme: '../inc/css/th-d-bu-invert.css'
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
                theme: '../inc/css/th-e-l-cr-invert.css'
            },
            { 
                name: 'Experimental: Twilight with Inverted Fonts', 
                theme: '../inc/css/th-e-bg-twilight-invert.css'
            },
            { 
                name: 'Experimental: Light Green', 
                theme: '../inc/css/th-e-lgr.css'
            },
            { 
                name: 'Experimental: Orange', 
                theme: '../inc/css/th-e-or.css'
            }
        ],
        transitions: true,
        custom: [
            {
                title: 'ModTheme',
                icon: '<i class="fa fa-palette">🎨</i>',
                content: `
                    <div class="modular-theme-builder" style="padding: 15px; max-width: 600px;">
                        <h3 style="margin-top: 0; font-size: 1.2em;">Modular Theme Builder</h3>
                        <p style="font-size: 0.85em; opacity: 0.8; margin-bottom: 20px;">
                            Compose your theme by selecting components from each layer.
                        </p>

                        <div class="theme-layer" style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9em;">
                                <i class="fa fa-palette"></i> Color Palette
                            </label>
                            <select id="modtheme-palette" style="width: 100%; padding: 8px; font-size: 0.9em; border-radius: 4px;">
                                <option value="cream">Cream (Light) - WCAG AAA</option>
                                <option value="paper">Paper (Light) - WCAG AAA</option>
                                <option value="uog-blue">UoG Blue (Dark) - WCAG AAA</option>
                                <option value="midnight">Midnight (Dark) - WCAG AAA</option>
                            </select>
                        </div>

                        <div class="theme-layer" style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9em;">
                                <i class="fa fa-font"></i> Typography
                            </label>
                            <select id="modtheme-typography" style="width: 100%; padding: 8px; font-size: 0.9em; border-radius: 4px;">
                                <option value="concourse">Concourse + Equity</option>
                                <option value="century">Concourse + Century Supra</option>
                                <option value="atkinson">Atkinson Hyperlegible</option>
                            </select>
                        </div>

                        <div class="theme-layer" style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9em;">
                                <i class="fa fa-align-left"></i> Layout
                            </label>
                            <select id="modtheme-layout" style="width: 100%; padding: 8px; font-size: 0.9em; border-radius: 4px;">
                                <option value="standard">Standard (Left-aligned)</option>
                                <option value="centered">Centered Headings</option>
                            </select>
                        </div>

                        <div class="theme-layer" style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.9em;">
                                <i class="fa fa-image"></i> Background
                            </label>
                            <select id="modtheme-background" style="width: 100%; padding: 8px; font-size: 0.9em; border-radius: 4px;">
                                <option value="none">None (Solid Color)</option>
                                <option value="paper">Paper Texture</option>
                                <option value="polygons">Polygons Pattern</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <button id="modtheme-apply" style="flex: 1; padding: 10px; background: #2F5A8C; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                                <i class="fa fa-check"></i> Apply Theme
                            </button>
                            <button id="modtheme-reset" style="padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
                                <i class="fa fa-undo"></i> Reset
                            </button>
                        </div>

                        <div id="modtheme-status" style="font-size: 0.85em; padding: 10px; border-radius: 4px; display: none;"></div>

                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(128,128,128,0.3); font-size: 0.8em; opacity: 0.7;">
                            <p style="margin: 5px 0;">
                                💡 Theme changes are saved automatically and will persist across sessions.
                            </p>
                        </div>
                    </div>
                `
            },
            {
                title: 'Info',
                icon: '<i class="fa fa-info">ℹ</i>',
                content: '<div class="slide-menu-info"><br><small>' +
                        '<p><i class="fa-solid fa-person-chalkboard" aria-hidden="true" style="opacity: 0.4;"></i> Created using <a href="https://revealjs.com" target="blank">reveal.js</a> & <a href="https://github.com/denehyg/reveal.js-menu" target="blank">reveal.js-menu</a></p>' +
                        '<p><i class="fa-solid fa-user-pen" aria-hidden="true" style="opacity: 0.4;"></i> Customisations by <a href="https://mga.is" target="blank">Marc Alexander</a></p>' +
                        '<p><i class="fa-solid fa-font" aria-hidden="true" style="opacity: 0.4;"></i> Concourse, Equity, Century Supra fonts by <a href="https://mbtype.com/" target="blank">Matthew Butterick</a>, accessible font Atkinson Hyperlegible by the <a href="https://brailleinstitute.org/freefont" target="blank">Braille Institute</a>, and monospaced font by <a href="https://www.jetbrains.com/lp/mono">JetBrains</a></p>' +
                        '<p><i class="fa-solid fa-images" aria-hidden="true" style="opacity: 0.4;"></i> Slide backgrounds by <a href="https://https://basicappleguy.com/" target="blank">BasicAppleGuy</a> and <a href="https://unsplash.com" target="blank">Unsplash</a></p>' +                        '<p><i class="fa-brands fa-github" aria-hidden="true" style="opacity: 0.4;"></i> Hosted on <a href="https://mlxndr.github.io/" target="blank">GitHub</a></p></small>' +                        '</div  >'
            }
        ],
        loadIcons: true,
        },
});

// Initialize Modular Theme Builder UI
Reveal.on('ready', function() {
    // Initialize theme composer
    if (!window.themeComposer) {
        console.error('ThemeComposer not loaded');
        return;
    }

    // Load saved state or defaults
    const savedState = window.themeComposer.loadState();

    // Set dropdown values to current state
    function updateDropdowns() {
        const composition = window.themeComposer.getComposition();

        const paletteSelect = document.getElementById('modtheme-palette');
        const typographySelect = document.getElementById('modtheme-typography');
        const layoutSelect = document.getElementById('modtheme-layout');
        const backgroundSelect = document.getElementById('modtheme-background');

        if (paletteSelect && composition.palette) {
            paletteSelect.value = composition.palette;
        }
        if (typographySelect && composition.typography) {
            typographySelect.value = composition.typography;
        }
        if (layoutSelect && composition.layout) {
            layoutSelect.value = composition.layout;
        }
        if (backgroundSelect && composition.background) {
            backgroundSelect.value = composition.background;
        }
    }

    // Show status message
    function showStatus(message, type = 'success') {
        const status = document.getElementById('modtheme-status');
        if (!status) return;

        status.textContent = message;
        status.style.display = 'block';
        status.style.background = type === 'success' ? 'rgba(0, 128, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
        status.style.color = type === 'success' ? '#006400' : '#8B0000';

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    // Apply button handler
    document.addEventListener('click', function(e) {
        if (e.target.id === 'modtheme-apply' || e.target.closest('#modtheme-apply')) {
            const palette = document.getElementById('modtheme-palette')?.value;
            const typography = document.getElementById('modtheme-typography')?.value;
            const layout = document.getElementById('modtheme-layout')?.value;
            const background = document.getElementById('modtheme-background')?.value;

            if (palette && typography && layout && background) {
                window.themeComposer.compose({
                    palette: palette,
                    typography: typography,
                    layout: layout,
                    background: background
                });

                showStatus('✓ Theme applied successfully!', 'success');

                // Force Reveal to recalculate layout
                setTimeout(() => {
                    Reveal.layout();
                }, 100);
            }
        }

        // Reset button handler
        if (e.target.id === 'modtheme-reset' || e.target.closest('#modtheme-reset')) {
            if (confirm('Reset to default theme? This will clear your saved preferences.')) {
                window.themeComposer.compose({
                    palette: 'cream',
                    typography: 'concourse',
                    layout: 'standard',
                    background: 'none'
                });

                updateDropdowns();
                showStatus('✓ Theme reset to defaults', 'success');

                setTimeout(() => {
                    Reveal.layout();
                }, 100);
            }
        }
    });

    // Update dropdowns when menu opens
    Reveal.on('menuOpened', function() {
        setTimeout(updateDropdowns, 100);
    });

    // Initial dropdown update
    setTimeout(updateDropdowns, 500);
});