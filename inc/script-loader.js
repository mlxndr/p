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
      
      // Setup theme-based elements after config is loaded
      configScript.onload = () => {
        setupThemeBasedElements();
      };
    });
  };
  
  document.body.appendChild(coreScript);
}

// Function to set up theme-based elements (logos and QR codes)
function setupThemeBasedElements() {
  // Get the current theme state
  function getThemeState() {
    const themeLink = document.getElementById('theme');
    const themeHref = themeLink ? themeLink.getAttribute('href') : '';
    const isDarkTheme = themeHref && (themeHref.includes('th-d') || themeHref.includes('dark.css'));
    return { themeLink, isDarkTheme };
  }

  // Function to switch logos based on theme
  function switchLogos() {
    const { isDarkTheme } = getThemeState();
    
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

    // Get all HT logos
    const htLogos = document.querySelectorAll('.ht-logo');
    htLogos.forEach(function(logo) {
      const imgSrc = logo.getAttribute('src');
      if (isDarkTheme) {
        logo.setAttribute('src', imgSrc.replace('ht-black-colour.png', 'ht-white.png'));
      } else {
        logo.setAttribute('src', imgSrc.replace('ht-white.png', 'ht-black-colour.png'));
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
  
  // Store QR code instances
  const qrInstances = {};
  
  // Function to update QR codes based on theme
  function updateQRCodes() {
    const { isDarkTheme } = getThemeState();
    
    // Find all QR code canvases with class 'qr-code'
    const qrCodes = document.querySelectorAll('canvas.qr-code');
    qrCodes.forEach(function(canvas) {
      const canvasId = canvas.id;
      const url = canvas.getAttribute('data-url') || 'https://mga.is/';
      const size = parseInt(canvas.getAttribute('width') || '140');
      
      // If we need to recreate the QR code due to theme change
      // First clear the canvas and remove the old instance
      if (qrInstances[canvasId]) {
        // Clear the canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Remove any child elements that might have been added by the QR library
        while (canvas.firstChild) {
          canvas.removeChild(canvas.firstChild);
        }
        
        // Delete the instance
        delete qrInstances[canvasId];
      }
      
      // Create/update QR code with appropriate color based on theme
      if (typeof QRCode !== 'undefined' && !qrInstances[canvasId]) {
        // Create new QR code instance
        qrInstances[canvasId] = new QRCode(canvasId, {
          text: url,
          size: size,
          background: "transparent",
          foreground: isDarkTheme ? "#ffffff" : "#000000",
          typeNumber: 4,
          errorCorrectLevel: 'H'
        });
      }
    });
  }
  
  // Function to update all theme-dependent elements
  function updateThemeElements() {
    switchLogos();
    updateQRCodes();
  }
  
  // Initial update with delay to ensure theme is loaded
  setTimeout(updateThemeElements, 500);
  
  // Watch for theme changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
        updateThemeElements();
      }
    });
  });
  
  // Start observing the theme link for href changes
  const { themeLink } = getThemeState();
  if (themeLink) {
    observer.observe(themeLink, { attributes: true });
  }
  
  // Handle when the theme is changed via the menu or clicks
  document.addEventListener('click', function() {
    setTimeout(updateThemeElements, 100);
  });
  
  // Handle when the theme is changed via keyboard shortcuts
  document.addEventListener('keydown', function() {
    setTimeout(updateThemeElements, 100);
  });
}