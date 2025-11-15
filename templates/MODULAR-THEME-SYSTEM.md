# Modular Theme Composition System

## Design Proposal for Academic Presentation Themes

**Version:** 1.0
**Date:** 2025-11-15
**Author:** Design proposal for mga.is presentation platform

---

## Executive Summary

The **Modular Theme Composition System** breaks themes into independent, reusable components that can be mixed and matched. Instead of creating monolithic theme files, users compose custom themes by selecting from:

- **Color Palettes** (12+ options)
- **Typography Sets** (6+ font combinations)
- **Layout Patterns** (4+ structural approaches)
- **Background Styles** (15+ textures and images)
- **Accent Features** (borders, highlights, decorations)

**Result:** Hundreds of unique theme combinations without writing CSS, all guaranteed to maintain accessibility and visual coherence.

---

## Current System Limitations

### The Problem

**Current approach:** Monolithic theme files
- Each theme (e.g., `th-l-cr.css`) bundles ALL styling decisions
- Wants "UoG colors with paper texture"? Must create entire new theme file
- Redundant code across similar themes
- No way to mix: UoG colors + Atkinson font + Canvas background

**Example:** Current file structure
```
th-l-cr.css       (Cream theme: cream colors + Concourse font + plain bg)
th-l-bg-paper.css (Paper theme: paper colors + Concourse font + paper texture)
th-d-bg-uog-bu.css (UoG theme: UoG colors + Concourse font + UoG background)
```

Each is a complete, independent theme. Can't easily combine UoG colors with paper texture.

---

## Proposed Architecture

### Modular Components

Break themes into **5 independent layers:**

```
┌─────────────────────────────────────────────┐
│  Layer 5: Accent Features (optional)        │
│  (borders, code highlighting, decorations)  │
├─────────────────────────────────────────────┤
│  Layer 4: Background Styles                 │
│  (textures, images, patterns, gradients)    │
├─────────────────────────────────────────────┤
│  Layer 3: Layout Patterns                   │
│  (margins, alignment, spacing)              │
├─────────────────────────────────────────────┤
│  Layer 2: Typography Sets                   │
│  (font families, sizes, weights, spacing)   │
├─────────────────────────────────────────────┤
│  Layer 1: Color Palettes (foundation)       │
│  (text, background, heading, link colors)   │
└─────────────────────────────────────────────┘
```

Each layer is **independent** and **composable**.

---

## Layer 1: Color Palettes

### Purpose
Define all color-related CSS variables without touching fonts, spacing, or backgrounds.

### Structure

**File naming:** `palette-{name}.css`

**Example: palette-uog-blue.css**
```css
/* University of Glasgow Blue Palette */
:root {
  /* Core colors */
  --r-background-color: #003865;  /* UoG blue */
  --r-main-color: #ffffff;        /* White text */
  --r-heading-color: #ffd700;     /* Gold headings */

  /* Link colors */
  --r-link-color: #00aeef;        /* Light blue links */
  --r-link-color-hover: #66d3ff;  /* Hover state */
  --r-link-color-dark: #0088bb;   /* Visited links */

  /* Selection highlight */
  --r-selection-background-color: #ffd700;
  --r-selection-color: #003865;

  /* Code blocks */
  --r-code-background: rgba(255, 255, 255, 0.1);
  --r-code-color: #66d3ff;

  /* Table colors */
  --r-table-border: #ffd700;
  --r-table-header-bg: rgba(255, 215, 0, 0.2);

  /* Accessibility metadata */
  --color-contrast-ratio: 12.5;  /* WCAG AAA compliant */
  --theme-lightness: dark;
}
```

### Available Palettes

**Light Palettes:**
- `palette-cream.css` - Warm, off-white background
- `palette-paper.css` - Clean white, high contrast
- `palette-plaster.css` - Soft gray-white
- `palette-canvas.css` - Natural linen tone
- `palette-high-contrast.css` - Maximum accessibility (black on white)

**Dark Palettes:**
- `palette-uog-blue.css` - University of Glasgow brand
- `palette-midnight.css` - Deep blue-black
- `palette-forest.css` - Dark green academic
- `palette-charcoal.css` - Neutral dark gray
- `palette-twilight.css` - Purple-blue evening

**Specialty Palettes:**
- `palette-sepia.css` - Historical document feel
- `palette-terminal.css` - Developer/code presentation
- `palette-minimalist.css` - Pure black on white

