# Modular Theme System

This directory contains the modular theme composition system for the presentation platform.

## Structure

```
modular/
├── composer.js           # Theme composition engine
├── palettes/            # Color schemes (Layer 1)
├── typography/          # Font sets (Layer 2)
├── layouts/             # Layout patterns (Layer 3)
├── backgrounds/         # Textures and images (Layer 4)
├── accents/             # Optional decorations (Layer 5)
└── compositions/        # Pre-made theme presets
```

## How It Works

The modular system breaks themes into independent, reusable components that can be mixed and matched:

1. **Palette** - Defines all colors (text, background, links, etc.)
2. **Typography** - Defines fonts, sizes, and spacing
3. **Layout** - Defines alignment and structural patterns
4. **Background** - Defines textures or images
5. **Accents** - Optional decorative elements

## Using the Visual Theme Builder

1. Press `m` to open the menu during a presentation
2. Navigate to the **ModTheme** tab
3. Select components from each layer using the dropdowns
4. Click **Apply Theme** to see changes instantly
5. Your theme is automatically saved for future sessions

## Available Components

### Palettes (4 available)
- **cream** - Warm, off-white background (Light, WCAG AAA)
- **paper** - Clean white background (Light, WCAG AAA)
- **uog-blue** - University of Glasgow blue (Dark, WCAG AAA)
- **midnight** - Deep blue-black (Dark, WCAG AAA)

### Typography (3 available)
- **concourse** - Concourse body + Equity headings
- **century** - Concourse body + Century Supra headings
- **atkinson** - Atkinson Hyperlegible (high accessibility)

### Layouts (2 available)
- **standard** - Left-aligned text with comfortable spacing
- **centered** - Centered headings with left-aligned body

### Backgrounds (3 available)
- **none** - Solid color only
- **paper** - Subtle paper grain texture
- **polygons** - Geometric polygon pattern

## Programmatic Usage

You can also compose themes programmatically in your presentation HTML:

```html
<head>
  <script>
    // Wait for Reveal to be ready
    Reveal.on('ready', function() {
      // Compose a custom theme
      window.themeComposer.compose({
        palette: 'uog-blue',
        typography: 'atkinson',
        layout: 'centered',
        background: 'none'
      });
    });
  </script>
</head>
```

## Creating New Components

### Adding a New Palette

Create a file in `palettes/palette-yourname.css`:

```css
/* Your Palette Name
 * Description: What this palette is for
 * Accessibility: WCAG level
 */

:root {
  --light-primary-r: 0;
  --light-primary-g: 0;
  --light-primary-b: 0;

  --r-font-color: rgba(var(--light-primary-r), var(--light-primary-g), var(--light-primary-b), 1);
  --r-border-color: rgba(var(--light-primary-r), var(--light-primary-g), var(--light-primary-b), 0.25);
  --r-subtle-color: rgba(var(--light-primary-r), var(--light-primary-g), var(--light-primary-b), 0.5);

  --r-link-color: #your-link-color;

  --color-contrast-ratio: X.X;
  --wcag-level: 'AA' or 'AAA';
  --theme-lightness: 'light' or 'dark';
}

.reveal {
  background-color: #your-bg-color;
}
```

Then add it to the dropdown options in `/inc/revconfig.js` under the ModTheme section.

### Adding a New Typography Set

Create a file in `typography/typography-yourname.css`:

```css
/* Your Typography Name
 * Description: What fonts and use cases
 */

@import url('../fonts.css');

:root {
  --r-main-font: 'Your Body Font', fallback, generic;
  --r-heading-font: 'Your Heading Font', fallback, generic;
  --r-code-font: 'Your Code Font', monospace;
  --r-main-font-size: 32px;
}

.reveal {
  font-family: var(--r-main-font);
  font-size: var(--r-main-font-size);
  font-weight: 400;
  line-height: 1.2;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--r-heading-font);
  font-weight: 600;
}
```

Then add it to the dropdown options in `/inc/revconfig.js`.

## Technical Details

- Components load in cascade order: Palette → Typography → Layout → Background → Accents
- All components use CSS custom properties (variables) for maximum flexibility
- The `composer.js` engine manages loading and saving theme states
- Theme preferences are saved in browser localStorage
- All palettes are WCAG AA or AAA compliant

## Backward Compatibility

The modular system is fully backward compatible with existing monolithic themes (e.g., `th-l-cr.css`). Both systems can coexist without conflict.

When a modular theme is active, it takes precedence over the default theme link in `pres-head.html`.

## Future Expansion

Planned additions:
- More palettes (institutional branding, seasonal themes)
- More typography sets (serif-focused, monospace, large text)
- Advanced layout patterns (wide, reading-optimized)
- More backgrounds (gradients, institutional images)
- Accent features (borders, logos, decorations)
- Pre-made composition presets

---

For full design documentation, see `/templates/MODULAR-THEME-SYSTEM.md`
