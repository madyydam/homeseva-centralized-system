const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const desktopRoot = path.join(__dirname, '..');
const distApp = path.join(desktopRoot, 'dist-app');

if (!fs.existsSync(distApp)) {
  fs.mkdirSync(distApp, { recursive: true });
}

// 1. Bundle main.js
esbuild.buildSync({
  entryPoints: [path.join(desktopRoot, 'src/main.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],
  outfile: path.join(distApp, 'main.js'),
  minify: true,
});

// 2. Copy preload.js, offline.html, and updater.html
fs.copyFileSync(
  path.join(desktopRoot, 'src/preload.js'),
  path.join(distApp, 'preload.js')
);
fs.copyFileSync(
  path.join(desktopRoot, 'src/offline.html'),
  path.join(distApp, 'offline.html')
);
fs.copyFileSync(
  path.join(desktopRoot, 'src/updater.html'),
  path.join(distApp, 'updater.html')
);

console.log('✅ Main process & assets successfully bundled to dist-app/');
