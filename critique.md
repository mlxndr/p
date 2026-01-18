# Critique of the mga.is Presentation Framework

**Reviewer:** An Anonymous Rival
**Date:** January 2026
**Verdict:** Functional but architecturally troubled

---

## Executive Summary

This presentation framework represents a well-intentioned but ultimately over-engineered approach to what should be a straightforward problem: serving academic presentations. While it works, it suffers from significant architectural debt, fragile runtime behaviours, poor separation of concerns, and maintenance patterns that will inevitably lead to suffering. Below, I dissect its problems with constructive suggestions for improvement.

---

## 1. Script Loading: A House of Cards

### Problem: Dynamic Head Injection

The framework's fundamental loading pattern is fragile:

```javascript
fetch('../inc/pres-head.html')
    .then(response => response.text())
    .then(html => {
        document.head.insertAdjacentHTML('afterbegin', html);
    });
```

**Issues:**

- **No error handling.** If the network fails, if the file is missing, if the response is malformed - the user sees nothing. No fallback, no graceful degradation.
- **Race condition.** The QR script loads synchronously (`<script src="../inc/qr.js">`) while head content loads asynchronously. There's no guarantee of order.
- **Flash of unstyled content.** The page renders before CSS arrives from `pres-head.html`, causing visual jank.

### Suggestion

Inline critical CSS directly in presentation HTML files. Use `<link rel="preload">` for fonts and critical stylesheets. Handle fetch failures with a visible error state.

---

## 2. The Script Loader: Promises Without Purpose

The `script-loader.js` architecture reveals a developer learning promises in real-time:

```javascript
const loadPromises = enabledPlugins.map(path => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = path;
        script.onload = resolve;
        document.body.appendChild(script);
    });
});
```

**Issues:**

- **No rejection.** Scripts that fail to load simply never resolve, leaving the presentation broken without any indication of what went wrong.
- **Missing `onerror` handlers.** Network failures are silently swallowed.
- **Sequential where parallel would work.** The config script waits for all plugins, but plugins don't depend on each other.

### Suggestion

Add proper error handling. Use `script.onerror` to reject promises. Implement a timeout. Consider ES modules (`type="module"`) for modern browsers with native dependency management.

---

## 3. Theme-Dependent Elements: The Redundancy Trifecta

The theme switching logic in `script-loader.js` demonstrates a "throw everything at the wall" approach:

```javascript
// Watch for theme changes (MutationObserver)
const observer = new MutationObserver(function(mutations) { ... });

// Handle when the theme is changed via the menu or clicks
document.addEventListener('click', function() {
    setTimeout(updateThemeElements, 100);
});

// Handle when the theme is changed via keyboard shortcuts
document.addEventListener('keydown', function() {
    setTimeout(updateThemeElements, 100);
});
```

**Issues:**

- **Triple redundancy.** MutationObserver alone should suffice. Adding click and keydown listeners that fire on *every* interaction is wasteful.
- **Magic timeouts.** The 500ms initial delay and 100ms interaction delays are arbitrary. Why these numbers? What if the theme actually takes 600ms to load?
- **Brittle logo switching.** String replacement (`uog_mono.png` to `uog_white.png`) is fragile. What if someone names a file `uog_mono_new.png`?

### Suggestion

Trust the MutationObserver. Remove the blanket click/keydown handlers. Use CSS custom properties or `data-` attributes to control logo visibility rather than runtime string manipulation.

---

## 4. CSS Architecture: Death by a Thousand Theme Files

The `/inc/css/` directory contains 30+ theme files with substantial duplication. Examining a sample reveals:

- Each theme file completely redefines the colour palette
- No `@import` or inheritance pattern
- Inconsistent naming conventions (`th-d-bg-uog-bu-invert.css` vs `th-l-e-cr-invert.css`)

**Issues:**

- **Maintenance nightmare.** Changing a shared behaviour requires editing 30 files.
- **Bloated downloads.** Each theme is fully self-contained, meaning users potentially download redundant base rules repeatedly.
- **Vendor prefix archaeology.** The base.css contains deprecated patterns:

```css
-moz-font-feature-settings: "onum";
-webkit-font-feature-settings: "onum";
font-feature-settings: "onum";
/* These are then duplicated two lines later for ligatures */
```

### Suggestion

Adopt CSS custom properties as the *sole* mechanism for theming. Create a single `theme-base.css` that defines all rules using variables, then have theme files that only override `--variable-name` values. Consider a simple CSS build step (even just using `@import` statements for development and concatenating for production).

---

## 5. The Monolithic revconfig.js

The Reveal.js configuration file reportedly spans 1400+ lines and contains:

- All 24 theme paths hardcoded
- Plugin configurations
- Menu HTML templates with escaped strings

