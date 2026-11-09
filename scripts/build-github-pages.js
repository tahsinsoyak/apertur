const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const LANDING_DIR = path.join(ROOT_DIR, 'landing');
const ICONS_DIR = path.join(ROOT_DIR, 'icons');

// 1. Create docs directories
fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(path.join(DOCS_DIR, 'assets'), { recursive: true });
fs.mkdirSync(path.join(DOCS_DIR, 'icons'), { recursive: true });

// 2. Create .nojekyll in root and docs
fs.writeFileSync(path.join(ROOT_DIR, '.nojekyll'), '', 'utf8');
fs.writeFileSync(path.join(DOCS_DIR, '.nojekyll'), '', 'utf8');

// 3. Copy assets and icons into docs
const landingAssets = fs.readdirSync(path.join(LANDING_DIR, 'assets'));
for (const file of landingAssets) {
  fs.copyFileSync(
    path.join(LANDING_DIR, 'assets', file),
    path.join(DOCS_DIR, 'assets', file)
  );
}

const icons = fs.readdirSync(ICONS_DIR);
for (const file of icons) {
  fs.copyFileSync(
    path.join(ICONS_DIR, file),
    path.join(DOCS_DIR, 'icons', file)
  );
}

// 4. Copy landing.css and landing.js into docs
fs.copyFileSync(path.join(LANDING_DIR, 'landing.css'), path.join(DOCS_DIR, 'landing.css'));
fs.copyFileSync(path.join(LANDING_DIR, 'landing.js'), path.join(DOCS_DIR, 'landing.js'));

// 5. Generate docs/index.html (self-contained for /docs GitHub Pages)
let docsIndex = fs.readFileSync(path.join(LANDING_DIR, 'index.html'), 'utf8');
docsIndex = docsIndex.replace(/\.\.\/icons\//g, 'icons/');
docsIndex = docsIndex.replace(/\.\.\/preview\/preview\.html\?view=gallery/g, 'https://github.com/tahsinsoyak/apertur');
fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), docsIndex, 'utf8');

// 6. Generate docs/sponsor.html (self-contained for /docs GitHub Pages)
let docsSponsor = fs.readFileSync(path.join(LANDING_DIR, 'sponsor.html'), 'utf8');
docsSponsor = docsSponsor.replace(/\.\.\/icons\//g, 'icons/');
fs.writeFileSync(path.join(DOCS_DIR, 'sponsor.html'), docsSponsor, 'utf8');

// 7. Generate root index.html (self-contained for root / GitHub Pages)
let rootIndex = fs.readFileSync(path.join(LANDING_DIR, 'index.html'), 'utf8');
rootIndex = rootIndex.replace(/href="landing\.css"/g, 'href="landing/landing.css"');
rootIndex = rootIndex.replace(/src="landing\.js"/g, 'src="landing/landing.js"');
rootIndex = rootIndex.replace(/src="assets\//g, 'src="landing/assets/');
rootIndex = rootIndex.replace(/\.\.\/icons\//g, 'icons/');
rootIndex = rootIndex.replace(/\.\.\/preview\/preview\.html\?view=gallery/g, 'https://github.com/tahsinsoyak/apertur');
fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), rootIndex, 'utf8');

// 8. Generate root sponsor.html (self-contained for root / GitHub Pages)
let rootSponsor = fs.readFileSync(path.join(LANDING_DIR, 'sponsor.html'), 'utf8');
rootSponsor = rootSponsor.replace(/href="landing\.css"/g, 'href="landing/landing.css"');
rootSponsor = rootSponsor.replace(/src="assets\//g, 'src="landing/assets/');
rootSponsor = rootSponsor.replace(/\.\.\/icons\//g, 'icons/');
fs.writeFileSync(path.join(ROOT_DIR, 'sponsor.html'), rootSponsor, 'utf8');

// 9. Generate privacy.html for both /docs and root (required URL for Chrome Web Store listing)
const privacyOut = fs
  .readFileSync(path.join(LANDING_DIR, 'privacy.html'), 'utf8')
  .replace(/\.\.\/icons\//g, 'icons/');
fs.writeFileSync(path.join(DOCS_DIR, 'privacy.html'), privacyOut, 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'privacy.html'), privacyOut, 'utf8');

console.log('✓ Successfully synchronized GitHub Pages for both root (/) and /docs deployments!');
