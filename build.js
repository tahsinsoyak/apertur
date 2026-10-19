const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Folders and files to include in dist
const ITEMS_TO_COPY = [
  'manifest.json',
  'background',
  'content',
  'icons',
  'landing',
  'offscreen',
  'popup',
  'preview',
  'utils'
];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

function build() {
  console.log('🚀 Building Tab Recorder Studio into dist/ ...');

  // 1. Clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Copy items
  for (const item of ITEMS_TO_COPY) {
    const srcPath = path.join(ROOT_DIR, item);
    const destPath = path.join(DIST_DIR, item);
    if (fs.existsSync(srcPath)) {
      copyRecursiveSync(srcPath, destPath);
      console.log(`  ✓ Copied ${item}`);
    } else {
      console.warn(`  ⚠ Warning: ${item} not found`);
    }
  }

  // 3. Validate manifest
  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('  ✓ manifest.json validated in dist/');
    } catch (e) {
      console.error('  ✗ Error: manifest.json is invalid JSON', e);
      process.exit(1);
    }
  }

  console.log('\n✨ Build complete! Production extension is ready in:');
  console.log(`   ${DIST_DIR}\n`);
}

build();
