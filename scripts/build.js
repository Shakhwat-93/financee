const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');

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

console.log('✅ Web assets successfully prepared into www folder for mobile app build!');