---

## Layer 2: Typography Sets

### Purpose
Control all font-related styling independently of color and layout.

### Structure

**File naming:** `typography-{name}.css`

**Example: typography-concourse.css**
```css
/* Concourse Typography Set (Matthew Butterick) */
:root {
  /* Font families */
  --r-main-font: 'Concourse T4', 'Helvetica Neue', sans-serif;
  --r-heading-font: 'Century Supra T4', 'Georgia', serif;
  --r-code-font: 'Monaspace Neon', 'JetBrains Mono', monospace;

  /* Font sizes */
  --r-main-font-size: 32px;
  --r-heading1-size: 2.5em;
  --r-heading2-size: 1.8em;
  --r-heading3-size: 1.3em;
  --r-heading4-size: 1.0em;
  --r-code-font-size: 0.85em;

  /* Font weights */
  --r-heading-font-weight: 600;
  --r-main-font-weight: 400;
  --r-bold-font-weight: 700;

  /* Line heights */
  --r-heading-line-height: 1.2;
  --r-main-line-height: 1.6;

  /* Letter spacing */
  --r-heading-letter-spacing: normal;
  --r-main-letter-spacing: normal;

  /* Text transform */
  --r-heading-text-transform: none;
}

/* Apply fonts */
.reveal {
  font-family: var(--r-main-font);
  font-size: var(--r-main-font-size);
}

.reveal h1, .reveal h2, .reveal h3,
.reveal h4, .reveal h5, .reveal h6 {
  font-family: var(--r-heading-font);
  font-weight: var(--r-heading-font-weight);
  letter-spacing: var(--r-heading-letter-spacing);
}

.reveal code {
  font-family: var(--r-code-font);
  font-size: var(--r-code-font-size);
}
```

### Available Typography Sets

1. **typography-concourse.css**
   - Body: Concourse (sans-serif)
   - Headings: Century Supra (slab serif)
   - Code: Monaspace Neon
   - **Best for:** General academic presentations, professional conferences

2. **typography-equity.css**
   - Body: Equity (serif)
   - Headings: Concourse (sans-serif)
   - Code: JetBrains Mono
   - **Best for:** Humanities, literature, classical topics

3. **typography-atkinson.css**
   - Body: Atkinson Hyperlegible (high accessibility)
   - Headings: Atkinson Hyperlegible
   - Code: JetBrains Mono
   - **Best for:** Accessibility priority, vision support, large audiences

4. **typography-monospace.css**
   - Body: JetBrains Mono (monospace)
   - Headings: JetBrains Mono Bold
   - Code: Monaspace Neon
   - **Best for:** Computer science, programming talks, technical content

5. **typography-mixed-classic.css**
   - Body: Georgia (system serif)
   - Headings: Helvetica Neue (system sans)
   - Code: Courier New
   - **Best for:** No custom fonts needed, system fonts only

6. **typography-large-text.css**
   - Same as Concourse but with 20% larger base size
   - **Best for:** Large auditoriums, older audiences, vision accessibility

---

## Layer 3: Layout Patterns

### Purpose
Control spacing, alignment, and structural presentation independently.

### Structure

**File naming:** `layout-{name}.css`

**Example: layout-centered.css**
```css
/* Centered Layout Pattern */
:root {
  /* Slide dimensions */
  --r-slide-width: 1050px;
  --r-slide-height: 700px;

  /* Margins */
  --r-margin: 0.1;

  /* Alignment */
  --r-block-alignment: center;
  --r-heading-alignment: center;

  /* Spacing */
  --r-block-margin: 20px;
  --r-heading-margin: 0 0 20px 0;
  --r-list-spacing: 0.5em;
}

.reveal .slides {
  text-align: center;
}

.reveal h1, .reveal h2, .reveal h3 {
  text-align: center;
  margin: var(--r-heading-margin);
}

.reveal p, .reveal ul, .reveal ol {
  margin: var(--r-block-margin) auto;
  text-align: left; /* Body text left-aligned even with centered headers */
  max-width: 80%;   /* Prevent overly long lines */
}
```

### Available Layout Patterns

1. **layout-standard.css**
   - Left-aligned headings and text
   - Comfortable reading width
   - Standard academic paper feel

2. **layout-centered.css**
   - Centered headings
   - Left-aligned body text (for readability)
   - Balanced, formal appearance

