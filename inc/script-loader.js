function loadScripts() {
  // Load core script first
  const coreScript = document.createElement('script');
  coreScript.src = scriptConfig.core;
  coreScript.onload = () => {
    // After core loads, load enabled plugins in parallel
    const enabledPlugins = Object.entries(scriptConfig.plugins)
      .filter(([_, plugin]) => plugin.enabled)
      .map(([_, plugin]) => plugin.path);
    
    // Load all plugins
    const loadPromises = enabledPlugins.map(path => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = path;
        script.onload = resolve;
        document.body.appendChild(script);
      });
    });
    
    // After all plugins load, load config
    Promise.all(loadPromises).then(() => {
      const configScript = document.createElement('script');
      configScript.src = scriptConfig.config;
      document.body.appendChild(configScript);
      
      // Setup theme-based logo switching after config is loaded
      configScript.onload = () => {
        setupThemeBasedLogos();
      };
    });
  };
  
  document.body.appendChild(coreScript);
}

// Function to set up theme-based logo switching
function setupThemeBasedLogos() {
  // Function to switch logos based on theme
  function switchLogos() {
    // Get the current theme link element
    const themeLink = document.getElementById('theme');
    const themeHref = themeLink ? themeLink.getAttribute('href') : '';
    
    // Check if the current theme is dark (contains 'th-d' or 'dark.css')
    const isDarkTheme = themeHref && (themeHref.includes('th-d') || themeHref.includes('dark.css'));
    
    // Get all UoG logos
    const uogLogos = document.querySelectorAll('.uog-logo');
    uogLogos.forEach(function(logo) {
      const imgSrc = logo.getAttribute('src');
      if (isDarkTheme) {
        logo.setAttribute('src', imgSrc.replace('uog_mono.png', 'uog_white.png'));
      } else {
        logo.setAttribute('src', imgSrc.replace('uog_white.png', 'uog_mono.png'));
      }
    });
    
    // Get all Leverhulme logos
    const leverhulmeLogos = document.querySelectorAll('.leverhulme-logo');
    leverhulmeLogos.forEach(function(logo) {
      const imgSrc = logo.getAttribute('src');
      if (isDarkTheme) {
        logo.setAttribute('src', imgSrc.replace('leverhulme_cmyk_black2.png', 'leverhulme_cmyk_white2.png'));
      } else {
        logo.setAttribute('src', imgSrc.replace('leverhulme_cmyk_white2.png', 'leverhulme_cmyk_black2.png'));
      }
    });
  }
  
  // Initial logo switch based on current theme
  setTimeout(switchLogos, 500); // Small delay to ensure theme is loaded
  
  // Watch for theme changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
        switchLogos();
      }
    });
  });
  
  // Start observing the theme link for href changes
  const themeLink = document.getElementById('theme');
  if (themeLink) {
    observer.observe(themeLink, { attributes: true });
  }
  
  // Handle when the theme is changed via the menu or clicks
  document.addEventListener('click', function() {
    // Small delay to allow theme to update
    setTimeout(switchLogos, 100);
  });
  
  // Handle when the theme is changed via keyboard shortcuts
  document.addEventListener('keydown', function() {
    // Small delay to allow theme to update if triggered by keyboard
    setTimeout(switchLogos, 100);
  });
}