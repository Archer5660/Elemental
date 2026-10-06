const fs = require('fs');
const path = require('path');

const CURRENT_VERSION = 1;
const DEFAULT_STATE = {
  version: CURRENT_VERSION,
  settings: {
    papyrus: false,
    comicsans: false,
    cat: false,
    goose: false,
    atom: false,
    blackhole: false,
    science: false,
    zerogravity: false
  },
  selectedElement: { atomicNumber: 1, color: '#a0e6ff' },
  history: [],
  tabs: []
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function normalizeState(value) {
  const state = cloneDefaultState();
  if (!value || typeof value !== 'object') return state;
  if (value.version === CURRENT_VERSION) {
    Object.assign(state.settings, value.settings);
    if (value.selectedElement && Number.isInteger(value.selectedElement.atomicNumber)) {
      state.selectedElement = {
        atomicNumber: value.selectedElement.atomicNumber,
        color: typeof value.selectedElement.color === 'string' ? value.selectedElement.color : state.selectedElement.color
      };
    }
    if (Array.isArray(value.history)) state.history = value.history.filter(item => typeof item === 'string').slice(-500);
    if (Array.isArray(value.tabs)) state.tabs = value.tabs.filter(tab => tab && typeof tab.url === 'string').slice(0, 50);
  }
  return state;
}

function createStateStore(userDataPath) {
  const statePath = path.join(userDataPath, 'state.json');
  let state = cloneDefaultState();

  try {
    state = normalizeState(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      try { fs.renameSync(statePath, `${statePath}.corrupt-${Date.now()}`); } catch (_) {}
    }
  }

  return {
    get() {
      return state;
    },
    save(nextState) {
      state = normalizeState(nextState);
      fs.mkdirSync(userDataPath, { recursive: true });
      const temporaryPath = `${statePath}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(temporaryPath, statePath);
    }
  };
}

module.exports = { createStateStore, CURRENT_VERSION };