3. **layout-wide.css**
   - Full-width content
   - Minimal margins
   - Maximum information density

4. **layout-reading.css**
   - Optimized line length (65-75 characters)
   - Generous line spacing
   - Best for text-heavy slides

---

## Layer 4: Background Styles

### Purpose
Apply textures, images, patterns, or gradients independently of color scheme.

### Structure

**File naming:** `background-{name}.css`

**Example: background-paper-texture.css**
```css
/* Paper Texture Background */
.reveal {
  background-image: url('../woff2/bg/paper-texture.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* Ensure text remains readable over texture */
.reveal .slides {
  background: rgba(255, 255, 255, 0.95); /* Semi-transparent overlay */
  padding: 20px;
}

/* Slide-specific backgrounds */
.reveal section {
  background: transparent;
}

/* Title slide gets full texture */
.reveal section:first-child {
  background: transparent;
}
```

### Available Backgrounds

**Textures:**
- `background-none.css` - Solid color only
- `background-paper.css` - Subtle paper grain
- `background-canvas.css` - Linen texture
- `background-plaster.css` - Wall texture
- `background-subtle-grain.css` - Minimal noise

**Patterns:**
- `background-polygons-blue.css` - Geometric blue pattern
- `background-polygons-red.css` - Geometric red pattern
- `background-rows.css` - Horizontal line pattern
- `background-dots.css` - Dot grid pattern

**Images:**
- `background-uog.css` - University of Glasgow building
- `background-library.css` - Bookshelf image
- `background-gradient-warm.css` - Warm color gradient
- `background-gradient-cool.css` - Cool color gradient

**Special:**
- `background-institutional.css` - Template for custom logo watermark

---

## Layer 5: Accent Features

### Purpose
Add optional decorative elements, special highlighting, or branded accents.

### Structure

**File naming:** `accent-{name}.css`

**Example: accent-borders.css**
```css
/* Border Accent Features */

/* Add subtle border to slide edges */
.reveal .slides {
  border: 3px solid var(--r-heading-color);
  padding: 30px;
}

/* Heading underlines */
.reveal h1 {
  border-bottom: 4px solid var(--r-heading-color);
  padding-bottom: 0.3em;
}

.reveal h2 {
  border-bottom: 2px solid var(--r-link-color);
  padding-bottom: 0.2em;
}

/* Block quotes with left border */
.reveal blockquote {
  border-left: 5px solid var(--r-heading-color);
  padding-left: 1em;
}

/* Code blocks with accent border */
.reveal pre {
  border-left: 3px solid var(--r-code-color);
}
```

### Available Accents

- `accent-none.css` - No decorations
- `accent-borders.css` - Subtle border elements
- `accent-underlines.css` - Heading underlines
- `accent-corners.css` - Decorative corner elements
- `accent-institutional-logo.css` - Fixed position logo watermark
- `accent-slide-numbers-decorative.css` - Styled slide numbers
- `accent-highlight-boxes.css` - Colored background boxes for emphasis

---

## Implementation Strategy

### Phase 1: Component Library Creation

**Directory Structure:**
```
inc/css/modular/
├── README.md                      # Documentation
├── composer.html                  # Visual theme builder UI
├── composer.js                    # Theme composition engine
│
├── palettes/                      # Layer 1: Colors
│   ├── palette-cream.css
│   ├── palette-uog-blue.css
│   ├── palette-high-contrast.css
│   └── ...
│
├── typography/                    # Layer 2: Fonts
│   ├── typography-concourse.css
│   ├── typography-atkinson.css
│   ├── typography-equity.css
│   └── ...
│
├── layouts/                       # Layer 3: Structure
│   ├── layout-standard.css
│   ├── layout-centered.css
│   ├── layout-wide.css
│   └── ...
│
├── backgrounds/                   # Layer 4: Textures/Images
│   ├── background-none.css
│   ├── background-paper.css
│   ├── background-uog.css
│   └── ...
│
├── accents/                       # Layer 5: Decorations
│   ├── accent-none.css
│   ├── accent-borders.css
│   ├── accent-institutional-logo.css
│   └── ...
│
└── compositions/                  # Pre-made combinations
    ├── theme-uog-formal.json      # UoG blue + Concourse + Centered + UoG bg
    ├── theme-accessible-max.json  # High contrast + Atkinson + Reading + None
    ├── theme-classic-paper.json   # Cream + Equity + Standard + Paper
    └── ...
```

