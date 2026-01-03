// scripts/build-manifest.js
const fs = require('fs');
const path = require('path');

const rootDir = '.';
const excludedFolders = ['img', 'gamma', 'inc', 'f', 'css', 'archive', '.git', '.github', 'scripts', 'node_modules'];

const presentations = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !excludedFolders.includes(entry.name.toLowerCase()))
    .map(entry => {
        const metaPath = path.join(rootDir, entry.name, 'meta.json');
        let meta = {};
        
        if (fs.existsSync(metaPath)) {
            try {
                meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            } catch (e) {
                console.warn(`Invalid meta.json in ${entry.name}`);
            }
        }
        
        return {
            dirName: entry.name,
            ...meta
        };
    });

fs.writeFileSync('manifest.json', JSON.stringify({ presentations }, null, 2));
console.log(`Generated manifest.json with ${presentations.length} presentations`);