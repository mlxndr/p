# Framework Improvement Plan

Revised based on discussion. Browser support target: 2020+ (Safari 13.1+, Chrome 80+, Firefox 74+, Edge 80+).

---

## Approved Tasks

### 1. Replace Font Awesome CDN with Local SVGs

**What:** Extract the ~13 icons actually used and embed them locally.

**Why:**
- Removes external CDN dependency (privacy, reliability)
- Reduces download size dramatically (13 SVGs vs entire FA library)
- Works offline

**Approach:**
- Create `/inc/icons/` directory
- Export needed icons from FA5 Pro as individual SVGs
- Replace `<i class="fa-solid fa-person-chalkboard">` with inline `<svg>` or `<img src="../inc/icons/person-chalkboard.svg">`
- Update revconfig.js icon references
- Remove FA CDN link from pres-head.html

**Icons needed:**
- info, person-chalkboard, user-pen, font, images (solid)
- github (brands)
- images, adjust, sticky-note, times, check-circle, arrow-alt-circle-right, circle, bars (for menu plugin)

---

### 2. Add Error Handling to Script Loading

**What:** Make failures visible instead of silent.

**Why:** Currently if pres-head.html fails to load, or a script fails, the presentation just breaks with no indication why.

**Approach:**
- Wrap `fetch('../inc/pres-head.html')` in try/catch
- Add `.catch()` handler that shows an error message
- Add `onerror` handlers to dynamically created scripts
- Log errors to console for debugging

---

### 3. Remove Redundant Theme Update Listeners

**What:** Remove the click and keydown listeners that fire `updateThemeElements` on every interaction.

**Why:** The MutationObserver already watches for theme changes. The other listeners are redundant and fire constantly.

**Approach:**
- Keep only the MutationObserver in script-loader.js
- Remove the `document.addEventListener('click', ...)` block
- Remove the `document.addEventListener('keydown', ...)` block
- Test theme switching still works via menu

---

### 4. Fix Handout Markdown Parser

**What:** Replace the custom markdown parser with a proper library.

**Why:** Current parser has limited support (no tables, blockquotes) and has safety counters suggesting past bugs.

**Approach:**
- Add marked.js (lightweight, ~40KB, no dependencies)
- Replace custom `processInlineMarkdown` function with marked
- Remove safety counter workarounds
- Test with existing presentations

---

### 5. Add prefers-reduced-motion Support

**What:** Respect user system preferences for reduced animation.

**Why:** Accessibility improvement. Some users experience motion sickness or find animations distracting.

**Approach:**
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')`
- If true, set Reveal.js transition to 'none'
- Add CSS media query to disable other animations:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 6. Add prefers-color-scheme Support

**What:** Detect system light/dark preference on first load.

**Why:** Presents with appropriate theme before user manually switches.

**Approach:**
- On initial load (no localStorage theme saved), check `window.matchMedia('(prefers-color-scheme: dark)')`
- If dark preferred, load a dark theme (e.g., th-d-bl.css)
- If light preferred (or no preference), keep current default
- User's manual choice still overrides and persists in localStorage

---

## Deferred / Not Doing

- ~~Closing slide template~~ - Not wanted
- ~~CSS theme consolidation~~ - Keeping for experimentation
- ~~Extract theme list from revconfig.js~~ - Prefer hardcoded
- ~~Split revconfig.js~~ - Keeping as one file
- ~~Build step~~ - Not wanted
- ~~ES modules migration~~ - Not wanted
- ~~Accessibility audit~~ - Deferred
- ~~Presentation generator~~ - Deferred
- ~~Automated testing~~ - Deferred
- ~~Handlebars templating~~ - Deferred (would need explanation first)

---

## Implementation Order

1. **Error handling** (quick, prevents confusion when things break)
2. **Remove redundant listeners** (quick, cleaner code)
3. **Font Awesome SVGs** (removes external dependency)
4. **prefers-reduced-motion** (quick accessibility win)
5. **prefers-color-scheme** (quick UX improvement)
6. **Fix markdown parser** (more involved, do last)

---

## Future Reference: Handlebars Explanation

*For when you're ready to explore templating.*

Handlebars is a simple templating language. Instead of writing HTML with JavaScript string concatenation:

```javascript
// Current approach
const html = '<h1>' + title + '</h1><p>' + subtitle + '</p>';
```

You write a template file:
```html
<!-- template.hbs -->
<h1>{{title}}</h1>
<p>{{subtitle}}</p>
```

Then fill it with data:
```javascript
const html = Handlebars.compile(template)({ title: 'My Talk', subtitle: 'A Presentation' });
```

**Why it helps:** Separates structure (HTML) from data (variables). Easier to read and maintain. The template looks like actual HTML.

**Why you might not need it:** You have few presentations and maintain them manually. The overhead of learning a new tool may not pay off.

---

*Ready for approval. Let me know if you'd like any changes before I begin implementation.*