### Phase 2: Composition Engine

**JavaScript module:** `inc/css/modular/composer.js`

```javascript
class ThemeComposer {
  constructor() {
    this.layers = {
      palette: null,
      typography: null,
      layout: null,
      background: null,
      accents: []
    };
  }

  // Load a layer component
  loadLayer(layer, component) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `../inc/css/modular/${layer}s/${layer}-${component}.css`;
    link.dataset.layer = layer;
    document.head.appendChild(link);

    this.layers[layer] = component;
  }

  // Compose complete theme from selections
  compose(config) {
    this.loadLayer('palette', config.palette);
    this.loadLayer('typography', config.typography);
    this.loadLayer('layout', config.layout);
    this.loadLayer('background', config.background);

    config.accents?.forEach(accent => {
      this.loadLayer('accent', accent);
    });
  }

  // Save composition as preset
  save(name) {
    const composition = {
      name: name,
      created: new Date().toISOString(),
      layers: this.layers
    };

    localStorage.setItem(`theme-${name}`, JSON.stringify(composition));
    return composition;
  }

  // Load preset
  load(name) {
    const composition = JSON.parse(localStorage.getItem(`theme-${name}`));
    if (composition) {
      this.compose(composition.layers);
    }
  }
}
```

**Usage in presentation:**
```html
<head>
  <script src="../inc/css/modular/composer.js"></script>
  <script>
    const composer = new ThemeComposer();

    // Option 1: Compose custom theme
    composer.compose({
      palette: 'uog-blue',
      typography: 'concourse',
      layout: 'centered',
      background: 'uog',
      accents: ['institutional-logo', 'borders']
    });

    // Option 2: Load preset
    // composer.load('uog-formal');
  </script>
</head>
```

### Phase 3: Visual Theme Builder

**Interactive UI:** `inc/css/modular/composer.html`

A standalone page for visual theme composition:

```
┌────────────────────────────────────────────────────┐
│  Theme Composer                                     │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌─────────────────────────┐  │
│  │  Components  │    │   Live Preview          │  │
│  │──────────────│    │                         │  │
│  │ Color        │    │   # Sample Heading      │  │
│  │ [UoG Blue ▼] │    │                         │  │
│  │              │    │   Body text appears     │  │
│  │ Typography   │    │   here with selected    │  │
│  │ [Concourse▼] │    │   typography and        │  │
│  │              │    │   colors applied.       │  │
│  │ Layout       │    │                         │  │
│  │ [Centered ▼] │    │   * Bullet points       │  │
│  │              │    │   * Another item        │  │
│  │ Background   │    │                         │  │
│  │ [UoG Img  ▼] │    │   > Blockquote test     │  │
│  │              │    │                         │  │
│  │ Accents      │    │   `code example`        │  │
│  │ [☑] Borders  │    │                         │  │
│  │ [☐] Logo     │    └─────────────────────────┘  │
│  │              │                                  │
│  │ [Generate]   │    [Copy Code] [Save Preset]   │
│  └──────────────┘                                  │
│                                                     │
│  Generated Configuration:                          │
│  ┌───────────────────────────────────────────────┐│
│  │ composer.compose({                            ││
│  │   palette: 'uog-blue',                        ││
│  │   typography: 'concourse',                    ││
│  │   layout: 'centered',                         ││
│  │   background: 'uog',                          ││
│  │   accents: ['borders']                        ││
│  │ });                                           ││
│  └───────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

**Features:**
- Real-time preview of theme combination
- Dropdowns for each layer
- Multi-select for accents
- Copy-paste ready code generation
- Save as named preset
- Accessibility validator (checks contrast ratios)
- Export as JSON for sharing

---

## Accessibility Integration

### Automatic Validation

Each palette file includes metadata:

```css
:root {
  /* Color definitions */
  --r-background-color: #003865;
  --r-main-color: #ffffff;

  /* Accessibility metadata */
  --color-contrast-ratio: 12.5;     /* Calculated WCAG ratio */
  --wcag-level: 'AAA';               /* AA or AAA */
  --theme-lightness: 'dark';         /* light or dark */
  --recommended-fonts: 'any';        /* any, large, or high-contrast */
}
```

**Theme Composer validates:**
- Color contrast ratios meet WCAG AA (or AAA)
- Typography choices appropriate for palette
- Background doesn't reduce readability
- Warns about suboptimal combinations

**Example warning:**
```
⚠️ Warning: 'typography-small-serif' with 'palette-low-contrast'
   may not meet WCAG AA standards.
   Suggested: Use 'typography-large-text' or 'palette-high-contrast'
