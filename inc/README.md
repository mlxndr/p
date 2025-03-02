# Presentation Template System

This directory contains shared components for creating reveal.js presentations with consistent structure and styling.

## How It Works

The template system uses shared HTML fragments that you copy into your presentations:
1. Common head elements (CSS imports, meta tags)
2. Common script elements (reveal.js, plugins, config)
3. Standard slide structures (title slides, footer slides)

## Key Files

- `presentation-head.html`: Common head elements to include in your presentations
- `presentation-scripts.html`: Common scripts to include at the end of your presentations
- `revconfig.js`: Shared reveal.js configuration
- Template examples in `/template-demo/` and `/template-lecture/`

## Using the Template System

### Basic Template Structure

```html
<!doctype html>
<html>
<head>
    <!-- Common head elements -->
    <!-- From /inc/presentation-head.html -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../inc/reveal.js/dist/reveal.css">
    <link rel="stylesheet" href="../css/fonts.css">
    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../inc/reveal.js/plugin/highlight/monokai.css">
    
    <!-- Presentation-specific head elements -->
    <link rel="stylesheet" href="../css/th-l-cr.css" id="theme">
    <meta name="author" content="Your Name">
    <title>Your Presentation Title</title>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            <!-- Title slide -->
            <section>
                <!-- Copy appropriate title slide structure from templates -->
            </section>
            
            <!-- Content slides -->
            <section>
                <h2>Your Content</h2>
                <p>Your content here...</p>
            </section>
            
            <!-- Footer slide -->
            <section>
                <!-- Copy appropriate footer slide structure from templates -->
            </section>
        </div>
    </div>
    
    <!-- Common scripts -->
    <!-- From /inc/presentation-scripts.html -->
    <script src="../inc/reveal.js/dist/reveal.js"></script>
    <script src="../inc/reveal.js/plugin/reveal.js-menu/menu.js"></script>
    <script src="../inc/reveal.js/plugin/notes/notes.js"></script>
    <script src="../inc/revconfig.js"></script>
</body>
</html>
```

### Available Slide Templates

1. **Academic Title Slide**: For conference presentations with logos
   - See example in `/template-demo/index.html`

2. **Lecture Title Slide**: For course lectures
   - See example in `/template-lecture/index.html`

3. **Academic Footer Slide**: Closing slide with contact info
   - See example in `/template-demo/index.html`

4. **Lecture Footer Slide**: Follow-up slide with assignments
   - See example in `/template-lecture/index.html`

## Creating a New Presentation

1. Create a new directory for your presentation
2. Copy the structure from either `/template-demo/index.html` or `/template-lecture/index.html`
3. Replace the title, content, and footer sections with your own content
4. Keep the common head and script elements (copy from the templates)

## Benefits

- **Smaller files**: Presentation directories only contain unique content
- **Consistency**: All presentations share the same structure and style
- **Maintainability**: Update shared resources in one place
- **Efficiency**: Create new presentations faster with less duplication

## Notes

The original JavaScript-based dynamic template system proved unreliable due to script loading order issues. This copy-paste template approach is more reliable while still reducing duplication.