const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

// Windows .ico format:
//   6-byte ICONDIR header
//     2 bytes reserved (0)
//     2 bytes type (1 = ICO)
//     2 bytes count (number of images)
//   N x 16-byte ICONDIRENTRY
//     1 byte  width  (0 = 256)
//     1 byte  height (0 = 256)
//     1 byte  color count (0 = no palette)
//     1 byte  reserved (0)
//     2 bytes planes (1 or 0)
//     2 bytes bit count
//     4 bytes size of image data
//     4 bytes offset to image data
//   N x image data blobs (BMP or PNG)

const ICO_HEADER = 6;
const ICO_DIRENTRY = 16;

function readIco(buf) {
  if (buf.length < ICO_HEADER) throw new Error('file too small for ICO header');
  const reserved = buf.readUInt16LE(0);
  const type = buf.readUInt16LE(2);
  const count = buf.readUInt16LE(4);
  if (reserved !== 0) throw new Error('reserved bytes must be 0');
  if (type !== 1) throw new Error('type must be 1 (ICO)');
  if (count < 1 || count > 64) throw new Error(`unexpected image count ${count}`);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const off = ICO_HEADER + i * ICO_DIRENTRY;
    const w = buf.readUInt8(off);
    const h = buf.readUInt8(off + 1);
    const colors = buf.readUInt8(off + 2);
    const planes = buf.readUInt16LE(off + 4);
    const bitCount = buf.readUInt16LE(off + 6);
    const dataSize = buf.readUInt32LE(off + 8);
    const dataOff = buf.readUInt32LE(off + 12);
    entries.push({ width: w === 0 ? 256 : w, height: h === 0 ? 256 : h, colors, planes, bitCount, dataSize, dataOff });
  }
  return { count, entries };
}

test('build/elemental-windows.ico is a valid ICO file with multi-size entries', () => {
  const icoPath = path.join(__dirname, '..', 'build', 'elemental-windows.ico');
  assert.ok(fs.existsSync(icoPath), `expected ${icoPath} to exist`);
  const buf = fs.readFileSync(icoPath);
  const ico = readIco(buf);
  // Windows .ico should bundle several sizes so the OS picks the right one
  // for Start Menu (16), Taskbar (32), Task Manager (24/32), Alt-Tab (48),
  // Desktop shortcut (32/48/256), High-DPI scaling (64+).
  const sizes = ico.entries.map(e => e.width);
  assert.ok(sizes.includes(16), 'expected 16x16 entry');
  assert.ok(sizes.includes(32), 'expected 32x32 entry');
  assert.ok(sizes.includes(48), 'expected 48x48 entry');
  assert.ok(sizes.includes(256), 'expected 256x256 entry');
  // Each entry's data must fit within the file
  for (const e of ico.entries) {
    assert.ok(e.dataOff + e.dataSize <= buf.length, `entry size/offset out of bounds: ${JSON.stringify(e)}`);
  }
});

test('build/elemental-windows.ico no longer uses the legacy single-PNG path', () => {
  // After the rebuild, the build directory should expose the new .ico,
  // not the old single-size PNG. Both may exist (we keep the PNG as a
  // reference), but the build config must point at the .ico.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const icon = pkg.build && pkg.build.win && pkg.build.win.icon;
  assert.ok(typeof icon === 'string' && icon.length > 0, 'package.json build.win.icon must be a string');
  assert.ok(icon.endsWith('.ico'), `expected win.icon to point at a .ico file, got: ${icon}`);
});

test('the build directory exposes a Windows .ico source PNG', () => {
  // We pin a single Windows source PNG and build the multi-size .ico from it.
  // Windows does not have separate light/dark icon variants the way iOS/macOS do.
  const source = path.join(__dirname, '..', 'build', 'source', 'elemental-windows-source.png');
  assert.ok(fs.existsSync(source), 'expected build/source/elemental-windows-source.png');
  const ico = path.join(__dirname, '..', 'build', 'elemental-windows.ico');
  assert.ok(fs.existsSync(ico), 'expected build/elemental-windows.ico');
});

test('build/elemental-windows.ico is built from the Windows source PNG, not the Apple icon set', () => {
  // The Windows icon artwork is the periodic-table tile with "119", "234",
  // big "El" mark, and "Elemental" wordmark on a yellow background.
  // It is NOT the iOS & macOS Light/Dark set. We pin the source MD5 so a
  // future drift is caught in CI.
  const sourcePath = path.join(__dirname, '..', 'build', 'source', 'elemental-windows-source.png');
  assert.ok(fs.existsSync(sourcePath), 'expected build/source/elemental-windows-source.png');
  const source = fs.readFileSync(sourcePath);
  const sourceMd5 = require('node:crypto').createHash('md5').update(source).digest('hex');
  assert.equal(sourceMd5, '4854a2727b95ec4704b8e2b00ba3a9f8', 'Windows source artwork has changed; refresh the MD5 pin intentionally');

  // Sanity-check the dimensions: must be square, at least 256x256.
  const icoPath = path.join(__dirname, '..', 'build', 'elemental-windows.ico');
  const buf = fs.readFileSync(icoPath);
  const count = buf.readUInt16LE(4);
  let has256 = false;
  for (let i = 0; i < count; i++) {
    const off = ICO_HEADER + i * ICO_DIRENTRY;
    const w = buf.readUInt8(off);
    const h = buf.readUInt8(off + 1);
    if ((w === 0 || w === 256) && (h === 0 || h === 256)) { has256 = true; break; }
  }
  assert.ok(has256, 'expected a 256x256 entry in the .ico');

  // Stronger check: the .ico's 256x256 entry must contain the same artwork
  // as the source PNG (downsampled). Pillow encodes ICO entries as either
  // BMP or PNG; macOS iconutil only reverses PNG-encoded ICOs, so we use
  // Pillow to read both the .ico and the source and compare fingerprint.
  // We downsample both to 8x8 from a 256x256 base so the comparison is
  // independent of source resolution.
  const { execFileSync } = require('node:child_process');
  const fingerprint = (path, expectSize) => {
    const script = expectSize == null
      ? `from PIL import Image
import hashlib
im = Image.open('${path}').convert('RGBA').resize((256, 256), Image.LANCZOS).resize((8, 8), Image.LANCZOS)
print(hashlib.md5(im.tobytes()).hexdigest())`
      : `from PIL import Image
import hashlib
im = Image.open('${path}').convert('RGBA')
assert im.size == (${expectSize}, ${expectSize}), f'size mismatch: {im.size}'
im = im.resize((8, 8), Image.LANCZOS)
print(hashlib.md5(im.tobytes()).hexdigest())`;
    return execFileSync('python3', ['-c', script], { encoding: 'utf8' }).trim();
  };
  // For the .ico, we read the 256x256 entry directly so we don't re-decode
  // a downsampled copy. The ico argument uses a special path that pulls
  // the 256x256 entry from the multi-size .ico.
  const icoFingerprintScript = `from PIL import Image, IcoImagePlugin
import hashlib
ico = IcoImagePlugin.IcoImageFile('${icoPath.replace(/'/g, "\\'")}')
entry = ico.ico.getimage((256, 256))
entry = entry.convert('RGBA').resize((8, 8), Image.LANCZOS)
print(hashlib.md5(entry.tobytes()).hexdigest())`;
  const targetSig = execFileSync('python3', ['-c', icoFingerprintScript], { encoding: 'utf8' }).trim();
  const sourceSig = fingerprint(sourcePath, null);
  assert.equal(targetSig, sourceSig,
    'Windows .ico content does not match the Windows source PNG. Did the .ico get rebuilt from the Apple icon set?');
});
