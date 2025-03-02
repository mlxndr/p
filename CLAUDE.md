# CLAUDE.md - Repository Guidelines

## Project Overview
- Academic presentation website using reveal.js
- Static HTML/CSS/JS with custom themes and styling
- Presentations organized in separate directories
- Template system for consistent structure and reduced duplication

## Commands
- No build pipeline - static website
- Preview locally: `python -m http.server` (then visit http://localhost:8000)
- Create new presentation: Use template system (see "Template System" section below)

## Code Style & Best Practices
- HTML: Use proper semantic elements and indentation
- CSS: Follow existing naming conventions (th-*, tp*) for themes
- JavaScript: ES6+ syntax, async/await for API calls
- File Structure: One directory per presentation, shared resources in css/img/inc

## Naming Conventions
- Presentation directories: Descriptive, kebab-case (e.g., `dsna25`)
- CSS classes: Descriptive, lowercase with hyphens
- JS variables: camelCase
- Functions: camelCase with descriptive names

## Error Handling
- Use try/catch blocks for asynchronous operations
- Provide user-friendly error messages
- Console.error for debugging information

## Accessibility
- Include descriptive alt text for images
- Use semantic HTML and ARIA attributes where appropriate
- Test with multiple themes for contrast

## Template System
The repository includes multiple template options to create presentations with less duplication:

### HTML Templates (Basic)
1. Create a new directory for your presentation
2. Copy the basic structure from `/template-demo/index.html` or `/template-lecture/index.html`
3. Customize the title, content slides, and footer section

### Markdown Templates (Embedded)
1. Create a new directory for your presentation
2. Copy from `/template-demo-markdown/index.html` or `/template-lecture-markdown/index.html`
3. Edit Markdown content within the `<textarea data-template>` blocks

### External Markdown Templates
1. Create a new directory for your presentation
2. Copy from `/template-demo-external/` or `/template-lecture-external/`
3. Edit individual Markdown files in the `slides/` directory
4. Reference your slides in the main HTML file

### Single Markdown File Template (Recommended)
1. Create a new directory for your presentation
2. Copy from `/template-single-file/`
3. Edit the single `slides/presentation.md` file with all your content
4. Slides are separated by the `---` delimiter (with newlines before and after)

### Key Template Components
- `inc/presentation-head.html`: Common head elements
- `inc/presentation-scripts.html`: Common scripts (HTML templates)
- `inc/presentation-scripts-markdown.html`: Scripts with Markdown support
- `inc/revconfig.js`: Shared reveal.js configuration
- `inc/revconfig-markdown.js`: Configuration with Markdown support

### Available Templates
- HTML Templates:
  - Academic: `/template-demo/` 
  - Lecture: `/template-lecture/`
- Embedded Markdown:
  - Academic: `/template-demo-markdown/`
  - Lecture: `/template-lecture-markdown/`
- External Markdown Files: 
  - Academic: `/template-demo-external/`
  - Lecture: `/template-lecture-external/`
- Single Markdown File (Recommended):
  - `/template-single-file/`

See detailed documentation in each template directory's README.md file