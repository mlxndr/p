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
    });
  };
  
  document.body.appendChild(coreScript);
}