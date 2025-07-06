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
                name: 'Experimental: UofG Blue', 
                theme: '../inc/css/th-d-bg-uog-bu.css'
            },
            { 
                name: 'Experimental: UofG Blue with Inverted Fonts', 
                theme: '../inc/css/th-d-bg-uog-bu-inv.css'
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
            }
        ],
        transitions: true,
        custom: [
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