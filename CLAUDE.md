# CLAUDE.md - AI Assistant Guide

**Repository:** mlxndr/p
**Purpose:** Academic Presentation Platform (mga.is)
**Owner:** Marc Alexander, University of Glasgow
**Last Updated:** 2025-11-15

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [File Conventions](#file-conventions)
6. [Creating New Presentations](#creating-new-presentations)
7. [Theme System](#theme-system)
8. [Git Workflow](#git-workflow)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Important Notes](#important-notes)

---

## Repository Overview

This is a **static academic presentation platform** built on Reveal.js, hosted via GitHub Pages at `mga.is`. It contains multiple academic presentations for conferences, lectures, and events.

**Key Characteristics:**
- **Static site**: No build process, no compilation required
- **Markdown-based content**: Presentations use external markdown files for easy editing
- **Centralized resources**: Shared CSS, JS, and assets in `/inc/` directory
- **Theme system**: 20+ pre-built themes with dynamic switching
- **Academic focus**: Designed for conference presentations and university lectures

**Deployment:**
- Automatically deployed via GitHub Pages on every push to the main branch
- Custom domain: `mga.is` (configured via CNAME file)

---

## Technology Stack

### Core Framework
- **Reveal.js 4.5+** - HTML presentation framework
- **Vanilla JavaScript** - No build tools or frameworks
- **External Markdown** - Content stored in `.md` files loaded dynamically

### CSS
- **Custom modular CSS** - 33 stylesheets organized by purpose
- **Tailwind CSS 2.2.19** - Used only on landing page (CDN)
- **CSS Variables** - Theme-based color schemes

### Fonts (Self-hosted WOFF2)
- **Concourse** (Matthew Butterick) - Primary sans-serif
- **Equity** (Matthew Butterick) - Serif text
- **Century Supra** (Matthew Butterick) - Headlines
- **Monaspace Neon** - Code blocks
- **Atkinson Hyperlegible** - Accessibility option
- **JetBrains Mono** - Alternative monospace

### JavaScript Libraries
- **Reveal.js plugins**: Menu, Markdown, Notes, PDF Export, Appearance, Timer
- **QRCode.js** - QR code generation for slide URLs
- **Font Awesome 6.5.1** - Icons (CDN)

### Build/Deployment
- **No build system** - Pure static files
- **GitHub Pages** - Automatic deployment
- **Git** - Version control only

---

## Directory Structure

```
/home/user/p/
├── index.html                      # Landing page (auto-discovers presentations)
├── CNAME                           # GitHub Pages domain (mga.is)
├── site.webmanifest               # PWA manifest
├── .gitignore                     # Standard git ignores
│
├── inc/                           # Shared resources (27MB)
│   ├── pres-head.html            # Common HTML head injected dynamically
│   ├── scripts-config.js         # Plugin configuration
│   ├── script-loader.js          # Dynamic script loader
│   ├── revconfig.js              # Reveal.js initialization (1400+ lines)
│   ├── handout.js                # Handout generation
│   ├── qr.js                     # QR code library
│   │
│   ├── css/                      # All stylesheets
│   │   ├── base.css              # Core presentation styles
│   │   ├── fonts.css             # Font-face declarations
│   │   ├── handout.css           # Print-optimized styles
│   │   ├── light.css, dark.css   # Base theme styles
│   │   ├── th-l-*.css            # Light themes (cream, paper, plaster, canvas, indoor)
│   │   ├── th-d-*.css            # Dark themes (black, blue, green, polygons, rows, UoG)
│   │   ├── th-e-*.css            # Experimental themes (inverted, twilight)
│   │   ├── woff2/                # Self-hosted web fonts
│   │   └── bg/                   # Background images (JPEGs)
│   │
│   └── reveal.js/                # Reveal.js framework
│       ├── dist/                 # Compiled reveal.js
│       ├── plugin/               # Reveal.js plugins
│       └── css/                  # Reveal.js base CSS
│
├── {presentation-name}/           # Presentation directories (e.g., cilc25, scsai25)
│   ├── index.html                # Main HTML file
│   ├── title.md                  # Title slide content (optional)
│   ├── content.md                # Main slide content
│   ├── handout.html              # Printable version
│   └── img/                      # Presentation-specific images
│
├── img/                           # Shared images (logos, backgrounds)
│   ├── mga.png                   # Site logo
│   ├── uog_*.png                 # University of Glasgow logos
│   └── leverhulme_*.png          # Leverhulme Trust logos
│
├── gamma/                         # Meta-presentation (links to Gamma.app)
├── f/                             # File storage (PowerPoint exports)
└── archive/                       # Templates and deprecated presentations
    ├── README.md                 # Template documentation
    ├── template-demo-markdown/   # Markdown template example
    ├── template-lecture-markdown/
    └── [old presentations]
```

---

## Development Workflows

### No Build Process Required

This repository uses **pure static files**. Changes are immediately visible after:
1. Editing files
2. Committing to git
3. Pushing to GitHub (triggers automatic GitHub Pages deployment)

**No compilation, bundling, or minification steps.**

### Making Changes

1. **Content changes**: Edit `.md` files in presentation directories
2. **Style changes**: Edit CSS files in `/inc/css/`
3. **Configuration changes**: Edit `/inc/revconfig.js` or `/inc/scripts-config.js`
4. **New presentations**: Copy template structure (see below)

### Testing Locally

To test presentations locally:
```bash
# Use any static file server, e.g.:
python -m http.server 8000
# Or:
npx serve
```

Then navigate to `http://localhost:8000/{presentation-name}/`

---

## File Conventions

### Naming Conventions

**Presentation Directories:**
- Format: `{conference/event}{year}` (e.g., `cilc25`, `scsai25`, `icame25`)
- Year indicator: 2-digit year suffix (e.g., `25` for 2025)
- Test versions: Add `test` or `test2` suffix (e.g., `scsai25test`)

**CSS Files:**
- Themes: `th-{l|d|e}-{name}.css`
  - `l` = light theme
  - `d` = dark theme
  - `e` = experimental theme
- Example: `th-l-cr.css` (light cream theme), `th-d-bg-uog-bu.css` (dark UoG blue theme)

**Image Files:**
- Use descriptive names with underscores: `uog_mono.png`, `leverhulme_cmyk_black2.png`
- Keep shared images in `/img/`
- Keep presentation-specific images in `{presentation}/img/`

**Markdown Files:**
- `title.md` - Title slide (optional, can be in content.md)
- `content.md` - Main presentation content

### Markdown Slide Separators

```markdown
---
# New horizontal slide (main level)

--
# New vertical slide (nested under current horizontal slide)

notes:
Speaker notes go here (not visible in main presentation)
```

### HTML Structure Pattern

Every presentation follows this structure:

```html
<!doctype html>
<html lang="en">
<head>
    <title>Your Presentation Title</title>
    <script>
        // Dynamically inject common head elements
        fetch('../inc/pres-head.html')
            .then(response => response.text())
            .then(html => document.head.insertAdjacentHTML('afterbegin', html));
    </script>
    <script src="../inc/qr.js"></script>
</head>
<body>
    <div class="reveal">
        <div class="slides" style="height:100%;width:100%;">
            <!-- Title slide from markdown -->
            <section data-markdown="./title.md"
                     data-separator="^\n---\n"
                     data-separator-vertical="^\n--\n"
                     data-separator-notes="^notes:"
                     data-charset="utf-8"></section>

            <!-- Content slides from markdown -->
            <section data-markdown="./content.md"
                     data-separator="^\n---\n"
                     data-separator-vertical="^\n--\n"
                     data-separator-notes="^notes:"
                     data-charset="utf-8"></section>

            <!-- Closing slide (inline HTML) -->
            <section>
                <h1 class="pres-title-headingfont">Your Title</h1>
                <p class="pres-subtitle-mainfont">Your Subtitle</p>
                <table class="titlebr" width="100%">
                    <tr>
                        <td class="tpa4-l">Author Info</td>
                        <td class="tpa4-r">Slides:</td>
                    </tr>
                    <tr><td colspan="2"><hr></td></tr>
                    <tr>
                        <td class="tpa4-l">
                            <img src="../img/uog_mono.png" width="200px"
                                 alt="University of Glasgow Logo"
                                 class="theme-logo uog-logo">
                            <img src="../img/leverhulme_cmyk_black2.png" width="200px"
                                 alt="Leverhulme Trust Logo"
                                 class="theme-logo leverhulme-logo">
                        </td>
                        <td class="tpa4-r">
                            <canvas id="qr-code" class="qr-code"
                                    width="140" height="140"
                                    data-url="https://mga.is/{presentation}/"></canvas>
                        </td>
                    </tr>
                </table>
            </section>
        </div>
    </div>

    <script src="../inc/scripts-config.js"></script>
    <script src="../inc/script-loader.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', loadScripts);
    </script>
</body>
</html>
```

---

## Creating New Presentations

### Step-by-Step Process

1. **Create presentation directory:**
   ```bash
   mkdir {presentation-name}
   cd {presentation-name}
   ```

2. **Copy template files:**
   ```bash
   # Option 1: Copy from existing presentation
   cp ../cilc25/index.html ./

   # Option 2: Use template from archive
   cp ../archive/template-demo-markdown/index.html ./
   ```

3. **Create content files:**
   ```bash
   touch title.md content.md
   mkdir img
   ```

4. **Edit `index.html`:**
   - Update `<title>` tag
   - Update closing slide content (title, subtitle, author info)
   - Update QR code URL: `data-url="https://mga.is/{presentation-name}/"`

5. **Write content in markdown:**

   **title.md:**
   ```markdown
   # Your Presentation Title

   Subtitle or Additional Info

   Your Name
   Date and Location
   ```

   **content.md:**
   ```markdown
   ## First Slide

   Content here

   ---

   ## Second Slide

   More content

   --

   ## Nested Slide

   This appears vertically below previous slide

   notes:
   These are speaker notes

   ---

   ## Third Slide

   And so on...
   ```

6. **Add images (if needed):**
   - Place images in `{presentation-name}/img/`
   - Reference in markdown: `![Alt text](./img/image.png)`

7. **Test locally:**
   ```bash
   # From repository root
   python -m http.server 8000
   # Open: http://localhost:8000/{presentation-name}/
   ```

8. **Commit and push:**
   ```bash
   git add {presentation-name}/
   git commit -m "Add {presentation-name} presentation"
   git push
   ```

### Handout Generation

Each presentation can have a printable handout version:

1. Create `handout.html` in presentation directory
2. Copy structure from existing handout (e.g., `cilc25/handout.html`)
3. The handout system automatically extracts content from markdown files
4. Uses separate styling from `/inc/css/handout.css`

---

## Theme System

### Available Themes

**Light Themes (th-l-*.css):**
- `th-l-cr.css` - Cream (default)
- `th-l-pa.css` - Paper
- `th-l-pl.css` - Plaster
- `th-l-ca.css` - Canvas
- `th-l-in.css` - Indoor
- And more...

**Dark Themes (th-d-*.css):**
- `th-d-bl.css` - Black
- `th-d-bu.css` - Blue
- `th-d-gn.css` - Green
- `th-d-bg-uog-bu.css` - University of Glasgow blue with background
- `th-d-polygons.css` - Polygon background
- `th-d-rows.css` - Rows pattern
- And more...

**Experimental Themes (th-e-*.css):**
- `th-e-inverted.css` - Inverted colors
- `th-e-twilight.css` - Twilight theme

### Changing Default Theme

Edit the theme link in `/inc/pres-head.html`:

```html
<link rel="stylesheet" href="../inc/css/th-l-cr.css" id="theme">
```

Change `th-l-cr.css` to any other theme file.

### Dynamic Theme Switching

Presentations support runtime theme switching via the Menu plugin:
- Press `m` during presentation to open menu
- Navigate to "Themes" section
- Select desired theme

**Note:** Theme changes are saved in browser localStorage and persist across visits.

### Theme-Aware Elements

The theme system automatically adjusts:
- **Logos**: Switches between mono/white versions based on theme
- **QR codes**: Updates colors to match theme
- **Backgrounds**: Applies theme-specific background images

This is handled by JavaScript in `/inc/revconfig.js` using MutationObserver.

---

## Git Workflow

### Branch Strategy

- **Main branch**: Production code (auto-deploys to GitHub Pages)
- **Feature branches**: Use descriptive names starting with `claude/`
- **Current branch**: `claude/claude-md-mi0ggnmke6456w2z-01Cg29XfSq3n3BoDCaWTWeqh`

### Commit Message Conventions

Use clear, descriptive commit messages:

```bash
# Good examples:
git commit -m "Add ICAME25 presentation"
git commit -m "Update SCS AI presentation with new content"
git commit -m "Fix QR code generation for dark themes"
git commit -m "Add new light theme: th-l-ca.css"

# Bad examples (avoid):
git commit -m "Update"
git commit -m "Fix"
git commit -m "Changes"
```

### Standard Git Operations

**Adding new presentation:**
```bash
git add {presentation-name}/
git commit -m "Add {presentation-name} presentation"
git push -u origin {branch-name}
```

**Updating content:**
```bash
git add {presentation-name}/content.md
git commit -m "Update {presentation-name} content"
git push
```

**Adding/updating shared resources:**
```bash
git add inc/css/{file}.css
git commit -m "Add new theme: {theme-name}"
git push
```

### Push with Retry Logic

If network issues occur, retry with exponential backoff:

```bash
# First attempt
git push -u origin {branch-name}

# If failed, wait 2s and retry
# If failed, wait 4s and retry
# If failed, wait 8s and retry
# If failed, wait 16s and retry (final attempt)
```

**Critical:** Branch names must start with `claude/` and end with matching session ID, otherwise push will fail with 403 HTTP code.

---

## Common Tasks

### 1. Updating Presentation Content

```bash
# Navigate to presentation directory
cd {presentation-name}

# Edit content
nano content.md  # or use any editor

# Commit and push
git add content.md
git commit -m "Update {presentation-name} content"
git push
```

### 2. Adding Images to Presentation

```bash
# Copy image to presentation directory
cp /path/to/image.png {presentation-name}/img/

# Reference in markdown
echo "![Description](./img/image.png)" >> {presentation-name}/content.md

# Commit
git add {presentation-name}/img/image.png {presentation-name}/content.md
git commit -m "Add image to {presentation-name}"
git push
```

### 3. Creating Custom Theme

```bash
# Copy existing theme as starting point
cp inc/css/th-l-cr.css inc/css/th-l-mynewtheme.css

# Edit theme file
nano inc/css/th-l-mynewtheme.css

# Modify CSS variables:
:root {
  --r-background-color: #your-color;
  --r-main-color: #your-text-color;
  /* etc. */
}

# Commit
git add inc/css/th-l-mynewtheme.css
git commit -m "Add new theme: mynewtheme"
git push
```

### 4. Updating Reveal.js Configuration

```bash
# Edit central configuration
nano inc/revconfig.js

# Common changes:
# - Transition styles (line ~20-30)
# - Control settings (line ~40-60)
# - Plugin configurations (line ~100+)

# Commit
git add inc/revconfig.js
git commit -m "Update Reveal.js configuration: {description}"
git push
```

### 5. Enabling/Disabling Plugins

Edit `/inc/scripts-config.js`:

```javascript
const scriptConfig = {
  plugins: {
    menu: { path: "...", enabled: true },      // Set to false to disable
    markdown: { path: "...", enabled: true },
    notes: { path: "...", enabled: true },
    // etc.
  }
};
```

### 6. Adding Shared Image/Logo

```bash
# Copy to shared images directory
cp /path/to/logo.png img/

# Reference in presentations
# In closing slide HTML:
<img src="../img/logo.png" width="200px" alt="Logo">

# Commit
git add img/logo.png
git commit -m "Add new logo: logo.png"
git push
```

### 7. Archiving Old Presentation

```bash
# Move to archive
git mv {old-presentation}/ archive/

# Commit
git commit -m "Archive {old-presentation}"
git push
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Presentation Not Loading

**Symptoms:** Blank page or loading errors

**Possible causes:**
- JavaScript fetch failed (pres-head.html)
- Incorrect relative paths
- CORS issues (if testing with file:// protocol)

**Solutions:**
```bash
# Check that pres-head.html exists
ls inc/pres-head.html

# Verify relative paths in index.html
# All paths should start with ../inc/ or ../img/

# Use HTTP server for local testing (not file://)
python -m http.server 8000
```

#### 2. Markdown Not Rendering

**Symptoms:** Raw markdown visible in presentation

**Possible causes:**
- Markdown plugin not loaded
- Incorrect data attributes
- Markdown file path wrong

**Solutions:**
```html
<!-- Verify section attributes -->
<section data-markdown="./content.md"
         data-separator="^\n---\n"
         data-separator-vertical="^\n--\n"
         data-separator-notes="^notes:"
         data-charset="utf-8"></section>

<!-- Check markdown plugin is enabled -->
<!-- In scripts-config.js: -->
markdown: { path: "../inc/reveal.js/plugin/markdown/markdown.js", enabled: true }
```

#### 3. Theme Not Applying

**Symptoms:** Wrong colors, default theme showing

**Possible causes:**
- Theme file path incorrect
- CSS file missing
- Theme link not in head

**Solutions:**
```bash
# Verify theme file exists
ls inc/css/th-l-cr.css

# Check pres-head.html includes theme link
cat inc/pres-head.html | grep "theme"

# Should see:
# <link rel="stylesheet" href="../inc/css/th-l-cr.css" id="theme">
```

#### 4. QR Code Not Generating

**Symptoms:** No QR code on closing slide

**Possible causes:**
- qr.js not loaded
- Canvas element missing data-url attribute
- JavaScript error

**Solutions:**
```html
<!-- Verify QR script is loaded in head -->
<script src="../inc/qr.js"></script>

<!-- Verify canvas has correct attributes -->
<canvas id="qr-code" class="qr-code"
        width="140" height="140"
        data-url="https://mga.is/{presentation}/"></canvas>

<!-- Check browser console for JavaScript errors -->
```

#### 5. Fonts Not Loading

**Symptoms:** Fallback fonts used instead of custom fonts

**Possible causes:**
- Font files missing
- fonts.css not loaded
- Incorrect @font-face paths

**Solutions:**
```bash
# Verify font files exist
ls inc/css/woff2/

# Check fonts.css is loaded in pres-head.html
cat inc/pres-head.html | grep "fonts.css"

# Verify font paths in fonts.css
cat inc/css/fonts.css | grep "url("
# Should be: url('woff2/...')
```

#### 6. Speaker Notes Not Working

**Symptoms:** Notes button missing or notes not displaying

**Possible causes:**
- Notes plugin not enabled
- Notes separator incorrect
- Speaker view blocked by popup blocker

**Solutions:**
```javascript
// Verify notes plugin is enabled in scripts-config.js
notes: { path: "../inc/reveal.js/plugin/notes/notes.js", enabled: true }

// Check markdown separator
// In content.md, use:
notes:
Your notes here

// Press 's' to open speaker view (allow popups)
```

#### 7. Images Not Displaying

**Symptoms:** Broken image icons

**Possible causes:**
- Image path incorrect
- Image file missing
- File permissions issue

**Solutions:**
```bash
# Verify image exists
ls {presentation}/img/yourimage.png

# Check markdown reference
# Should be: ![Alt](./img/yourimage.png)
# NOT: ![Alt](img/yourimage.png)

# Check file permissions
ls -la {presentation}/img/
```

---

## Important Notes

### For AI Assistants Working on This Repository

#### DO:
- ✅ **Read existing presentations** before creating new ones to understand patterns
- ✅ **Use markdown** for presentation content (not inline HTML in slides)
- ✅ **Follow naming conventions** for consistency
- ✅ **Test locally** before committing
- ✅ **Use relative paths** (../inc/, ../img/) in all presentations
- ✅ **Keep presentations self-contained** in their directories
- ✅ **Reuse existing themes** rather than creating new ones unless requested
- ✅ **Commit with descriptive messages** explaining what changed
- ✅ **Update handout.html** when updating presentation content
- ✅ **Add speaker notes** using `notes:` separator for complex slides

#### DON'T:
- ❌ **Don't create build systems** - This is intentionally a static site
- ❌ **Don't install npm packages** - No package.json at root level
- ❌ **Don't use absolute paths** - Always use relative paths
- ❌ **Don't embed large images** - Optimize images before adding
- ❌ **Don't modify Reveal.js core files** - Use plugins and configuration instead
- ❌ **Don't create presentations in root directory** - Always use subdirectories
- ❌ **Don't commit binary files to git** except images and fonts
- ❌ **Don't modify CNAME** unless explicitly requested
- ❌ **Don't change domain configuration** without explicit permission
- ❌ **Don't remove presentations** without archiving them first

#### Content Guidelines:
- Presentations often deal with academic topics including sensitive subjects
- Maintain professional, academic tone in all content
- Include content advisories where appropriate (see cilc25 example)
- Reference academic sources appropriately
- Use clear, accessible language

#### Accessibility:
- Include alt text for all images
- Use semantic HTML structure
- Provide speaker notes for context
- Consider high-contrast themes for better readability
- Test with Atkinson Hyperlegible font option

#### Performance:
- Optimize images before adding (target <500KB per image)
- Use WOFF2 fonts (already optimized)
- Don't add unnecessary JavaScript libraries
- Keep markdown files concise (break into multiple presentations if >50 slides)

---

## Quick Reference

### Keyboard Shortcuts (in presentation)

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `↑` / `↓` | Navigate vertical slides |
| `Home` / `End` | First/last slide |
| `m` | Open menu |
| `s` | Speaker notes view |
| `f` | Fullscreen |
| `o` | Overview mode |
| `b` / `.` | Pause (black screen) |
| `?` | Show keyboard shortcuts |

### File Path Reference

```
Presentation HTML → ../inc/pres-head.html (common head)
Presentation HTML → ../inc/scripts-config.js (plugin config)
Presentation HTML → ../inc/script-loader.js (loader)
Presentation HTML → ../inc/qr.js (QR codes)
Presentation HTML → ../inc/css/th-l-cr.css (theme)
Presentation HTML → ../img/uog_mono.png (shared logo)
Presentation HTML → ./img/localimage.png (local image)
Presentation HTML → ./content.md (content file)
```

### Plugin Names

| Plugin | Purpose | Enable/Disable |
|--------|---------|----------------|
| menu | Theme switcher, navigation menu | scripts-config.js |
| markdown | External markdown file support | scripts-config.js |
| notes | Speaker notes | scripts-config.js |
| pdfexport | Export to PDF | scripts-config.js |
| appearance | CSS class animations | scripts-config.js |
| onetimer | Presentation timer | scripts-config.js |

---

## Additional Resources

- **Reveal.js Documentation**: https://revealjs.com/
- **Markdown Guide**: https://www.markdownguide.org/
- **Font Awesome Icons**: https://fontawesome.com/v6/search
- **GitHub Pages Docs**: https://docs.github.com/en/pages

---

## Changelog

### 2025-11-15
- Initial creation of CLAUDE.md
- Comprehensive documentation of codebase structure
- Added development workflows and conventions
- Documented common tasks and troubleshooting

---

## Contact

**Repository Owner:** Marc Alexander
**Email:** marc.alexander@glasgow.ac.uk
**Institution:** University of Glasgow

For questions about this documentation or the codebase, refer to existing presentations and templates in the `/archive/` directory, or examine recent commits for examples of changes.
