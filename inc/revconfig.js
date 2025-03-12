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
                name: '★ Black on Cream',
                theme: '../inc/css/th-l-cr.css'
            },
            { 
                name: '★ White on Underlight Background',
                theme: '../inc/css/th-d-bg-underlit.css'
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
                name: 'Dark: Texture', 
                theme: '../inc/css/th-d-bg-texture.css'
            }
        ],
        transitions: true,
        loadIcons: true,
        },
});