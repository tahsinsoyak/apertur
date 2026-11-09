/**
 * Packages the production extension (dist/) into a Chrome Web Store–ready ZIP.
 *
 *   npm run package
 *   → release/apertur-v<version>-chrome-web-store.zip
 *
 * Dependency-free ZIP writer (Node zlib + CRC32) so archive entries always use
 * forward slashes — PowerShell's Compress-Archive can emit backslash paths that
 * the Chrome Web Store rejects.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const RELEASE = path.join(ROOT, 'release');

// Files that must never ship inside the store package
const EXCLUDE = [/\.DS_Store$/, /Thumbs\.db$/, /\.map$/, /\.md$/];

// --- CRC32 -----------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, base);
    const rel = path.relative(base, full).split(path.sep).join('/');
    return EXCLUDE.some((re) => re.test(rel)) ? [] : [{ full, rel }];
  });
}

function createZip(files, outFile) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, day } = dosDateTime(new Date());

  for (const { full, rel } of files) {
    const data = fs.readFileSync(full);
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = compressed.length < data.length;
    const body = useDeflate ? compressed : data;
    const name = Buffer.from(rel, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + body.length;
  }

  const centralSize = centralParts.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);

  fs.writeFileSync(outFile, Buffer.concat([...localParts, ...centralParts, end]));
}

// --- Main --------------------------------------------------------------------
execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'inherit' });

const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
if (manifest.version !== pkg.version) {
  console.error(`✗ Version mismatch: manifest.json=${manifest.version} package.json=${pkg.version}`);
  process.exit(1);
}
if (manifest.description && manifest.description.length > 132) {
  console.error(`✗ manifest description is ${manifest.description.length} chars (store max is 132)`);
  process.exit(1);
}

fs.mkdirSync(RELEASE, { recursive: true });
const outFile = path.join(RELEASE, `apertur-v${manifest.version}-chrome-web-store.zip`);
const files = walk(DIST);
createZip(files, outFile);

const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
console.log(`📦 Packaged ${files.length} files → ${path.relative(ROOT, outFile)} (${sizeMb} MB)`);
console.log('   Upload this ZIP at https://chrome.google.com/webstore/devconsole');
