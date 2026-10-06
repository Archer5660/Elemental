const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createStateStore } = require('../state-store');

test('state store writes and restores bounded normal profile state', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemental-state-'));
  const store = createStateStore(directory);
  store.save({
    version: 1,
    settings: { atom: true },
    selectedElement: { atomicNumber: 8, color: '#ff0000' },
    history: ['https://example.com'],
    tabs: [{ url: 'https://example.com' }]
  });
  const restored = createStateStore(directory).get();
  assert.equal(restored.settings.atom, true);
  assert.equal(restored.selectedElement.atomicNumber, 8);
  assert.deepEqual(restored.history, ['https://example.com']);
  assert.deepEqual(restored.tabs, [{ url: 'https://example.com' }]);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('corrupt state is quarantined and replaced with defaults', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemental-state-'));
  fs.writeFileSync(path.join(directory, 'state.json'), '{broken', 'utf8');
  const state = createStateStore(directory).get();
  assert.equal(state.version, 1);
  assert.equal(state.history.length, 0);
  assert.equal(fs.readdirSync(directory).some(name => name.startsWith('state.json.corrupt-')), true);
  fs.rmSync(directory, { recursive: true, force: true });
});
