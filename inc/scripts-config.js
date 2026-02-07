// Define available plugins and their paths
const scriptConfig = {
  core: "../inc/reveal.js/dist/reveal.js",
  plugins: {
    menu: {
      path: "../inc/reveal.js/plugin/reveal.js-menu/menu.js",
      enabled: true
    },
    markdown: {
      path: "../inc/reveal.js/plugin/markdown/markdown.js",
      enabled: true
    },
    notes: {
      path: "../inc/reveal.js/plugin/notes/notes.js",
      enabled: true
    },
    pdfexport: {
      path: "../inc/reveal.js/plugin/pdfexport/pdfexport.js",
      enabled: true
    },
    appearance: {
      path: "../inc/reveal.js/plugin/appearance/appearance.js",
      enabled: true
    },
    onetimer: {
      path: "../inc/reveal.js/plugin/onetimer/onetimer.js",
      enabled: true
    },
    effects: {
      path: "../inc/effects.js",
      enabled: true
    },
    interactive: {
      path: "../inc/interactive.js",
      enabled: true
    }
  },
  config: "../inc/revconfig.js"
};