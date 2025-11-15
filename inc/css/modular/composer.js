/**
 * Modular Theme Composer
 * Loads and composes modular theme components
 */

class ThemeComposer {
  constructor() {
    this.layers = {
      palette: null,
      typography: null,
      layout: null,
      background: null
    };

    this.basePath = '../inc/css/modular/';
    this.loadedStyles = new Map();
  }

  /**
   * Load a single layer component
   * @param {string} layer - Layer type (palette, typography, layout, background)
   * @param {string} component - Component name
   */
  loadLayer(layer, component) {
    // Remove existing layer if present
    const existingId = `modular-${layer}`;
    const existing = document.getElementById(existingId);
    if (existing) {
      existing.remove();
    }

    // Create and add new link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = existingId;
    link.href = `${this.basePath}${layer}s/${layer}-${component}.css`;
    link.dataset.layer = layer;
    link.dataset.component = component;

    document.head.appendChild(link);

    this.layers[layer] = component;
    this.loadedStyles.set(layer, link);

    // Save to localStorage
    this.saveState();

    return link;
  }

  /**
   * Compose complete theme from configuration
   * @param {Object} config - Configuration object with layer selections
   */
  compose(config) {
    // Load in correct cascade order
    if (config.palette) this.loadLayer('palette', config.palette);
    if (config.typography) this.loadLayer('typography', config.typography);
    if (config.layout) this.loadLayer('layout', config.layout);
    if (config.background) this.loadLayer('background', config.background);

    return this.layers;
  }

  /**
   * Save current composition to localStorage
   */
  saveState() {
    const state = {
      layers: this.layers,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('modular-theme-state', JSON.stringify(state));
  }

  /**
   * Load composition from localStorage
   */
  loadState() {
    const stateJson = localStorage.getItem('modular-theme-state');
    if (stateJson) {
      const state = JSON.parse(stateJson);
      if (state.layers) {
        this.compose(state.layers);
      }
      return state;
    }
    return null;
  }

  /**
   * Get current composition
   */
  getComposition() {
    return { ...this.layers };
  }

  /**
   * Reset to default composition
   */
  reset() {
    // Clear all modular styles
    this.loadedStyles.forEach(link => link.remove());
    this.loadedStyles.clear();

    this.layers = {
      palette: null,
      typography: null,
      layout: null,
      background: null
    };

    localStorage.removeItem('modular-theme-state');
  }

  /**
   * Get available components for a layer
   * @param {string} layer - Layer type
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
window.themeComposer = new ThemeComposer();

// Auto-load saved state when reveal is ready
if (window.Reveal) {
  Reveal.on('ready', () => {
    const savedState = window.themeComposer.loadState();
    if (!savedState) {
      // Load default composition if no saved state
      window.themeComposer.compose({
        palette: 'cream',
        typography: 'concourse',
        layout: 'standard',
        background: 'none'
      });
    }
  });
}
