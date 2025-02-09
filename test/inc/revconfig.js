Reveal.initialize({
    plugins: [ RevealMenu ],
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
                name: 'Dark Background', 
                theme: 'css/th-d-bg.css'
            },
            { 
                name: 'Dark Black',
                theme: 'css/th-d-bl.css'
            },
            { 
                name: 'Dark Green',
                theme: 'css/th-d-gr.css'
            },
            { 
                name: 'Dark Blue',
                theme: 'css/th-d-bu.css'
            },
            { 
                name: 'Light White',
                theme: 'css/th-l-wh.css'
            },
            { 
                name: 'Light Cream',
                theme: 'css/th-l-cr.css'
            },
            { 
                name: 'Light Background',
                theme: 'css/th-l-bg.css'
            }
        ],
        transitions: true,
        loadIcons: true
        },
    controls: true,
    progress: true,
    center: true,
    hash: true,
    transition: 'slide'
});