// Define available plugins and their paths (MGA_ROOT, from head.js, is
// '../' for a deck one folder down and '../../' for one two down, '../../../' three)
const MGA_R = window.MGA_ROOT || '../';
const scriptConfig = {
  core: MGA_R + "inc/reveal.js/dist/reveal.js",
  plugins: {
    menu: {
      path: MGA_R + "inc/reveal.js/plugin/reveal.js-menu/menu.js",
      enabled: true
    },
    markdown: {
      path: MGA_R + "inc/reveal.js/plugin/markdown/markdown.js",
      enabled: true
    },
    notes: {
      path: MGA_R + "inc/reveal.js/plugin/notes/notes.js",
      enabled: true
    },
    pdfexport: {
      path: MGA_R + "inc/reveal.js/plugin/pdfexport/pdfexport.js",
      enabled: true
    },
    appearance: {
      path: MGA_R + "inc/reveal.js/plugin/appearance/appearance.js",
      enabled: true
    },
    onetimer: {
      path: MGA_R + "inc/reveal.js/plugin/onetimer/onetimer.js",
      enabled: true
    },
    directives: {
      path: MGA_R + "inc/directives.js",
      enabled: true
    },
    meta: {
      path: MGA_R + "inc/meta.js",
      enabled: true
    }
  },
  config: MGA_R + "inc/revconfig.js"
};