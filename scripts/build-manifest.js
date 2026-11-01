// scripts/build-manifest.js
const fs = require('fs');
const path = require('path');

const rootDir = '.';
const excludedFolders = ['img', 'gamma', 'inc', 'f', 'css', 'archive', '.git', '.github', 'scripts', 'templates', 'node_modules', 'mockups', '_to_delete'];

// A deck is a folder with index.html and content.md or meta.json, one,
// two or three folders down (specimen/, research/icame47/, 1a/7/,
// 2a/words/2/). A folder that is not a deck and holds decks directly
// (1a/, 2a/words/, uog/) is a series: its decks are listed as "1a/7".
// (a series folder's own index.html, a page listing its decks, does not
// make it a deck: a deck has content.md or meta.json as well)
const MAX_DEPTH = 3;
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
const subdirs = rel => fs.readdirSync(path.join(rootDir, rel), { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => `${rel}/${e.name}`);
const decksUnder = (rel, depth) => {
    if (isDeck(path.join(rootDir, rel))) return [rel];
    if (depth >= MAX_DEPTH) return [];
    return subdirs(rel).flatMap(d => decksUnder(d, depth + 1));
};
const top = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') &&
        !excludedFolders.includes(entry.name.toLowerCase()))
    .map(entry => entry.name);

const presentations = top
    .flatMap(name => {
        const decks = decksUnder(name, 1);
        if (decks.length) return decks;
        // a page that is not a deck (a series index) is not listed
        return fs.existsSync(path.join(rootDir, name, 'index.html')) ? [] : [name];
    })
    .map(readMeta)
    // "unlisted": true in meta.json keeps a deck (e.g. specimen) off the
    // landing page while leaving it reachable by URL
    .filter(p => !p.unlisted);

// Every deck in a series folder, unlisted ones included, for the series
// index pages (inc/series.js): { "uog": [...], "2a/words": [...] }.
// Numbered folders (1a/7) sort by number; named ones (uog/20260819-ets)
// newest first, since they start with the date.
const series = {};
const collect = (rel, depth) => {
    if (depth >= MAX_DEPTH || isDeck(path.join(rootDir, rel))) return;
    const kids = subdirs(rel);
    const subs = kids.filter(d => isDeck(path.join(rootDir, d)));
    if (subs.length) {
        const leaf = d => d.split('/').pop();
        const numbered = subs.every(d => /^\d+$/.test(leaf(d)));
        subs.sort((a, b) => numbered ? leaf(a) - leaf(b) : leaf(b).localeCompare(leaf(a)));
        series[rel] = subs.map(readMeta);
    }
    kids.forEach(d => collect(d, depth + 1));
};
top.forEach(name => collect(name, 1));

fs.writeFileSync('manifest.json', JSON.stringify({ presentations, series }, null, 2));
console.log(`Generated manifest.json with ${presentations.length} presentations`);
