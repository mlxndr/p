# Slide Templates Library

This directory contains reusable slide templates for common academic presentation patterns. These templates are designed to work with the Reveal.js presentation system used in this repository.

## How to Use Templates

1. **Browse** the templates below to find the pattern you need
2. **Copy** the markdown code from the template file
3. **Paste** into your `content.md` file
4. **Customize** the content for your specific needs

All templates use standard Reveal.js markdown syntax and work with the existing theme system.

## Available Templates

### Core Layout Templates

* **two-column.md** - Side-by-side comparison layouts (text vs. text, text vs. image, code examples)
* **section-divider.md** - Visual breaks between major presentation sections (minimal, centered, with transitions)
* **image-caption.md** - Images with detailed academic captions (single figures, multiple images, before/after)
* **comparison-matrix.md** - Multi-dimensional comparisons (basic matrices, detailed assessments, pros/cons)
* **quote.md** - Academic quotations with proper attribution (standard blocks, multiple quotes, centered emphasis)
* **results-table.md** - Data tables with highlighting (summary tables, categorical data, longitudinal results)

### Content Development Templates

* **timeline.md** - Chronological events and historical sequences (horizontal/vertical, branching, period-based, theoretical evolution)
* **definition.md** - Term definitions and key concepts (single terms, glossaries, nested structures, contrasting definitions)
* **methodology.md** - Research methodology and process flows (step-by-step, flowcharts, parallel processes, experimental designs)
* **case-study.md** - Structured case study presentations (standard structure, problem-solution-results, multiple mini-cases, stakeholder perspectives, failure analysis)
* **literature-review.md** - Synthesis of research scholarship (single source deep-dives, multiple source comparisons, chronological development, thematic clusters, gap analysis, theoretical debates)
* **data-visualization.md** - Charts and graphs with interpretation (annotated charts, before/after comparisons, multi-panel grids, progressive reveal, correlation matrices)

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

**Last Updated:** 2025-11-16
**Maintained by:** Marc Alexander, University of Glasgow

## Recent Additions (2025-11-16)

Six new comprehensive slide layout templates added:
* **timeline.md** - 9 chronological layout variants
* **definition.md** - 10 terminology presentation patterns
* **methodology.md** - 12 research methodology frameworks
* **case-study.md** - 10 case study structures
* **literature-review.md** - 9 literature synthesis approaches
* **data-visualization.md** - 12 data presentation patterns with statistical context
