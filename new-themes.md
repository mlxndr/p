# New Themes, Animations & Effects

This document describes the new animation system, visual effects, and themes added to the mga.is presentation platform.

---

## Table of Contents

1. [New Themes](#new-themes)
2. [Animation Classes](#animation-classes)
3. [Animated Boxes & Cards](#animated-boxes--cards)
4. [Interactive Effects](#interactive-effects)
5. [Canvas Effects](#canvas-effects)
6. [Usage in Markdown](#usage-in-markdown)
7. [Accessibility](#accessibility)

---

## New Themes

### Professional Themes

| Theme | File | Description |
|-------|------|-------------|
| **Midnight Executive** | `th-d-exec.css` | Dark gradient background (#1a1a2e → #0f3460) with gold accents (#C9A227). Elegant and corporate. |
| **Swiss Modern** | `th-l-swiss.css` | Clean white with subtle grid overlay, bold red accents (#E53935), uppercase headings. Inspired by Swiss design. |
| **Warm Editorial** | `th-l-editorial.css` | Cream background (#F5E6D3), serif italic headings, Ken Burns effect on images. Magazine/book feel. |
| **Paper & Ink** | `th-l-paper-ink.css` | Paper texture background, drop caps on paragraphs, decorative rules. Classic print aesthetic. |

### Creative Themes

| Theme | File | Description |
|-------|------|-------------|
| **Neon Cyber** | `th-d-neon.css` | Black background with cyan/pink neon glow, particle effects, scanlines. Cyberpunk aesthetic. |
| **Terminal** | `th-d-terminal.css` | Green monospace text (#00ff00), CRT scanlines, command-line styling. Retro terminal look. |
| **Deep Space** | `th-d-space.css` | Nearly black (#000011) with animated starfield, glowing text. Cosmic atmosphere. |
| **Soft Pastel** | `th-l-pastel.css` | Pink background (#FFF5F5), rounded corners on everything, soft shadows. Gentle and friendly. |
| **Brutalist** | `th-l-brutalist.css` | Pure white, massive bold type, thick black borders, red accents. Bold and uncompromising. |
| **Gradient Wave** | `th-d-gradient.css` | Animated gradient mesh background, glass-morphism cards. Modern and dynamic. |

---

## Animation Classes

### Basic Animations

Add these classes to any element for instant animation:

| Class | Effect |
|-------|--------|
| `.blur-in` | Fades in from blurred state with slight upward movement |
| `.scale-in` | Scales up from 90% while fading in |
| `.slide-blur-in` | Slides in from left while deblurring |
| `.fade-up` | Simple fade with upward movement |
| `.float` | Continuous gentle floating motion |
| `.ken-burns` | Slow zoom effect (great for images) |
| `.glow-pulse` | Pulsing glow effect |
| `.glitch` | Glitch effect on hover |

### Fragment Animations

Use with Reveal.js fragments for step-by-step reveals:

```markdown
- First point <!-- .element: class="fragment blur-in" -->
- Second point <!-- .element: class="fragment blur-in" -->
- Third point <!-- .element: class="fragment scale-in" -->
```

### Staggered Animations

Wrap elements in a container with `.stagger` or `.stagger-fast` to automatically animate children in sequence:

```html
<ul class="stagger">
  <li>Appears first (0.1s delay)</li>
  <li>Appears second (0.2s delay)</li>
  <li>Appears third (0.3s delay)</li>
</ul>
```

The `.stagger` class applies a 0.1s increment between children.
The `.stagger-fast` class applies a 0.05s increment for quicker sequences.

---

## Animated Boxes & Cards

### Basic Card

```html
<div class="card">
  <h4>Card Title</h4>
  <p>Card content goes here.</p>
</div>
```

### Card with Animation

```html
<div class="card blur-in">
  <h4>Animated Card</h4>
  <p>This card animates in with a blur effect.</p>
</div>
```

### Card Grid with Stagger

```html
<div class="card-grid stagger">
  <div class="card">
    <h4>Feature 1</h4>
    <p>Description of feature one.</p>
  </div>
  <div class="card">
    <h4>Feature 2</h4>
    <p>Description of feature two.</p>
  </div>
  <div class="card">
    <h4>Feature 3</h4>
    <p>Description of feature three.</p>
  </div>
</div>
```

### Card Variants

| Class | Effect |
|-------|--------|
| `.card` or `.box` | Basic card with subtle background and border |
| `.card.accent` | Card with coloured left border |
| `.card.highlight` | Card with highlighted background |

### Feature Boxes

For icon + text layouts:

```html
<div class="feature-box blur-in">
  <div class="icon">🚀</div>
  <div class="content">
    <h4>Fast Performance</h4>
    <p>Optimised for speed and efficiency.</p>
  </div>
</div>
```

---

## Interactive Effects

These require JavaScript (automatically loaded via `interactive.js`).

### Typewriter Effect

Text types out character by character:

```html
<h2 class="typewriter" data-speed="50">Loading system...</h2>
```

- `data-speed`: milliseconds between characters (default: 50)
- Effect triggers when the slide becomes visible

### Glitch Effect

Text glitches on hover or automatically:

```html
<!-- Glitch on hover -->
<h2 class="glitch">HOVER ME</h2>

<!-- Auto-glitch every 3 seconds -->
<h2 class="glitch" data-auto="3000">SYSTEM ERROR</h2>
```

### 3D Tilt

Element tilts based on mouse position:

```html
<div class="card tilt">
  <h4>Hover to Tilt</h4>
  <p>This card tilts in 3D space.</p>
</div>
```

---

## Canvas Effects

Certain themes include animated canvas effects that render behind the presentation:

| Theme | Effect | Description |
|-------|--------|-------------|
| Neon Cyber | `particles` | Floating particles with connection lines |
| Deep Space | `starfield` | Twinkling stars with subtle drift |
| Gradient Wave | `gradient` | Animated colour mesh |

These activate automatically when the theme is selected. No additional setup required.

### Manual Control (Advanced)

```javascript
// Start an effect manually
EffectsEngine.start('particles');

// Stop the current effect
EffectsEngine.stop();

// Re-check theme and apply appropriate effect
EffectsEngine.check();
```

---

## Usage in Markdown

### Adding Classes to Elements

Reveal.js markdown supports adding attributes to elements:

```markdown
## Slide Title {.blur-in}

Regular paragraph text.

- List item one <!-- .element: class="fragment blur-in" -->
- List item two <!-- .element: class="fragment blur-in" -->
```

### HTML Blocks in Markdown

For complex layouts, embed HTML directly:

```markdown
## Features

<div class="card-grid stagger">
  <div class="card">
    <h4>Speed</h4>
    <p>Lightning fast performance.</p>
  </div>
  <div class="card">
    <h4>Design</h4>
    <p>Beautiful by default.</p>
  </div>
  <div class="card">
    <h4>Flexible</h4>
    <p>Adapts to your needs.</p>
  </div>
</div>
```

### Complete Slide Example

```markdown
---

## Our Process {.blur-in}

<div class="card-grid stagger">
  <div class="card accent">
    <h4>1. Discovery</h4>
    <p>We learn about your needs and goals through collaborative workshops.</p>
  </div>
  <div class="card accent">
    <h4>2. Design</h4>
    <p>Our team creates solutions tailored to your requirements.</p>
  </div>
  <div class="card accent">
    <h4>3. Delivery</h4>
    <p>We implement, test, and refine until everything is perfect.</p>
  </div>
</div>

---
```

### Feature List Example

```markdown
---

## Why Choose Us?

<div class="stagger">
  <div class="feature-box">
    <div class="icon">⚡</div>
    <div class="content">
      <h4>Fast</h4>
      <p>Optimised for performance at every level.</p>
    </div>
  </div>
  <div class="feature-box">
    <div class="icon">🎨</div>
    <div class="content">
      <h4>Beautiful</h4>
      <p>Designed with attention to every detail.</p>
    </div>
  </div>
  <div class="feature-box">
    <div class="icon">🔒</div>
    <div class="content">
      <h4>Secure</h4>
      <p>Built with security as a foundation.</p>
    </div>
  </div>
</div>

---
```

---

## Accessibility

### Reduced Motion Support

All animations automatically respect the user's `prefers-reduced-motion` setting:

- When enabled, animations are disabled
- Content appears instantly without motion
- Canvas effects are hidden
- Typewriter effect shows text immediately

### Testing Reduced Motion

**macOS:** System Preferences → Accessibility → Display → Reduce motion

**Windows:** Settings → Ease of Access → Display → Show animations

**CSS media query:**
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
}
```

---

## CSS Variables

### Timing Variables

Override these in your own CSS for custom timing:

```css
:root {
  --duration-fast: 0.2s;
  --duration-normal: 0.4s;
  --duration-slow: 0.6s;
  --duration-slower: 0.8s;
  --duration-epic: 1.2s;
}
```

### Easing Variables

```css
:root {
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-snappy: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

---

## Quick Reference

### Animation Classes
```
.blur-in        .scale-in       .slide-blur-in
.fade-up        .float          .ken-burns
.glow-pulse     .glitch
```

### Container Classes
```
.stagger        .stagger-fast   .card-grid
```

### Card Classes
```
.card           .box            .card.accent
.card.highlight .feature-box
```

### Interactive Classes
```
.typewriter     .glitch         .tilt
```

### New Themes
```
th-d-exec.css       th-l-swiss.css      th-l-editorial.css
th-l-paper-ink.css  th-d-neon.css       th-d-terminal.css
th-d-space.css      th-l-pastel.css     th-l-brutalist.css
th-d-gradient.css
```
