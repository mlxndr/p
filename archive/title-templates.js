/**
 * Common title slide templates for presentations
 */
const titleTemplates = {
    /**
     * Standard academic title slide with university branding
     * @param {Object} options - Configuration options
     * @param {string} options.title - Main title text
     * @param {string} options.subtitle - Optional subtitle text
     * @param {string} options.author - Presenter name
     * @param {string} options.affiliation - Institution name
     * @param {string} options.event - Event name
     * @param {string} options.date - Presentation date
     * @param {boolean} options.showLogos - Whether to display logos
     * @returns {string} HTML for the title slide
     */
    academic: function(options) {
        const subtitle = options.subtitle ? `<h2 class="tpa2 r-fit-text">${options.subtitle}</h2>` : '';
        const logos = options.showLogos ? `
            <tr>
                <td class="tpa4-l"><img src="../img/leverhulme_cmyk_black2.png" height="55em" alt="Leverhulme Trust Logo"></td>
                <td class="tpa4-r"><img src="../img/uog_mono.png" height="58em" alt="University of Glasgow Logo"></td>
            </tr>
        ` : '';
        
        return `
        <section>
            <br><br><br><br><br>
            <h1 class="tpa1 r-fit-text">${options.title}</h1>
            ${subtitle}
            <br><br><br><br><br>
            <table class="tpa3">
                <tr>
                    <td class="tpa4-l">${options.author}<br><span class="subtle">${options.affiliation}</span></td>
                    <td class="tpa4-r">${options.event}<br><span class="subtle">${options.date}</span></td>
                </tr>
                <tr style="padding-bottom: 5em; padding-top: 5em"><td colspan="2"><hr></td></tr>
                ${logos}
            </table>
        </section>
        `;
    },
    
    /**
     * Course lecture title slide
     * @param {Object} options - Configuration options
     * @param {string} options.title - Main title text
     * @param {string} options.course - Course name/code
     * @param {string} options.lecturer - Lecturer name and title
     * @returns {string} HTML for the lecture title slide
     */
    lecture: function(options) {
        return `
        <section>
            <br><br><br><br><br><br><h1 class="tpa1 r-fit-text">${options.title}</h1>
            <br><br><br><br><br><br>
            <table class="tpa3">
                <tr style="padding-bottom: 5em; padding-top: 5em"><td colspan="2"><hr></td></tr>
                <tr>
                    <td class="tpa4-l">${options.course}<small><br>${options.lecturer}</small></td>
                    <td class="tpa4-r"><img src="../img/uog_mono.png" height="90em" alt="University of Glasgow Logo"></td>
                </tr>
            </table>
        </section>
        `;
    }
};

// Helper function to insert a title slide
function insertTitleSlide(type, options) {
    if (titleTemplates[type]) {
        const titleSlideHTML = titleTemplates[type](options);
        // Find the slides container
        const slidesContainer = document.querySelector('.reveal .slides');
        if (slidesContainer) {
            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = titleSlideHTML;
            // Insert at the beginning
            slidesContainer.insertBefore(tempContainer.firstElementChild, slidesContainer.firstChild);
        } else {
            console.error('Slides container not found');
        }
    } else {
        console.error(`Title template "${type}" not found`);
    }
}