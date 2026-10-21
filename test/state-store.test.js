const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createStateStore, CURRENT_VERSION } = require('../state-store');

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

test('ai mode defaults to "on" on a fresh install', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemental-state-'));
  const state = createStateStore(directory).get();
  assert.equal(state.settings.aiMode, 'on');
  fs.rmSync(directory, { recursive: true, force: true });
});

test('ai mode accepts the three valid string values: on, search-off, all-off', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemental-state-'));
  const store = createStateStore(directory);
  for (const value of ['on', 'search-off', 'all-off']) {
    store.save({
      version: CURRENT_VERSION,
      settings: { aiMode: value },
      selectedElement: { atomicNumber: 1, color: '#a0e6ff' },
      history: [],
      tabs: []
    });
    const restored = createStateStore(directory).get();
    assert.equal(restored.settings.aiMode, value, `expected aiMode=${value} after save+restore`);
  }
  fs.rmSync(directory, { recursive: true, force: true });
});

test('ai mode rejects unknown values and falls back to "on"', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemental-state-'));
  fs.writeFileSync(
    path.join(directory, 'state.json'),
    JSON.stringify({
      version: 1,
      settings: { aiMode: 'definitely-not-real' },
      selectedElement: { atomicNumber: 1, color: '#a0e6ff' },
      history: [],
      tabs: []
    }),
    'utf8'
  );
  const state = createStateStore(directory).get();
  assert.equal(state.settings.aiMode, 'on');
  fs.rmSync(directory, { recursive: true, force: true });
});

test('ai mode survives a save/restore round-trip alongside other settings', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemental-state-'));
  const store = createStateStore(directory);
  store.save({
    version: CURRENT_VERSION,
    settings: { aiMode: 'all-off', atom: true, blackhole: true },
    selectedElement: { atomicNumber: 26, color: '#D3D3D3' },
    history: [],
    tabs: []
  });
  const restored = createStateStore(directory).get();
  assert.equal(restored.settings.aiMode, 'all-off');
  assert.equal(restored.settings.atom, true);
  assert.equal(restored.settings.blackhole, true);
  assert.equal(restored.selectedElement.atomicNumber, 26);
  fs.rmSync(directory, { recursive: true, force: true });
});