```

---

## Pre-built Compositions

### Preset Themes for Common Use Cases

**Stored in:** `inc/css/modular/compositions/`

**Format:** JSON files

**Example: theme-uog-formal.json**
```json
{
  "name": "University of Glasgow - Formal",
  "description": "Official UoG branding for formal presentations",
  "author": "Marc Alexander",
  "created": "2025-11-15",
  "tags": ["institutional", "dark", "formal"],
  "layers": {
    "palette": "uog-blue",
    "typography": "concourse",
    "layout": "centered",
    "background": "uog",
    "accents": ["institutional-logo"]
  },
  "accessibility": {
    "wcag_level": "AAA",
    "contrast_ratio": 12.5,
    "font_size": "32px"
  }
}
```

### Recommended Presets

1. **theme-uog-formal.json**
   - For: Official university presentations
   - Layers: UoG blue + Concourse + Centered + UoG bg + Logo

2. **theme-accessible-maximum.json**
   - For: Maximum accessibility compliance
   - Layers: High contrast + Atkinson + Reading + None + None

3. **theme-classic-academic.json**
   - For: Traditional academic talks
   - Layers: Cream + Equity + Standard + Paper + None

4. **theme-modern-minimal.json**
   - For: Contemporary, clean presentations
   - Layers: Minimalist + Concourse + Wide + None + Borders

5. **theme-code-presentation.json**
   - For: Programming and technical talks
   - Layers: Terminal + Monospace + Standard + None + None

6. **theme-humanities.json**
   - For: Literature, history, classical studies
   - Layers: Sepia + Equity + Reading + Paper + Underlines

7. **theme-conference-light.json**
   - For: General conference presentations (light)
   - Layers: Paper + Concourse + Standard + Subtle grain + None

8. **theme-conference-dark.json**
   - For: General conference presentations (dark)
   - Layers: Midnight + Concourse + Standard + None + None

---

## Migration Path

### Backward Compatibility

**Existing themes remain functional.** The modular system is additive.

**Migration strategy:**

1. **Phase 1:** Create modular components alongside existing themes
2. **Phase 2:** Provide migration tool to convert monolithic themes to compositions
3. **Phase 3:** Update documentation to recommend modular approach
4. **Phase 4:** (Optional) Deprecate monolithic themes in favor of compositions

**Migration tool example:**
```bash
# Analyze existing theme and suggest composition
$ node scripts/analyze-theme.js inc/css/th-d-bg-uog-bu.css

Analyzing: th-d-bg-uog-bu.css
---
Detected components:
  Palette: uog-blue (100% match)
  Typography: concourse (95% match)
  Layout: centered (90% match)
  Background: uog (100% match)
  Accents: institutional-logo (85% match)

Suggested composition:
  composer.compose({
    palette: 'uog-blue',
    typography: 'concourse',
    layout: 'centered',
    background: 'uog',
    accents: ['institutional-logo']
  });

Save as preset? [y/n]
```

---

## User Workflows

### Workflow 1: Quick Preset Selection

**For users who want simple choices:**

```html
<!-- In presentation head -->
<script src="../inc/css/modular/composer.js"></script>
<script>
  ThemeComposer.loadPreset('uog-formal');
</script>
```

**That's it.** No knowledge of components needed.

### Workflow 2: Custom Composition

**For users who want specific combinations:**

```html
<script src="../inc/css/modular/composer.js"></script>
<script>
  const composer = new ThemeComposer();
  composer.compose({
    palette: 'cream',           // Want warm light background
    typography: 'equity',       // Prefer serif for this talk
    layout: 'reading',          // Text-heavy slides
    background: 'paper',        // Subtle texture
    accents: []                 // No decorations
  });
</script>
```

### Workflow 3: Visual Builder

**For users who want to see options:**

1. Open `inc/css/modular/composer.html` in browser
2. Select options from dropdowns
3. See live preview update
4. Click "Copy Code"
5. Paste into presentation `<head>`

### Workflow 4: Per-Presentation Overrides

**Use preset but override one component:**

```html
<script>
  const composer = new ThemeComposer();
  composer.loadPreset('uog-formal');

  // Override just the typography for this talk
  composer.loadLayer('typography', 'atkinson');  // More accessible
