/**
 * Handout Generator
 * Converts presentation markdown to printable handout format using marked.js
 *
 * Requires: marked.js to be loaded before this script
 * Add to handout.html: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Check if marked is available
    if (typeof marked === 'undefined') {
        document.getElementById('handout-content').innerHTML =
            '<p style="color: #c00;">Error: marked.js library not loaded. ' +
            'Add <code>&lt;script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"&gt;&lt;/script&gt;</code> ' +
            'before handout.js in your HTML.</p>';
        return;
    }

    // Fill the header from meta.json (merged over ../inc/site.json), so the
    // handout never hand-copies the title. A hand-written <h1> in the page
    // wins; the generated one only appears if #handout-title exists.
    try {
        const [site, meta] = await Promise.all([
            fetch('../inc/site.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
            fetch('./meta.json').then(r => r.ok ? r.json() : null).catch(() => null)
        ]);
        if (meta) {
            const m = Object.assign({}, site, meta);
            const full = m.title + (m.subtitle ? ': ' + m.subtitle : '');
            document.title = full.replace(/\*/g, '');
            const h1 = document.getElementById('handout-title');
            if (h1) h1.innerHTML = full.replace(/\*([^*]+)\*/g, '<i>$1</i>');
            const header = document.getElementById('handout-header');
            if (header && !header.innerHTML.trim()) {
                const authors = (m.authors && m.authors.length)
                    ? m.authors.map(a => a.name).join(' and ')
                    : m.author;
                header.innerHTML = '<p class="handout-meta">' + [authors,
                    [m.event, m.location].filter(Boolean).join(', '), m.date]
                    .filter(Boolean).join(' · ') + '</p>';
            }
        }
    } catch (e) {
        console.warn('handout meta:', e);
    }

    try {
        // Configure marked for academic content
        marked.setOptions({
            gfm: true,          // GitHub Flavored Markdown
            breaks: false,      // Don't convert single newlines to <br>
            smartypants: true   // Smart quotes and dashes (if available in version)
        });

        // Load and parse content.md
        const mdResponse = await fetch('./content.md');
        if (!mdResponse.ok) {
            throw new Error(`Failed to load content.md: ${mdResponse.status} ${mdResponse.statusText}`);
        }
        let mdContent = await mdResponse.text();

        // Expand @-directives into markup if the expander is loaded
        // (add <script src="../inc/directives.js"></script> before this file)
        if (typeof expandDirectives === 'function') {
            mdContent = expandDirectives(mdContent, { name: 'content.md' }).markdown;
        }

        // Process the markdown content
        // Remove slide separators (--- and --) and convert to section breaks
        let processedContent = mdContent
            // Remove speaker notes
            .replace(/^notes:[\s\S]*?(?=\n---|\n--|\n##|$)/gm, '')
            // Convert horizontal slide separators to section breaks
            .replace(/\n---\n/g, '\n\n<hr class="section-break">\n\n')
            // Convert vertical slide separators to lighter breaks
            .replace(/\n--\n/g, '\n\n<hr class="subsection-break">\n\n');

        // Parse markdown to HTML
        const contentHTML = marked.parse(processedContent);

        // Wrap in sections for styling
        const wrappedHTML = '<div class="handout-sections">' + contentHTML + '</div>';

        document.getElementById('handout-content').innerHTML = wrappedHTML;

    } catch (error) {
        console.error('Error loading handout content:', error);
        document.getElementById('handout-content').innerHTML =
            '<p style="color: #c00;">Error loading content: ' + error.message + '</p>';
    }
});
