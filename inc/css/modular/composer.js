/**
 * Modular Theme Composer - Rebuilt
 * Generates complete CSS as a string and injects it
 */

class ThemeComposer {
  constructor() {
    this.composition = {
      palette: null,
      typography: null,
      layout: null,
      background: null
    };

    this.basePath = '../inc/css/modular/';
  }

  /**
   * Fetch CSS file content
   */
  async fetchCSS(layer, component) {
    const url = `${this.basePath}${layer}s/${layer}-${component}.css`;
    console.log(`[ThemeComposer] Fetching ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }

    const css = await response.text();
    console.log(`[ThemeComposer] ✓ Fetched ${layer}-${component}`);
    return css;
  }

  /**
   * Check if palette is dark
   */
  isDarkPalette(paletteName) {
    const darkPalettes = ['uog-blue', 'midnight', 'charcoal', 'forest', 'twilight'];
    return darkPalettes.includes(paletteName);
  }

  /**
   * Compose and apply theme
   */
  async compose(config) {
    console.log('[ThemeComposer] Composing theme:', config);

    this.composition = config;

    try {
      // Determine if we need dark or light base
      const isDark = config.palette && this.isDarkPalette(config.palette);

      // Build complete CSS content
      let cssContent = `/* Modular Theme Composition */\n\n`;

      // Import base styles
      cssContent += `@import url('../inc/css/base.css');\n`;
      cssContent += isDark ? `@import url('../inc/css/dark.css');\n\n` : `@import url('../inc/css/light.css');\n\n`;

      // Fetch and append each component
      if (config.palette) {
        const paletteCss = await this.fetchCSS('palette', config.palette);
        cssContent += `/* Palette: ${config.palette} */\n${paletteCss}\n\n`;
      }

      if (config.typography) {
        const typographyCss = await this.fetchCSS('typography', config.typography);
        cssContent += `/* Typography: ${config.typography} */\n${typographyCss}\n\n`;
      }

      if (config.layout) {
        const layoutCss = await this.fetchCSS('layout', config.layout);
        cssContent += `/* Layout: ${config.layout} */\n${layoutCss}\n\n`;
      }

      if (config.background) {
        const backgroundCss = await this.fetchCSS('background', config.background);
        cssContent += `/* Background: ${config.background} */\n${backgroundCss}\n\n`;
      }

      // Create blob URL from CSS content
      const blob = new Blob([cssContent], { type: 'text/css' });
      const blobUrl = URL.createObjectURL(blob);

      console.log('[ThemeComposer] Generated CSS blob:', blobUrl);

      // Update the theme link to point to our blob
      const themeLink = document.getElementById('theme');
      if (themeLink) {
        // Revoke previous blob URL if it exists
        if (themeLink.dataset.blobUrl) {
          URL.revokeObjectURL(themeLink.dataset.blobUrl);
        }

        // Update to new blob URL
        themeLink.href = blobUrl;
        themeLink.dataset.blobUrl = blobUrl;
        themeLink.dataset.modular = 'true';

        console.log('[ThemeComposer] ✓ Theme applied successfully');
      } else {
        console.error('[ThemeComposer] Theme link not found!');
      }

      // Save state
      this.saveState();

      // Force Reveal to recalculate
      if (window.Reveal) {
        setTimeout(() => {
          window.Reveal.layout();
        }, 100);
      }

      return this.composition;

    } catch (error) {
      console.error('[ThemeComposer] Error composing theme:', error);
      throw error;
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    const state = {
      composition: this.composition,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('modular-theme-state', JSON.stringify(state));
    console.log('[ThemeComposer] State saved');
  }

  /**
   * Load state from localStorage
   */
  async loadState() {
    const stateJson = localStorage.getItem('modular-theme-state');
    if (stateJson) {
      const state = JSON.parse(stateJson);
      if (state.composition) {
        console.log('[ThemeComposer] Loading saved state:', state.composition);
        await this.compose(state.composition);
      }
      return state;
    }
    return null;
  }

  /**
   * Get current composition
   */
  getComposition() {
    return { ...this.composition };
  }

  /**
   * Get available components
   */
  getAvailableComponents(layer) {
    const components = {
      palette: [
        { name: 'cream', label: 'Cream (Light)', wcag: 'AAA' },
        { name: 'paper', label: 'Paper (Light)', wcag: 'AAA' },
        { name: 'uog-blue', label: 'UoG Blue (Dark)', wcag: 'AAA' },
        { name: 'midnight', label: 'Midnight (Dark)', wcag: 'AAA' }
      ],
      typography: [
        { name: 'concourse', label: 'Concourse + Equity' },
        { name: 'century', label: 'Concourse + Century Supra' },
        { name: 'atkinson', label: 'Atkinson Hyperlegible' }
      ],
      layout: [
        { name: 'standard', label: 'Standard (Left-aligned)' },
        { name: 'centered', label: 'Centered Headings' }
      ],
      background: [
        { name: 'none', label: 'None (Solid Color)' },
        { name: 'paper', label: 'Paper Texture' },
        { name: 'polygons', label: 'Polygons Pattern' }
      ]
    };

    return components[layer] || [];
  }
}

// Create global instance
console.log('[ThemeComposer] Initializing ThemeComposer v2');
window.themeComposer = new ThemeComposer();

// Auto-load saved state when ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ThemeComposer] DOM ready');

  const initTheme = () => {
    if (window.Reveal) {
      console.log('[ThemeComposer] Reveal found');

      Reveal.on('ready', async () => {
        console.log('[ThemeComposer] Reveal ready - checking for saved state');

        const savedState = await window.themeComposer.loadState();

        if (!savedState) {
          console.log('[ThemeComposer] No saved state - using defaults');
          // Optionally load defaults
          // await window.themeComposer.compose({
          //   palette: 'cream',
          //   typography: 'concourse',
          //   layout: 'standard',
          //   background: 'none'
          // });
        }
      });
    } else {
      setTimeout(initTheme, 100);
    }
  };

  initTheme();
});
