// Build a clean static deployment for Vercel without exposing editor files.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const directories = ['css', 'ico', 'js', 'src', 'vendor'];
const fileNames = ['manifest.json', 'logo13dductorder.png', 'logo23dductorder.png'];

for (const name of fs.readdirSync(root)) {
  const source = path.join(root, name);
  if (fs.statSync(source).isFile() && name.endsWith('.html')) {
    fileNames.push(name);
  }
}

for (const name of [...directories, ...fileNames]) {
  const source = path.join(root, name);
  if (!fs.existsSync(source)) throw new Error(`Missing deployment asset: ${name}`);
  fs.cpSync(source, path.join(dist, name), { recursive: true });
}

console.log(`Static site built in ${dist}`);
