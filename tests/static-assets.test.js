const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

function walk(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.posix.join(directory, entry.name);
      return entry.isDirectory() ? walk(child) : [child];
    });
}

test('All entry pages use project-relative URLs (GitHub Pages compatible)', () => {
  for (const file of ['index.html', 'orders.html', 'index-new.html']) {
    const html = read(file);
    assert.doesNotMatch(html, /(?:href|src)\s*=\s*["']\/(?!\/)/, file);
    for (const [, , url] of html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/g)) {
      if (/^(?:https?:|data:|mailto:|#)/.test(url)) continue;
      const asset = decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\.\//, '');
      assert.ok(exists(asset || '.'), `${file} references missing asset ${url}`);
    }
  }
});

test('Import map points to vendored Three.js modules', () => {
  const html = read('index.html');
  const match = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(match, 'import map missing');
  const imports = JSON.parse(match[1]).imports;
  assert.equal(imports.three, './vendor/three/build/three.module.js');
  assert.equal(imports['three/addons/'], './vendor/three/examples/jsm/');
  assert.ok(exists('vendor/three/build/three.module.js'));
  assert.ok(exists('vendor/three/examples/jsm/controls/OrbitControls.js'));
});

test('All source imports resolve to repository files', () => {
  const html = read('index.html');
  const imports = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  for (const file of walk('src').filter((name) => name.endsWith('.js'))) {
    const source = read(file);
    for (const match of source.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g)) {
      const specifier = match[1];
      let target;
      if (specifier.startsWith('.')) {
        target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      } else if (specifier === 'three') {
        target = imports.three.replace(/^\.\//, '');
      } else if (specifier.startsWith('three/addons/')) {
        target = imports['three/addons/'].replace(/^\.\//, '') + specifier.slice('three/addons/'.length);
      } else {
        assert.fail(`${file} has an unmapped import: ${specifier}`);
      }
      assert.ok(exists(target), `${file}: unresolved import ${specifier} -> ${target}`);
    }
  }
});

test('PWA links and legacy viewer links stay within the project', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('./'), `Nonrelative icon: ${icon.src}`);
    assert.ok(exists(icon.src.replace(/^\.\//, '')), `Missing icon: ${icon.src}`);
  }
  assert.doesNotMatch(read('index-new.html'), /viewer\.html/);
});