```javascript
content: '<div class="slide-menu-info"><br><small>' +
        '<p><i class="fa-solid fa-person-chalkboard" ...></i> ...' +
        // ... pages of concatenated HTML
```

**Issues:**

- **Single point of failure.** A typo anywhere breaks everything.
- **Impossible to read.** HTML in JavaScript strings is never maintainable.
- **Theme list maintenance.** Adding a new theme requires editing this file *and* creating the CSS file.

### Suggestion

- Move the menu info HTML to a template file loaded via fetch
- Auto-discover theme files from the filesystem (via a build step or server-side generation)
- Split configuration into logical modules (base config, theme config, plugin config)

---

## 6. Handout Generation: Why Reinvent Markdown?

The `handout.js` file implements its own markdown parser:

```javascript
function processInlineMarkdown(text) {
    // ... regex for links, italics, bold, code
}
```

Complete with safety counters that suggest previous infinite loop bugs:

```javascript
let safety = 0;
const MAX_ITERATIONS = lines.length * 10;
while (i < lines.length && safety < MAX_ITERATIONS) {
    safety++;
```

**Issues:**

- **Incomplete markdown support.** Tables, blockquotes, horizontal rules, and many other features are missing or broken.
- **Bug history.** The safety counter is an admission of past failures.
- **Duplication.** Reveal.js already has a markdown plugin. Why parse it again differently?

### Suggestion

Use a proper markdown library (marked.js, markdown-it) or generate handouts at build time rather than client-side. Consider PDF generation via Reveal.js's built-in PDF export.

---

## 7. CDN Inconsistency

The framework self-hosts fonts and Reveal.js but uses CDN for Font Awesome:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

**Issues:**

- **Privacy.** CDN requests leak user IP addresses to third parties.
- **Reliability.** If cdnjs goes down, presentations break.
- **Inconsistency.** Why self-host some resources and not others?

### Suggestion

Either self-host everything or embrace CDNs consistently. Consider subsetting Font Awesome to only icons actually used.

---

## 8. Global Scope Pollution

Both `scripts-config.js` and `script-loader.js` define globals:

```javascript
const scriptConfig = { ... };
function loadScripts() { ... }
function setupThemeBasedElements() { ... }
```

**Issues:**

- **Collision risk.** Any other script defining these names will conflict.
- **Testing difficulty.** Globals are hard to mock or reset.
- **No encapsulation.** Internal implementation details are exposed.

### Suggestion

Wrap everything in an IIFE or use ES modules. Expose only what's necessary on a namespaced object (e.g., `window.MGA = {}`).

---

## 9. Presentation Structure Duplication

Every presentation duplicates:

- The closing slide HTML (with inline styles!)
- The script loading boilerplate
- The section `data-` attribute declarations

Compare `waw-me26/index.html` line 25:

```html
<h1 class="pres-title-headingfont" style="font-size: 95px !important; font-variant: small-caps !important; font-weight: 700">
```

The `!important` declarations scream "I've lost control of my CSS cascade."

### Suggestion

- Create a closing slide template loaded dynamically
- Define consistent CSS classes rather than inline styles
- Consider a lightweight templating system or build step to generate presentations from a minimal config file

---

## 10. No Build, No Safety Net

The "no build process" philosophy means:

- **No minification.** Larger file sizes.
- **No dead code elimination.** Unused CSS shipped to every user.
- **No linting.** Typos and errors caught only in production.
- **No type checking.** JavaScript errors lurk silently.

### Suggestion

A "simple" build step doesn't mean webpack complexity. Even a single npm script that runs:
1. `npx eslint inc/*.js`
2. `npx cssnano inc/css/*.css`
3. Concatenates theme base with theme variables

...would catch errors and improve performance without sacrificing the "edit and refresh" workflow.

---

## 11. Accessibility Gaps

While the CLAUDE.md mentions accessibility:

- **No skip links.** Keyboard users must tab through navigation to reach content.
- **Focus management.** Theme switching doesn't announce changes to screen readers.
- **Contrast.** Many themes haven't been tested against WCAG guidelines.
- **Reduced motion.** No `prefers-reduced-motion` support for transition effects.

### Suggestion

Audit with axe-core or WAVE. Add `aria-live` regions for dynamic content. Implement `prefers-reduced-motion` and `prefers-color-scheme` media queries.

---

## Summary: Constructive Path Forward

Despite these criticisms, the framework *works*. It successfully delivers presentations. But it has accumulated technical debt that will compound over time. The path forward involves:

1. **Immediate:** Add error handling to script loading
2. **Short-term:** Consolidate theme CSS using variables
3. **Medium-term:** Introduce a minimal build step for linting and optimisation
4. **Long-term:** Consider migrating to a component-based architecture or adopting a maintained presentation framework fork

The bones are good. The implementation needs work.

---

*Submitted with professional respect and competitive disdain.*
