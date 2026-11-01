// scripts/build-manifest.js
const fs = require('fs');
const path = require('path');

const rootDir = '.';
const excludedFolders = ['img', 'gamma', 'inc', 'f', 'css', 'archive', '.git', '.github', 'scripts', 'templates', 'node_modules', 'mockups', '_to_delete'];

// A deck is a folder one level down (icame47/) or two (1a/7/). A
// top-level folder with no index.html of its own whose subfolders hold
// decks (1a/, words/) is a series: its decks are listed as "1a/7".
// (a series folder's own index.html, a page listing its decks, does not
// make it a deck: a deck has content.md or meta.json as well)
const isDeck = dir => fs.existsSync(path.join(dir, 'index.html')) &&
    (fs.existsSync(path.join(dir, 'content.md')) || fs.existsSync(path.join(dir, 'meta.json')));
const readMeta = (dirName) => {
    const metaPath = path.join(rootDir, dirName, 'meta.json');
    let meta = {};
    if (fs.existsSync(metaPath)) {
        try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        } catch (e) {
            console.warn(`Invalid meta.json in ${dirName}`);
        }
    }
    return { dirName, ...meta };
};
const subDecks = name => fs.readdirSync(path.join(rootDir, name), { withFileTypes: true })
    .filter(e => e.isDirectory() && isDeck(path.join(rootDir, name, e.name)))
    .map(e => `${name}/${e.name}`);

const presentations = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !excludedFolders.includes(entry.name.toLowerCase()))
    .flatMap(entry => {
        if (isDeck(path.join(rootDir, entry.name))) return [entry.name];
        const subs = subDecks(entry.name);
        if (subs.length) return subs;
        // a page that is not a deck (a series index such as 2a/) is not listed
        return fs.existsSync(path.join(rootDir, entry.name, 'index.html')) ? [] : [entry.name];
    })
    .map(readMeta)
    // "unlisted": true in meta.json keeps a deck (e.g. specimen) off the
    // landing page while leaving it reachable by URL
    .filter(p => !p.unlisted);

fs.writeFileSync('manifest.json', JSON.stringify({ presentations }, null, 2));
console.log(`Generated manifest.json with ${presentations.length} presentations`);