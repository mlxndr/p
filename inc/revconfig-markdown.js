// Function to switch logos based on theme
function switchLogosForTheme(theme) {
    let isDarkTheme;
    
    console.log("switchLogosForTheme called with:", theme);
    
    // Check if the theme is a string (like a URL) or a boolean
    if (typeof theme === 'boolean') {
        isDarkTheme = theme;
    } else {
        // First try to determine theme from filename
        if (typeof theme === 'string' && theme.includes('th-d-')) {
            isDarkTheme = true;
        } else if (typeof theme === 'string' && theme.includes('th-l-')) {
            isDarkTheme = false;
        } else {
            // If that fails, check for dark text/background color as a fallback
            try {
                // Check if the current theme has a dark background by analyzing the body color
                const bodyColor = window.getComputedStyle(document.body).color;
                // Extract RGB values from the color string
                const rgb = bodyColor.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    // If the text color is light (high values), then background is likely dark
                    const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
                    isDarkTheme = brightness > 128;
                    console.log("Determined theme from body text color brightness:", brightness, "isDark:", isDarkTheme);
                } else {
                    // Default to light theme if we can't determine
                    isDarkTheme = false;
                }
            } catch (e) {
                console.error("Error detecting theme:", e);
                // Default to light theme
                isDarkTheme = false;
            }
        }
    }
    
    console.log("Switching logos, isDark:", isDarkTheme);
    
    // First try with relative paths
    let uogLogos = document.querySelectorAll('img[src*="uog_mono.png"], img[src*="uog_white.png"]');
    let leverhulmeLogos = document.querySelectorAll('img[src*="leverhulme_cmyk_black2.png"], img[src*="leverhulme_cmyk_white2.png"]');
    
    // If we don't find any, try with absolute paths
    if (uogLogos.length === 0) {
        uogLogos = document.querySelectorAll('img[src$="uog_mono.png"], img[src$="uog_white.png"]');
    }
    
    if (leverhulmeLogos.length === 0) {
        leverhulmeLogos = document.querySelectorAll('img[src$="leverhulme_cmyk_black2.png"], img[src$="leverhulme_cmyk_white2.png"]');
    }
    
    console.log("Found UoG logos:", uogLogos.length);
    console.log("Found Leverhulme logos:", leverhulmeLogos.length);
    
    uogLogos.forEach(logo => {
        console.log("Changing UoG logo from", logo.src);
        // Get the directory part of the path
        const path = logo.src.substring(0, logo.src.lastIndexOf('/') + 1);
        logo.src = isDarkTheme ? path + 'uog_white.png' : path + 'uog_mono.png';
        console.log("  to", logo.src);
    });
    
    leverhulmeLogos.forEach(logo => {
        console.log("Changing Leverhulme logo from", logo.src);
        // Get the directory part of the path
        const path = logo.src.substring(0, logo.src.lastIndexOf('/') + 1);
        logo.src = isDarkTheme ? path + 'leverhulme_cmyk_white2.png' : path + 'leverhulme_cmyk_black2.png';
        console.log("  to", logo.src);
    });
}

