# Slide Templates Library

This directory contains reusable slide templates for common academic presentation patterns. These templates are designed to work with the Reveal.js presentation system used in this repository.

## How to Use Templates

1. **Browse** the templates below to find the pattern you need
2. **Copy** the markdown code from the template file
3. **Paste** into your `content.md` file
4. **Customize** the content for your specific needs

All templates use standard Reveal.js markdown syntax and work with the existing theme system.

## Available Templates

### Core Templates

* **two-column.md** - Side-by-side comparison layouts
* **timeline.md** - Chronological events and historical sequences
* **quote.md** - Academic quotations with proper attribution
* **methodology.md** - Research methodology and process flows
* **results-table.md** - Data tables with highlighting
* **definition.md** - Term definitions and key concepts
* **section-divider.md** - Section break slides
* **image-caption.md** - Images with detailed captions
* **video-embed.md** - Embedded video with context
* **comparison-matrix.md** - Multi-dimensional comparisons

### Advanced Templates

* **case-study.md** - Structured case study presentation
* **argument-structure.md** - Thesis, evidence, conclusion layout
* **literature-review.md** - Summary of research papers
* **data-visualization.md** - Charts and graphs with interpretation
* **takeaway.md** - Key points and action items

## Template Categories

### Structural Templates
Used for organizing presentation flow and creating clear sections.

### Content Templates
Designed for specific types of academic content (data, quotes, definitions).

### Interactive Templates
Patterns that encourage audience engagement or progressive disclosure.

## Customization Tips

### Colors and Styling
* Use `<!-- .element: class="custom-class" -->` to apply custom CSS classes
* Fragment classes: `<!-- .element: class="fragment fade-in" -->`
* Available classes: See `/inc/css/base.css` for full list

### Layout Modifications
* Adjust column widths using inline styles
* Use `<div>` containers for complex layouts
* Maintain responsive design principles

### Combining Templates
Templates can be mixed and matched within the same presentation. Use slide separators:
* `---` for new horizontal slides
* `--` for vertical slides (nested)

## Examples from Existing Presentations

This library extracts and formalizes patterns already used in:
* `cilc25/` - Content advisory, background sections
* `icame25/` - Timeline layouts, methodology sections
* `scsai25/` - Definition slides, comparison layouts

## Adding New Templates

When creating new templates:

1. **Create a new .md file** with descriptive name
2. **Include example content** showing the pattern
3. **Add comments** explaining customization points
4. **Test** with multiple themes to ensure compatibility
5. **Document** in this README

## Template Structure

Each template file contains:

```markdown
<!-- Template Name -->
<!-- Description: What this template is for -->
<!-- Usage: When to use this template -->

[Markdown content with placeholder text]

<!-- Customization notes -->
```

## Accessibility Considerations

All templates follow accessibility best practices:
* Semantic HTML structure
* Sufficient color contrast (works with all themes)
* Alt text placeholders for images
* Screen reader friendly layout

## Integration with Themes

These templates work with all existing themes in `/inc/css/`:
* Light themes (cream, paper, plaster, canvas, indoor)
* Dark themes (black, blue, green, polygons, UoG)
* Accessibility themes (high contrast, Atkinson font)

Theme-specific styling is handled automatically by the CSS system.

---

**Last Updated:** 2025-11-15
**Maintained by:** Marc Alexander, University of Glasgow
