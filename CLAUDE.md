# CLAUDE.md - Presentation Framework Guidelines

## Build, Lint & Test Commands
- Run dev server: `cd /inc/reveal.js && npm start`
- Build project: `cd /inc/reveal.js && npm run build`
- Run tests: `cd /inc/reveal.js && npm test`
- ESLint: `cd /inc/reveal.js && gulp eslint`

## Structure
- Slides go in individual directories (e.g., `/dsna25/`)
- Images go in `/img/` directory 
- CSS/themes in `/inc/css/`
- Shared JavaScript in `/inc/`

## Code Style
- JS: ES6+ syntax with proper indentation (2 spaces)
- CSS: Use existing theme variables
- HTML: Follow reveal.js conventions, use semantic elements
- Logos: Add `class="theme-logo uog-logo"` or `class="theme-logo leverhulme-logo"` for theme-switching

## Theme Management
- Themes defined in `/inc/revconfig.js`
- Light/dark switching handled automatically for marked elements
- Theme-specific CSS goes in appropriate theme files
- Use `r-fit-text` class sparingly (content may overflow slide)

## Best Practices
- Keep slides modular and organized
- For new presentations, copy an existing template
- Test on different screen sizes and devices
- Test themes (both light and dark) before publishing