Reveal.initialize({
    plugins: [ RevealMarkdown, RevealMenu, RevealNotes ],
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
        custom: [
            {
                title: 'Info',
                icon: '<i class="fa fa-info">ℹ</i>',
                content: '<div class="slide-menu-info"><br><small>' +
                        '<i class="fa-solid fa-person-chalkboard" aria-hidden="true" style="opacity: 0.4;"></i> Created using <a href="https://revealjs.com" target="blank">reveal.js</a> & <a href="https://github.com/denehyg/reveal.js-menu" target="blank">reveal.js-menu</a><br>' +
                        '<i class="fa-solid fa-user-pen" aria-hidden="true" style="opacity: 0.4;"></i> Customisations by Marc Alexander <br>' +
                        '<i class="fa-solid fa-font" aria-hidden="true" style="opacity: 0.4;"></i> Fonts by <a href="https://mbtype.com/" target="blank">Matthew Butterick</a> <br>' +
                        '<i class="fa-brands fa-github" aria-hidden="true" style="opacity: 0.4;"></i> Hosted on <a href="https://mlxndr.github.io/" target="blank">GitHub</a><br></small>' +
                        '</div>'
            }
        ],
        numbers: false,
        titleSelector: 'h1, h2, h3',
        useTextContentForMissingTitles: true,
        hideMissingTitles: false,
        openButton: false,
        keyboard: true,
        markers: true,
        themes: [
            { 
                name: 'Dark Black',
                theme: '../css/th-d-bl.css'
            },
            { 
                name: 'Dark Green',
                theme: '../css/th-d-gr.css'
            },
            { 
                name: 'Dark Blue',
                theme: '../css/th-d-bu.css'
            },
            { 
                name: 'Dark Concrete', 
                theme: '../css/th-d-bg-concrete.css'
            },
            { 
                name: 'Dark Polygons Blue', 
                theme: '../css/th-d-bg-polygonblue.css'
            },
            { 
                name: 'Dark Polygons Red', 
                theme: '../css/th-d-bg-polygonred.css'
            },
            { 
                name: 'Dark Many Polygons', 
                theme: '../css/th-d-bg-polygonmany.css'
            },
            { 
                name: 'Dark Texture', 
                theme: '../css/th-d-bg-texture.css'
            },
            { 
                name: 'Light Cream',
                theme: '../css/th-l-cr.css'
            },
            { 
                name: 'Light White',
                theme: '../css/th-l-wh.css'
            },
            { 
                name: 'Light Canvas',
                theme: '../css/th-l-bg-canvas.css'
            },
            { 
                name: 'Light Paper',
                theme: '../css/th-l-bg-paper.css'
            },
            { 
                name: 'Light Plaster',
                theme: '../css/th-l-bg-plaster.css'
            }
        ],
        transitions: true,
        loadIcons: true,
        // Add theme change callback for the menu
        themeSwitched: function(themeName, themeUrl) {
            console.log("Menu callback: theme switched to", themeUrl);
            switchLogosForTheme(themeUrl);
        }
        },
    controls: true,
    progress: true,
    center: false,
    hash: true,
    transition: 'slide'
});

// For direct access to logo switching
window.switchThemeLogos = function(isDark) {
    switchLogosForTheme(isDark ? 'th-d-' : 'th-l-');
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, setting up theme handling");
    
    // Try to find any logos that might be on the page initially
    const initialLogos = document.querySelectorAll('img[src*="uog_mono.png"], img[src*="uog_white.png"], img[src*="leverhulme_cmyk_black2.png"], img[src*="leverhulme_cmyk_white2.png"]');
    console.log("Initial logos found:", initialLogos.length);
    
    // Handle the initial theme
    setTimeout(() => {
        const initialStylesheet = document.querySelector('link[rel="stylesheet"][href*="th-"]');
        if (initialStylesheet) {
            const themeHref = initialStylesheet.getAttribute('href');
            console.log("Initial theme detected:", themeHref);
            switchLogosForTheme(themeHref);
        } else {
            console.log("No initial theme stylesheet found");
        }
    }, 500); // Small delay to ensure everything is loaded
    
    // Set up alternate event listeners for reveal.js menu
    document.addEventListener('click', (event) => {
        // Check if it's a theme menu item that was clicked
        if (event.target && event.target.closest('.slide-menu-item[data-theme]')) {
            const themeItem = event.target.closest('.slide-menu-item[data-theme]');
            const themeUrl = themeItem.getAttribute('data-theme');
            console.log("Menu theme change detected via click:", themeUrl);
            setTimeout(() => switchLogosForTheme(themeUrl), 100); // Small delay for theme to apply
        }
    });
    
    // Also listen for any theme changes that might happen outside the menu
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                const target = mutation.target;
                if (target.getAttribute('rel') === 'stylesheet' && target.getAttribute('href').includes('th-')) {
                    console.log("Theme change detected via mutation:", target.getAttribute('href'));
                    switchLogosForTheme(target.getAttribute('href'));
                }
            }
        });
    });
    
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(sheet => {
        observer.observe(sheet, { attributes: true });
    });
    
    // Additional theme change detection for reveal.js
    if (typeof Reveal !== 'undefined') {
        console.log("Setting up Reveal event listeners");
        Reveal.on('ready', () => {
            console.log("Reveal ready event fired");
            setTimeout(() => {
                const currentStylesheet = document.querySelector('link[rel="stylesheet"][href*="th-"]');
                if (currentStylesheet) {
                    console.log("Theme on Reveal ready:", currentStylesheet.getAttribute('href'));
                    switchLogosForTheme(currentStylesheet.getAttribute('href'));
                }
            }, 500);
        });
    }
});