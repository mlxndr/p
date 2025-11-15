# Templates Quick Start Guide

## 30-Second Start

1. Open the template file you need (e.g., `two-column.md`)
2. Copy the markdown code
3. Paste into your presentation's `content.md` file
4. Replace placeholder text with your content
5. Done!

## Available Templates at a Glance

### 📊 Data & Results
- **results-table.md** - Statistical results, data tables
- **comparison-matrix.md** - Multi-way comparisons

### 📐 Structure & Layout
- **two-column.md** - Side-by-side layouts
- **section-divider.md** - Breaking up your presentation
- **timeline.md** - Historical sequences, chronologies

### 📖 Academic Content
- **quote.md** - Quotations with citations
- **definition.md** - Defining key terms
- **methodology.md** - Research design
- **literature-review.md** - Summarizing research
- **argument-structure.md** - Building arguments

### 🎯 Special Purpose
- **case-study.md** - Real-world examples
- **image-caption.md** - Figures with captions
- **takeaway.md** - Conclusions and summaries

## Common Use Cases

### "I need to compare two things side by side"
→ Use **two-column.md** (basic layout)
→ Or **comparison-matrix.md** (detailed comparison)

### "I need to show historical development"
→ Use **timeline.md**

### "I need to present research results"
→ Use **results-table.md** (quantitative)
→ Or **case-study.md** (qualitative)

### "I need to quote from sources"
→ Use **quote.md**

### "I need to define technical terms"
→ Use **definition.md**

### "I need to conclude a section"
→ Use **takeaway.md** or **section-divider.md**

## Customization Basics

### Adding Fragment Animations
Make content appear progressively:

```markdown
* First point (visible immediately)
* Second point <!-- .element: class="fragment" -->
* Third point <!-- .element: class="fragment" -->
```

### Styling Individual Elements
Apply custom CSS classes:

```markdown
Text here <!-- .element: class="custom-class" -->
```

### Adjusting Layouts
Modify column widths:

```html
<div class="col" style="width: 60%">
Wider column
</div>
<div class="col" style="width: 40%">
Narrower column
</div>
```

## Template Combinations

Templates work great together! Common patterns:

**Section Structure:**
1. Section divider (announces new topic)
2. Definition slides (introduce key terms)
3. Content slides (your main points)
4. Takeaway slide (summarize section)

**Research Presentation:**
1. Literature review template
2. Methodology template
3. Results table template
4. Case study template (optional)
5. Takeaway template

**Argument Presentation:**
1. Argument structure template
2. Quote templates (supporting evidence)
3. Comparison matrix (addressing alternatives)
4. Takeaway template

## Tips for Success

✅ **DO:**
- Start with a template close to your needs
- Customize freely - these are starting points
- Mix templates within one presentation
- Keep accessibility in mind (alt text for images)

❌ **DON'T:**
- Don't feel bound by template structure
- Don't use a template if simple markdown works better
- Don't overcomplicate - simpler is often better
- Don't forget to test with your preferred theme

## Getting Help

- **Full documentation:** See `README.md` in this directory
- **Examples:** Look at existing presentations in parent directories
- **Theme compatibility:** All templates work with all themes
- **Questions:** Check the main CLAUDE.md in repository root

## Quick Reference: Markdown Syntax

```markdown
---
New horizontal slide

--
New vertical slide

## Heading
Regular markdown headings

* Bullet list
* Another item

1. Numbered list
2. Another item

**bold** and *italic*

[Link text](URL)

![Alt text](./img/file.png)

> Block quote

| Table | Headers |
|-------|---------|
| Cell  | Cell    |
```

## Next Steps

1. Browse the templates in this directory
2. Pick one that matches your need
3. Copy and customize
4. Repeat for other slides
5. Present with confidence!

---

**Pro tip:** Bookmark this folder for easy access while building presentations.
