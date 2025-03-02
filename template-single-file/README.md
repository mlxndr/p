# Single Markdown File Template for reveal.js

This template demonstrates how to create presentations using a single Markdown file that contains multiple slides separated by delimiters.

## Directory Structure

```
template-single-file/
├── index.html           # Main HTML file that references the Markdown file
├── slides/              # Directory containing the Markdown file
│   └── presentation.md  # Single file containing all slides
└── README.md            # This documentation file
```

## How It Works

1. **HTML Structure**: The main `index.html` file contains:
   - Title slide (HTML for complex formatting)
   - A single section referencing the Markdown file with separator configuration
   - Footer slide (HTML for complex formatting)
   - Required script includes

2. **Markdown Content**: All slides are contained in a single `presentation.md` file:
   - Slides are separated by the delimiter `---` (with newlines before and after)
   - Vertical slides can be separated by `--` (if enabled)
   - Speaker notes are separated by `notes:` at the beginning of a line

3. **Referencing the Markdown File**: In the HTML, the slides are referenced using:
   ```html
   <section data-markdown="slides/presentation.md"
            data-separator="^\n---\n"
            data-separator-vertical="^\n--\n"
            data-separator-notes="^notes:"
            data-charset="utf-8">
   </section>
   ```

## Benefits of the Single File Approach

1. **Unified Content Management**:
   - All slides in one file for easier editing
   - Better visualization of the presentation flow
   - Simpler to reorder slides by moving content within the file

2. **Great for Sequential Content**:
   - Perfect for presentations where slides follow a logical order
   - Easier to maintain narrative consistency
   - See all your content in one place

3. **Simplified Version Control**:
   - Track changes to your entire presentation in one file
   - Simpler diffs when reviewing changes
   - Less complexity with fewer files

4. **Easy to Share and Backup**:
   - Single file containing all your content
   - Simpler to email or share with collaborators
   - One file to backup or archive

## Usage Instructions

### Creating a New Presentation

1. Copy this entire directory to create a new presentation
2. Update the title and footer slides in `index.html`
3. Edit the `slides/presentation.md` file with your content
4. Separate slides with the `---` delimiter (with newlines before and after)

### Adding a New Slide

Simply add content to your Markdown file, separated by the slide delimiter:

```markdown
Content for current slide

---

Content for new slide
```

### Slide Separator Configuration

You can customize the slide separators in the HTML file:

```html
<section data-markdown="slides/presentation.md"
         data-separator="^\n---\n"           <!-- Horizontal slide separator -->
         data-separator-vertical="^\n--\n"   <!-- Vertical slide separator -->
         data-separator-notes="^notes:"      <!-- Speaker notes separator -->
         data-charset="utf-8">
</section>
```

## Markdown Features

All regular reveal.js Markdown features are supported:

- Speaker notes using the `notes:` separator
- Fragments using `<!-- .element: class="fragment" -->` comments
- HTML can be mixed with Markdown for complex formatting
- Code highlighting
- And more!

## Examples

See the example in `/template-single-file/` which demonstrates all these features.