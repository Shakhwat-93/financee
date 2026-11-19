const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const appVersion = process.env.APP_VERSION || ('1.0.' + (process.env.GITHUB_RUN_NUMBER || '0'));

if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}
fs.mkdirSync(out, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const files = ['index.html', 'manifest.webmanifest', 'sw.js'];
const dirs = ['css', 'js', 'icons'];

for (const f of files) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(out, f));
}

for (const d of dirs) {
  const p = path.join(root, d);
  if (fs.existsSync(p)) copyRecursive(p, path.join(out, d));
}

// Stamp current build version for OTA Updater
fs.writeFileSync(
  path.join(out, 'js', 'version.js'),
  `window.APP_VERSION = '${appVersion}';\n`,
  'utf8'
);

console.log(`✅ Web assets prepared into www/ (version: ${appVersion})`);
