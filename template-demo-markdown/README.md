# Markdown Template for reveal.js Presentations

This directory contains an example of using Markdown for content in reveal.js presentations.

## How It Works

The Markdown template system uses:
1. HTML for complex layouts (like title slides and footers)
2. Markdown for content slides using `data-markdown` sections
3. Special comments for slide-specific features

## Key Features

### 1. Markdown Sections

Markdown content must be enclosed in a special section:

```html
<section data-markdown>
    <textarea data-template>
    ## Your Slide Title

    * Bullet point 1
    * Bullet point 2
    </textarea>
</section>
```

### 2. Mixing HTML and Markdown

You can mix HTML within your Markdown for special formatting:

```html
<section data-markdown>
    <textarea data-template>
    ## Slide Title

    Regular markdown content

    <div class="special-class">
        HTML content inside markdown
    </div>

    Back to regular markdown
    </textarea>
</section>
```

### 3. Speaker Notes

Add speaker notes using the `notes:` separator:

```markdown
## Slide Title

Content visible to audience

notes:
Private notes only visible in speaker view
- Note point 1
- Note point 2
```

### 4. Fragments (Animations)

Create fragments using HTML comments:

```markdown
## Animated List

<!-- .element: class="fragment" -->
This appears first

<!-- .element: class="fragment" -->
This appears second
```

### 5. External Markdown Files

You can store slides in external .md files:

```html
<section data-markdown="slides/introduction.md"></section>
```

## Required Scripts

Make sure to include these scripts:

```html
<script src="../inc/reveal.js/dist/reveal.js"></script>
<script src="../inc/reveal.js/plugin/markdown/markdown.js"></script>
<script src="../inc/reveal.js/plugin/reveal.js-menu/menu.js"></script>
<script src="../inc/reveal.js/plugin/notes/notes.js"></script>
<script src="../inc/revconfig-markdown.js"></script>
```

## Benefits of Using Markdown

1. **Simplicity**: Focus on content without HTML markup
2. **Readability**: Markdown is easier to read and edit
3. **Efficiency**: Write presentations faster
4. **Portability**: Markdown content can be reused elsewhere

## Examples

1. Academic presentation: `/template-demo-markdown/index.html`
2. Lecture presentation: `/template-lecture-markdown/index.html`