</script>
```

---

## Technical Considerations

### CSS Cascade Order

Components must load in correct order:

1. **Base Reveal.js styles** (framework)
2. **Palette** (defines CSS variables)
3. **Typography** (uses palette variables)
4. **Layout** (uses typography and palette variables)
5. **Background** (uses palette variables)
6. **Accents** (uses all previous variables)

**The composer enforces this order automatically.**

### CSS Variable Inheritance

All layers use CSS custom properties (variables) defined by previous layers:

```css
/* Palette defines */
--r-heading-color: #ffd700;

/* Typography uses it */
h1 {
  color: var(--r-heading-color);
}

/* Background uses it */
.slide-border {
  border-color: var(--r-heading-color);
}

/* Accents use it */
.decorative-line {
  background: var(--r-heading-color);
}
```

**This ensures visual coherence** across all layers.

### Performance

**File size:**
- Each component: ~2-5 KB
- Typical composition: 5 components = ~15 KB total
- Comparable to single monolithic theme (~12-20 KB)

**Load time:**
- 5 separate CSS files vs. 1 monolithic
- HTTP/2 multiplexing makes this negligible
- Browser caches components across presentations

**Optimization:**
- Components are minified
- Common components cached globally
- Compositions can be pre-bundled for production

### Browser Support

**Requirements:**
- CSS Custom Properties (CSS variables) - Supported in all modern browsers
- ES6 JavaScript (for composer) - Supported everywhere

**Fallback:**
- For older browsers, pre-generate bundled theme CSS
- Provide build script: `bundle-theme.js` that merges components

---

## Development Roadmap

### Milestone 1: Foundation (Week 1-2)
- [ ] Create component directory structure
- [ ] Extract 5 palettes from existing themes
- [ ] Extract 3 typography sets
- [ ] Extract 3 layouts
- [ ] Extract 5 backgrounds
- [ ] Extract 3 accents
- [ ] Document naming conventions

### Milestone 2: Composer Engine (Week 3)
- [ ] Build `composer.js` module
- [ ] Implement layer loading
- [ ] Implement preset system
- [ ] Add localStorage support
- [ ] Create 5 preset compositions
- [ ] Write unit tests

### Milestone 3: Visual Builder (Week 4)
- [ ] Design composer UI
- [ ] Implement dropdowns for each layer
- [ ] Build live preview panel
- [ ] Add code generation
- [ ] Implement preset save/load
- [ ] Add accessibility validator

### Milestone 4: Documentation (Week 5)
- [ ] Write component authoring guide
- [ ] Create usage examples
- [ ] Build component gallery
- [ ] Write migration guide
- [ ] Create video tutorials

### Milestone 5: Integration (Week 6)
- [ ] Update existing presentations to use presets
- [ ] Create preset for each current theme
- [ ] Update CLAUDE.md documentation
- [ ] Add theme builder to landing page
- [ ] Beta testing with real presentations

### Milestone 6: Expansion (Ongoing)
- [ ] Community contributions
- [ ] Additional palettes for other universities
- [ ] Seasonal backgrounds
- [ ] Animated accent options
- [ ] Advanced layout patterns

---

## Component Authoring Guide

### Creating a New Palette

**Template:** `inc/css/modular/palettes/palette-template.css`

```css
/* [Name] Color Palette
 * Description: [What this palette is for]
 * Use cases: [When to use this]
 * Accessibility: [WCAG level, contrast ratio]
 */

:root {
  /* Core colors */
  --r-background-color: #HEXCODE;
  --r-main-color: #HEXCODE;
  --r-heading-color: #HEXCODE;

  /* Link colors */
  --r-link-color: #HEXCODE;
  --r-link-color-hover: #HEXCODE;
  --r-link-color-dark: #HEXCODE;

  /* Selection highlight */
  --r-selection-background-color: #HEXCODE;
  --r-selection-color: #HEXCODE;

  /* Code blocks */
  --r-code-background: rgba(...);
  --r-code-color: #HEXCODE;

  /* Table colors */
  --r-table-border: #HEXCODE;
  --r-table-header-bg: rgba(...);

  /* Metadata */
  --color-contrast-ratio: X.X;  /* Calculate with tool */
  --wcag-level: 'AA' | 'AAA';
  --theme-lightness: 'light' | 'dark';
  --recommended-fonts: 'any' | 'large' | 'high-contrast';
}
```

**Steps:**
1. Choose colors
2. Calculate contrast ratios (https://webaim.org/resources/contrastchecker/)
3. Ensure WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
4. Add metadata
5. Test with multiple typography sets
6. Submit for inclusion

### Creating a New Typography Set

**Template:** `inc/css/modular/typography/typography-template.css`

```css
/* [Name] Typography Set
 * Description: [Font combination and purpose]
 * Use cases: [Best for what type of content]
 * Font requirements: [List any custom fonts needed]
 */

