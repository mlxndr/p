/**
 * Common footer slide templates for presentations
 */
const footerTemplates = {
    /**
     * Standard academic footer slide with contact information
     * @param {Object} options - Configuration options
     * @param {string} options.title - Main title text
     * @param {string} options.subtitle - Optional subtitle text
     * @param {string} options.authors - Author(s) with HTML formatting
     * @param {string} options.email - Email address(es) with HTML formatting
     * @param {string} options.slidesUrl - Optional URL to slides
     * @param {boolean} options.showLogos - Whether to display logos
     * @returns {string} HTML for the footer slide
     */
    academic: function(options) {
        const subtitle = options.subtitle ? `<h2 class="tpa2 r-fit-text">${options.subtitle}</h2>` : '';
        const slidesUrlCell = options.slidesUrl ? `<td class="tpa4-r" style="vertical-align: bottom;">Slides: ${options.slidesUrl}</td>` : '<td class="tpa4-r"></td>';
        const logos = options.showLogos ? `
            <td class="tpa4-l" style="line-height: 2.2;">
                <img src="../img/uog_mono.png" width="200px" alt="University of Glasgow Logo"><br>
                <img src="../img/leverhulme_cmyk_black2.png" width="200px" alt="Leverhulme Trust Logo">
            </td>
        ` : '<td class="tpa4-l"></td>';
        
        return `
        <section>
            <h1 class="tpa1 r-fit-text">${options.title}</h1>
            ${subtitle}
            <br><br><br><br><br>
            <table class="tpa3">
                <tr>
                    <td class="tpa4-l">${options.authors}<br><span style="font-size: 0.7em;">${options.email}</span></td>
                    ${slidesUrlCell}
                </tr>
                <tr style="padding-bottom: 5em; padding-top: 5em"><td colspan="2"><hr></td></tr>
                <tr>
                    ${logos}
                    <td class="tpa4-r"></td>
                </tr>
            </table>
        </section>
        `;
    },
    
    /**
     * Course lecture footer slide with follow-up information
     * @param {Object} options - Configuration options
     * @param {string} options.heading - Heading text (e.g., "Follow-up")
     * @param {Array} options.items - Array of follow-up items to display as bullet points
     * @param {string} options.contactInfo - Optional contact information
     * @returns {string} HTML for the lecture footer slide
     */
    lecture: function(options) {
        const items = options.items.map(item => `<li>${item}</li>`).join('');
        const contactInfo = options.contactInfo ? `<p>${options.contactInfo}</p>` : '';
        
        return `
        <section>
            <h2>${options.heading}</h2>
            <p>You should now:</p>
            <ul>
                ${items}
            </ul>
            ${contactInfo}
        </section>
        `;
    }
};

// Helper function to append a footer slide
function appendFooterSlide(type, options) {
    if (footerTemplates[type]) {
        const footerSlideHTML = footerTemplates[type](options);
        // Find the slides container
        const slidesContainer = document.querySelector('.reveal .slides');
        if (slidesContainer) {
            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = footerSlideHTML;
            // Append at the end
            slidesContainer.appendChild(tempContainer.firstElementChild);
        } else {
            console.error('Slides container not found');
        }
    } else {
        console.error(`Footer template "${type}" not found`);
    }
}