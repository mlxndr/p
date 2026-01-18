# Framework Improvement TODO

Based on the critique of the mga.is presentation framework, here are actionable improvements organised by priority and effort level.

---

## High Priority / Low Effort

These items address critical issues with minimal implementation cost.

- [ ] **Add error handling to pres-head.html fetch**
  - Wrap in try/catch
  - Show user-friendly error message if fetch fails
  - Log detailed error to console for debugging

- [ ] **Add script load error handling**
  - Implement `onerror` handlers on dynamically created scripts
  - Reject promises on script load failure
  - Add timeout mechanism (e.g., 10 seconds)

- [ ] **Remove redundant theme update listeners**
  - Remove the blanket `click` and `keydown` listeners in `script-loader.js`
  - Rely solely on MutationObserver for theme changes
  - Remove magic timeout numbers (500ms, 100ms)

- [ ] **Self-host Font Awesome**
  - Download Font Awesome subset (only used icons)
  - Add to `/inc/css/` directory
  - Remove CDN dependency from `pres-head.html`

---

## High Priority / Medium Effort

These items address significant architectural issues.

- [ ] **Consolidate CSS theme architecture**
  - Create `theme-base.css` with all rules using CSS custom properties
  - Convert theme files to only override `--variable-name` values
  - Remove duplicated vendor prefixes (keep only standard syntax)
  - Standardise theme file naming convention

- [ ] **Extract hardcoded theme list from revconfig.js**
  - Move theme definitions to a separate `themes.json` file
  - Load themes dynamically in the menu configuration
  - Simplifies adding new themes

- [ ] **Fix logo switching mechanism**
  - Use CSS-based approach with `data-theme="dark"` attribute
  - Define both logo versions in HTML, toggle with CSS `display` or `opacity`
  - Remove brittle string replacement logic

---

## Medium Priority / Low Effort

These items improve code quality and maintainability.

- [ ] **Wrap JavaScript in IIFE or module**
  - Encapsulate `scripts-config.js` and `script-loader.js`
  - Avoid global scope pollution
  - Expose only necessary API on namespaced object

- [ ] **Move menu info HTML to template file**
  - Create `inc/templates/menu-info.html`
  - Load via fetch in revconfig.js
  - Improves readability and maintainability

- [ ] **Add prefers-reduced-motion support**
  - Check `window.matchMedia('(prefers-reduced-motion: reduce)')`
  - Disable slide transitions for users who prefer reduced motion
  - Add CSS media query for animation-based classes

- [ ] **Add prefers-color-scheme support**
  - Detect system preference on initial load
  - Set appropriate default theme (light or dark)
  - Store user override in localStorage

---

## Medium Priority / Medium Effort

These items address deeper structural issues.

- [ ] **Introduce minimal build step**
  - Create simple `package.json` with dev dependencies
  - Add npm script for ESLint on JavaScript files
  - Add npm script for CSS validation
  - Keep optional (framework works without build)

- [ ] **Create closing slide template**
  - Extract closing slide HTML to reusable template
  - Load dynamically based on meta.json or config
  - Remove inline styles, use CSS classes only
  - Eliminate `!important` declarations

- [ ] **Replace handout markdown parser**
  - Replace custom implementation with marked.js or markdown-it
  - Or generate handouts at build time
  - Remove safety counter workarounds

---

## Lower Priority / Higher Effort

These items are longer-term architectural improvements.

- [ ] **Add accessibility audit and fixes**
  - Run axe-core or WAVE on all presentations
  - Add skip links for keyboard navigation
  - Add `aria-live` regions for theme change announcements
  - Verify colour contrast in all themes (WCAG AA minimum)

- [ ] **Create presentation generator**
  - Define presentation config in meta.json or YAML
  - Generate index.html from template + config
  - Reduces boilerplate duplication
  - Simplifies creating new presentations

- [ ] **Migrate to ES modules**
  - Convert JavaScript files to ES modules
  - Use native `import`/`export` syntax
  - Improves dependency management
  - Enables tree-shaking if build step added

- [ ] **Add automated testing**
  - Create simple test suite for JavaScript utilities
  - Test theme switching logic
  - Test script loading error handling
  - Add to CI pipeline if using GitHub Actions

---

## Questions for Decision

Before proceeding, these questions need answers:

1. **Build step appetite:** Is a minimal build step acceptable, or must the framework remain entirely build-free?

2. **Browser support:** What is the minimum browser support target? (Affects ES module adoption, CSS custom property usage)

3. **Theme consolidation:** Should existing 30+ themes be consolidated into fewer base themes with variant options?

4. **Template system:** Would a lightweight template system (e.g., Handlebars, Nunjucks) be acceptable for presentation generation?

5. **Accessibility priority:** Should WCAG AA compliance be a hard requirement for all themes?

---

## Suggested Implementation Order

If approved, the suggested order of implementation is:

1. Error handling improvements (immediate, prevent silent failures)
2. Remove redundant listeners (quick win, improves performance)
3. Self-host Font Awesome (removes external dependency)
4. CSS theme consolidation (biggest maintenance win)
5. Template extraction (improves readability)
6. Remaining items based on available time

---

*This TODO is for review and approval. Items can be modified, reprioritised, or removed based on project constraints.*