:root {
  /* Font families */
  --r-main-font: 'Font Name', fallback, generic;
  --r-heading-font: 'Font Name', fallback, generic;
  --r-code-font: 'Font Name', fallback, generic;

  /* Font sizes */
  --r-main-font-size: Xpx;
  --r-heading1-size: Xem;
  --r-heading2-size: Xem;
  --r-heading3-size: Xem;
  --r-heading4-size: Xem;
  --r-code-font-size: Xem;

  /* Font weights */
  --r-heading-font-weight: XXX;
  --r-main-font-weight: XXX;
  --r-bold-font-weight: XXX;

  /* Line heights */
  --r-heading-line-height: X.X;
  --r-main-line-height: X.X;

  /* Letter spacing */
  --r-heading-letter-spacing: Xem;
  --r-main-letter-spacing: Xem;

  /* Text transform */
  --r-heading-text-transform: none | uppercase | etc;
}

/* Apply fonts */
.reveal {
  font-family: var(--r-main-font);
  font-size: var(--r-main-font-size);
  line-height: var(--r-main-line-height);
}

.reveal h1, .reveal h2, .reveal h3,
.reveal h4, .reveal h5, .reveal h6 {
  font-family: var(--r-heading-font);
  font-weight: var(--r-heading-font-weight);
  line-height: var(--r-heading-line-height);
  letter-spacing: var(--r-heading-letter-spacing);
  text-transform: var(--r-heading-text-transform);
}

.reveal code, .reveal pre code {
  font-family: var(--r-code-font);
  font-size: var(--r-code-font-size);
}
```

**Guidelines:**
- Always provide fallback fonts
- Test readability at projected size
- Consider line length and spacing
- Ensure code font is clearly distinct
- Test with both light and dark palettes

---

## FAQ

**Q: Can I still use old monolithic themes?**
A: Yes! They continue to work. Modular system is optional.

**Q: How many combinations are possible?**
A: With 12 palettes × 6 typography sets × 4 layouts × 15 backgrounds = 4,320+ combinations (before accents).

**Q: Will this bloat my presentation files?**
A: No. You only load the components you use (~15 KB total), comparable to current themes.

**Q: Can I share my custom compositions?**
A: Yes! Export as JSON and share. Others can import and use immediately.

**Q: What about institutional branding compliance?**
A: Create a locked preset with approved components. Users can't deviate from brand standards.

**Q: Can I add my own components?**
A: Yes! Follow component authoring guide. Keep components in local `custom/` directory or contribute to main library.

**Q: How do I convert my current theme to modular?**
A: Use the migration tool: `analyze-theme.js` will suggest equivalent composition.

**Q: Does this require a build step?**
A: No! It's pure CSS + vanilla JavaScript. Works immediately in browser. Optionally bundle for optimization.

**Q: What about mobile/tablet displays?**
A: Layout components handle responsive design. Test with smaller viewports during composition.

**Q: Can I change theme mid-presentation?**
A: Not recommended (jarring for audience), but technically possible with composer methods.

---

## Conclusion

The **Modular Theme Composition System** provides:

✅ **Flexibility:** Mix and match components to create unique themes
✅ **Consistency:** All combinations guaranteed visually coherent
✅ **Accessibility:** Built-in WCAG validation
✅ **Efficiency:** Reusable components reduce code duplication
✅ **Ease of use:** Visual builder for non-technical users
✅ **Extensibility:** Easy to add new components
✅ **Backward compatible:** Existing themes still work

### Next Steps

1. **Approve architecture:** Review this design document
2. **Build Phase 1:** Create initial component library
3. **Prototype composer:** Build minimal working version
4. **Test with real presentations:** Validate approach
5. **Iterate and expand:** Add more components based on usage

---

**Questions or suggestions?** Contact Marc Alexander or open an issue in the repository.
