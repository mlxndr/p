# External Markdown Files Template for reveal.js

This template demonstrates how to create presentations using external Markdown files for optimal content management.

## Directory Structure

```
template-demo-external/
├── index.html           # Main HTML file that links to Markdown files
├── slides/              # Directory containing all Markdown content files
│   ├── 01-intro.md      # First slide content
│   ├── 02-features.md   # Second slide content
│   └── ...              # Additional slide content files
└── README.md            # This documentation file
```

## How It Works

1. **HTML Structure**: The main `index.html` file contains:
   - Title slide (HTML for complex formatting)
   - References to external Markdown files
   - Footer slide (HTML for complex formatting)
   - Required script includes

2. **Markdown Content**: Each slide's content is stored in a separate `.md` file in the `slides/` directory
   - Files are named with numeric prefixes (e.g., `01-`, `02-`) to maintain order
   - Each file contains the content for one slide

3. **Referencing Markdown Files**: In the HTML, each slide is referenced using:
   ```html
   <section data-markdown="slides/01-intro.md"></section>
   ```

## Benefits of External Markdown Files

1. **Separation of Content and Presentation**:
   - Content authors can focus on writing markdown files
   - Designers can focus on the HTML structure and styling

2. **Easy Content Editing**:
   - Edit individual slides without opening the entire presentation
   - Use your favorite Markdown editor
   - Better diff/comparison in version control

3. **Simplified Workflow**:
   - Add new slides by creating new Markdown files
   - Reorder slides by renaming files or changing the order in HTML
   - Reuse content across presentations

4. **Collaboration**:
   - Multiple people can work on different slides without conflicts
   - Clean version control history

## Usage Instructions

### Creating a New Presentation

1. Copy this entire directory to create a new presentation
2. Update the title and footer slides in `index.html`
3. Create/modify Markdown files in the `slides/` directory
4. Reference your slides in the `index.html` file

### Adding a New Slide

1. Create a new Markdown file in `slides/` (e.g., `06-new-slide.md`)
2. Add your slide content using Markdown
3. Add a reference in `index.html`:
   ```html
   <section data-markdown="slides/06-new-slide.md"></section>
   ```

### Markdown Features

All regular reveal.js Markdown features are supported:

- Speaker notes using the `notes:` separator
- Fragments using `<!-- .element: class="fragment" -->` comments
- HTML can be mixed with Markdown for complex formatting
- Code highlighting
- And more!

## Examples

See these examples:
1. Academic presentation: `/template-demo-external/`
2. Lecture presentation: `/template-lecture-external/`