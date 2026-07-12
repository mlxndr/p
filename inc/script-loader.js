function loadScripts() {
  // Helper to load a script with error handling
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  // Show error to user
  function showError(message) {
    console.error(message);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:20px;left:20px;right:20px;padding:20px;background:#fee;border:2px solid #c00;color:#900;font-family:sans-serif;z-index:99999;border-radius:8px;';
    errorDiv.innerHTML = '<strong>Presentation failed to load</strong><br>' + message + '<br><small>Check the browser console for details.</small>';
    document.body.appendChild(errorDiv);
  }

  // Load core script first
  loadScript(scriptConfig.core)
    .then(() => {
      // After core loads, load enabled plugins in parallel
      const enabledPlugins = Object.entries(scriptConfig.plugins)
        .filter(([_, plugin]) => plugin.enabled)
        .map(([_, plugin]) => plugin.path);

      return Promise.all(enabledPlugins.map(loadScript));
    })
    .then(() => {
      // Build metadata slides (title/closing placeholders) and expand
      // @-directives in external markdown before Reveal initialises
      // (both scripts load with the plugins above; the config script below
      // is what calls Reveal.initialize, so both must finish first)
      const pre = [];
      if (typeof buildMetaSlides === 'function') {
        pre.push(buildMetaSlides());
      }
      if (typeof expandMarkdownSections === 'function') {
        pre.push(expandMarkdownSections());
      }
      return Promise.all(pre);
    })
    .then(() => {
      // After all plugins load, load config
      return loadScript(scriptConfig.config);
    })
    .then(() => {
      // Setup theme-based elements after config is loaded
      setupThemeBasedElements();
      // Position @zoom detail images now Reveal has initialised
      if (typeof positionZoomImages === 'function') {
        positionZoomImages();
      }
      // Autofit overflowing split-slide text columns (re-run once webfonts
      // settle, since metrics shift)
      if (typeof autofitFillSlides === 'function') {
        autofitFillSlides();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(autofitFillSlides);
        }
      }
    })
    .catch(error => {
      showError(error.message);
    });
}

// Function to set up theme-based elements (logos and QR codes)
function setupThemeBasedElements() {
  // Get the current theme state
  function getThemeState() {
    const themeLink = document.getElementById('theme');
    const themeHref = themeLink ? themeLink.getAttribute('href') : '';
    const isDarkTheme = themeHref && (themeHref.includes('th-d') || themeHref.includes('dark.css') ||
      // light themes whose title/closing grounds need white logos and QR
      themeHref.includes('th-l-terracotta') || themeHref.includes('th-l-burgundy') ||
      themeHref.includes('th-l-slate') || themeHref.includes('th-l-petrol'));
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
    // Themes change font metrics, so re-fit overflowing split columns and
    // re-position zoom boxes. The fit resets before measuring, so late
    // passes correct any early pass that measured mid-load.
    function refit() {
      if (typeof autofitFillSlides === 'function') autofitFillSlides();
      if (typeof positionZoomImages === 'function') positionZoomImages();
    }
    const themeLink = document.getElementById('theme');
    if (themeLink) {
      themeLink.addEventListener('load', function() { setTimeout(refit, 60); }, { once: true });
    }
    setTimeout(refit, 350);
    setTimeout(refit, 1100);
  }

  // Make updateThemeElements available globally for other scripts
  window.updateThemeElements = updateThemeElements;

  // Initial update with delay to ensure theme is loaded
  setTimeout(updateThemeElements, 500);

  // Watch for theme changes via attribute changes on theme link
  let currentThemeLink = null;

  function observeThemeLink(themeLink) {
    if (!themeLink || themeLink === currentThemeLink) return;
    currentThemeLink = themeLink;

    const attrObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
          // Persist the choice (observers attach after the initial theme
          // is applied, so only genuine changes are saved)
          try { localStorage.setItem('theme', themeLink.getAttribute('href')); } catch (e) {}
          updateThemeElements();
        }
      });
    });
    attrObserver.observe(themeLink, { attributes: true });
  }

  // Start observing the initial theme link
  const { themeLink } = getThemeState();
  if (themeLink) {
    observeThemeLink(themeLink);
  }

  // Also watch document.head for new theme links being added
  // (reveal.js-menu removes and replaces the theme link element)
  const headObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeName === 'LINK' && node.id === 'theme') {
            // New theme link added (the menu plugin replaces the element):
            // persist the choice, observe it, and trigger update
            try { localStorage.setItem('theme', node.getAttribute('href')); } catch (e) {}
            observeThemeLink(node);
            setTimeout(updateThemeElements, 100);
          }
        });
      }
    });
  });
  headObserver.observe(document.head, { childList: true });
}