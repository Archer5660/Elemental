
let haptic = null;
if (process.platform === 'darwin') {
  try {
    haptic = require('macos-haptic');
  } catch (e) {
    console.error('Failed to load macos-haptic', e);
  }
}
const { app, BrowserWindow, BrowserView, ipcMain, Menu, dialog, globalShortcut, nativeImage, nativeTheme } = require('electron');
const path = require('path');
const { createStateStore } = require('./state-store');

const isPreBetaBuild = process.execPath.includes('Elemental Pre-BETA.app');
if (isPreBetaBuild) {
  app.setName('Elemental Pre-BETA');
  app.setPath('userData', path.join(app.getPath('appData'), 'Elemental Pre-BETA'));
}

let mainWindow;
const windowStates = new Map();
let nextTabId = 0;
let cursorInterval = null;
let dockIconInterval = null;
let isQuitting = false;
const stateStore = createStateStore(app.getPath('userData'));
const savedState = stateStore.get();
const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) {
  app.quit();
}

function updateMacDockIcon() {
  if (process.platform !== 'darwin' || !app.dock) return;
  const dark = nativeTheme.shouldUseDarkColors;
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, dark ? 'elemental-dark.png' : 'elemental-light.png')
    : path.join(__dirname, 'Elemental Icons', dark ? 'Mac Elemental Icon Dark.png' : 'Mac Elemental Icon Light.png');
  const icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) app.dock.setIcon(icon);
}

function createSettings() {
  return { ...savedState.settings, selectedElement: { ...savedState.selectedElement } };
}

function getStateForSender(event) {
  for (const state of windowStates.values()) {
    if (state.window.webContents === event.sender) return state;
  }
  return null;
}

function sendToRenderer(state, channel, ...args) {
  if (state && !state.window.isDestroyed()) state.window.webContents.send(channel, ...args);
}

function normalizeNavigationInput(input) {
  const value = String(input || '').trim();
  if (!value) return 'https://www.google.com';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value)) return `http://${value}`;
  return `https://${value}`;
}

function applySettingsToView(view, settings) {
  if (!view) return;

  if (settings.zerogravity) {
    const matterJsCode = require('fs').readFileSync(require('path').join(__dirname, 'matter.min.js'), 'utf8');
    const injectJsCode = require('fs').readFileSync(require('path').join(__dirname, 'inject-physics.js'), 'utf8');
    const finalCode = injectJsCode.replace('/* MATTER_JS_CODE */', matterJsCode);
    view.webContents.executeJavaScript(finalCode);
  } else {
    view.webContents.executeJavaScript(`
      if (window._zeroGravityInjected) {
         window.location.reload();
      }
    `);
  }


  if (settings.papyrus) {
    if (view.papyrusKey) view.webContents.removeInsertedCSS(view.papyrusKey).catch(() => {});
    view.webContents.insertCSS('* { font-family: "Papyrus", fantasy !important; }').then(key => {
      view.papyrusKey = key;
    });
  }

  if (settings.comicsans) {
    if (view.comicSansKey) view.webContents.removeInsertedCSS(view.comicSansKey).catch(() => {});
    view.webContents.insertCSS('* { font-family: "Comic Sans MS", "Comic Sans", cursive !important; }').then(key => {
      view.comicSansKey = key;
    });
  }

  const blackHoleCode = require('fs').readFileSync(path.join(__dirname, 'inject-black-hole.js'), 'utf8');
  const matterJsCode = require('fs').readFileSync(path.join(__dirname, 'matter.min.js'), 'utf8');
  view.webContents.executeJavaScript(blackHoleCode
    .replace('/* MATTER_BLACK_HOLE */', matterJsCode)
    .replace('BLACK_HOLE_ENABLED', settings.blackhole ? 'true' : 'false'));

  if (settings.cat) {
    const isGooseMode = settings.goose;
    view.webContents.executeJavaScript(`
      var GOOSE_PLACEHOLDER = ${isGooseMode};
if (window._catModInjected2) {
  var cat = document.getElementById('geometry-dash-cat-mod');
  if (cat) cat.remove();
  var cs = document.getElementById('cat-mod-style');
  if (cs) cs.remove();
  window._catModInjected2 = false;
  if (window._gooseInterval) {
    clearInterval(window._gooseInterval);
  }
}

window._catModInjected2 = true;
var isGoose = GOOSE_PLACEHOLDER;

var catStyle = document.createElement('style');
catStyle.id = 'cat-mod-style';

if (isGoose) {
  catStyle.textContent = [
    '@keyframes cat-front-run { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }',
    '@keyframes cat-back-run { 0%,100%{transform:rotate(30deg)} 50%{transform:rotate(-30deg)} }',
    '@keyframes cat-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }',
    '#cat-inner { position:relative;width:55px;height:55px; }',
    '#cat-inner.moving { animation: cat-bounce 0.25s infinite ease-in-out; }',
    '#cat-body-el { position:absolute;left:10px;top:25px;width:30px;height:18px;background:#fff;border-radius:15px; }',
    '#cat-head-el { position:absolute;left:-5px;top:0px;width:20px;height:20px;background:#fff;border-radius:50%; }',
    '#cat-neck-el { position:absolute;left:5px;top:10px;width:12px;height:25px;background:#fff;transform:rotate(-20deg); }',
    '#cat-beak-el { position:absolute;left:-12px;top:5px;width:15px;height:8px;background:#f39c12;border-radius:8px 0 0 8px; }',
    '.cat-eye-el { position:absolute;width:4px;height:4px;background:#000;border-radius:50%; }',
    '#cat-eye-l { left:2px;top:6px; }',
    '#cat-eye-r { left:10px;top:6px; }',
    '.cat-leg-el { position:absolute;width:4px;height:12px;background:#e67e22;border-radius:2px;transform-origin:top center; }',
    '#cat-fl.moving { animation:cat-front-run 0.22s infinite; }',
    '#cat-fr.moving { animation:cat-back-run 0.22s infinite; }',
    '#cat-fl { left:15px;top:40px; }',
    '#cat-fr { left:25px;top:40px; }',
    '.mud-footprint { position:fixed;width:12px;height:10px;background:#5c4033;border-radius:50%;opacity:0.7;pointer-events:none;z-index:2147483645; }',
    '.honk-text { position:fixed;color:#000;font-weight:bold;font-size:24px;pointer-events:none;z-index:2147483647;animation:honk-fade 2s forwards; }',
    '@keyframes honk-fade { 0%{opacity:1;transform:translateY(0);} 100%{opacity:0;transform:translateY(-50px);} }'
  ].join('\\n');
} else {
  catStyle.textContent = [
    '@keyframes cat-front-run { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }',
    '@keyframes cat-back-run { 0%,100%{transform:rotate(30deg)} 50%{transform:rotate(-30deg)} }',
    '@keyframes cat-tail-wag { 0%,100%{transform:rotate(-40deg)} 50%{transform:rotate(10deg)} }',
    '@keyframes cat-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }',
    '#cat-inner { position:relative;width:55px;height:38px; }',
    '#cat-inner.moving { animation: cat-bounce 0.25s infinite ease-in-out; }',
    '#cat-body-el { position:absolute;left:10px;top:12px;width:30px;height:16px;background:#f4a460;border-radius:12px 8px 8px 12px; }',
    '#cat-head-el { position:absolute;left:0;top:4px;width:18px;height:16px;background:#f4a460;border-radius:50%; }',
    '.cat-ear-el { position:absolute;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:6px solid #e8974f; }',
    '#cat-ear-l { left:1px;top:-2px;transform:rotate(-15deg); }',
    '#cat-ear-r { left:9px;top:-2px;transform:rotate(15deg); }',
    '.cat-eye-el { position:absolute;width:3px;height:4px;background:#333;border-radius:50%; }',
    '#cat-eye-l { left:5px;top:8px; }',
    '#cat-eye-r { left:11px;top:8px; }',
    '#cat-nose-el { position:absolute;left:2px;top:12px;width:3px;height:2px;background:#ff9999;border-radius:50%; }',
    '#cat-tail-el { position:absolute;left:38px;top:14px;width:16px;height:4px;background:#e8974f;border-radius:2px;transform-origin:left center;animation:cat-tail-wag 0.4s infinite ease-in-out; }',
    '.cat-leg-el { position:absolute;width:4px;height:12px;background:#d2946b;border-radius:2px;transform-origin:top center; }',
    '#cat-fl.moving { animation:cat-front-run 0.22s infinite; }',
    '#cat-fr.moving { animation:cat-back-run 0.22s infinite; }',
    '#cat-bl.moving { animation:cat-back-run 0.22s infinite; }',
    '#cat-br.moving { animation:cat-front-run 0.22s infinite; }',
    '#cat-fl { left:12px;top:26px; }',
    '#cat-fr { left:18px;top:26px; }',
    '#cat-bl { left:30px;top:26px; }',
    '#cat-br { left:36px;top:26px; }'
  ].join('\\n');
}

document.head.appendChild(catStyle);

var catOuter = document.createElement('div');
catOuter.id = 'geometry-dash-cat-mod';
catOuter.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;';

if (isGoose) {
  catOuter.innerHTML = '<div id="cat-inner">'
    + '<div id="cat-body-el"></div>'
    + '<div id="cat-neck-el"></div>'
    + '<div id="cat-head-el">'
    + '<div id="cat-beak-el"></div>'
    + '<div class="cat-eye-el" id="cat-eye-l"></div>'
    + '<div class="cat-eye-el" id="cat-eye-r"></div>'
    + '</div>'
    + '<div class="cat-leg-el" id="cat-fl"></div>'
    + '<div class="cat-leg-el" id="cat-fr"></div>'
    + '</div>';
} else {
  catOuter.innerHTML = '<div id="cat-inner">'
    + '<div id="cat-body-el"></div>'
    + '<div id="cat-head-el">'
    + '<div class="cat-ear-el" id="cat-ear-l"></div>'
    + '<div class="cat-ear-el" id="cat-ear-r"></div>'
    + '<div class="cat-eye-el" id="cat-eye-l"></div>'
    + '<div class="cat-eye-el" id="cat-eye-r"></div>'
    + '<div id="cat-nose-el"></div>'
    + '</div>'
    + '<div id="cat-tail-el"></div>'
    + '<div class="cat-leg-el" id="cat-fl"></div>'
    + '<div class="cat-leg-el" id="cat-fr"></div>'
    + '<div class="cat-leg-el" id="cat-bl"></div>'
    + '<div class="cat-leg-el" id="cat-br"></div>'
    + '</div>';
}

document.body.appendChild(catOuter);

var mouseX2 = window.innerWidth / 2, mouseY2 = window.innerHeight / 2;
var catX2 = mouseX2, catY2 = mouseY2;

document.addEventListener('mousemove', function(e) {
  mouseX2 = e.clientX;
  mouseY2 = e.clientY;
});

var catInner = catOuter.querySelector('#cat-inner');
var legs = catOuter.querySelectorAll('.cat-leg-el');

var lastMudTime = 0;

function animateCat2() {
  if (!document.getElementById('geometry-dash-cat-mod')) return;

  var dx = mouseX2 - catX2;
  var dy = mouseY2 - catY2;
  var dist = Math.sqrt(dx*dx + dy*dy);

  var isMoving = dist > 3;

  if (isMoving) {
    catX2 += dx * 0.05;
    catY2 += dy * 0.05;

    if (isGoose && Date.now() - lastMudTime > 200) {
      lastMudTime = Date.now();
      var mud = document.createElement('div');
      mud.className = 'mud-footprint';
      mud.style.left = (catX2 + (Math.random()*10 - 5)) + 'px';
      mud.style.top = (catY2 + 25 + (Math.random()*10 - 5)) + 'px';
      document.body.appendChild(mud);
      setTimeout(function() {
        mud.style.opacity = '0';
        setTimeout(function() { mud.remove(); }, 5000);
      }, 2000);
    }
  }

  if (isMoving) {
    catInner.classList.add('moving');
    legs.forEach(function(l) { l.classList.add('moving'); });
  } else {
    catInner.classList.remove('moving');
    legs.forEach(function(l) { l.classList.remove('moving'); });
  }

  var scaleX = (mouseX2 < catX2) ? 1 : -1;
  catOuter.style.left = catX2 + 'px';
  catOuter.style.top = (catY2 + 25) + 'px';
  catOuter.style.transform = 'translate(-50%, -50%) scaleX(' + scaleX + ')';

  requestAnimationFrame(animateCat2);
}
animateCat2();

if (isGoose) {
  window._gooseInterval = setInterval(function() {
    if (Math.random() < 0.3) {
      var honk = document.createElement('div');
      honk.className = 'honk-text';
      honk.innerText = 'HONK!';
      honk.style.left = catOuter.style.left;
      honk.style.top = catOuter.style.top;
      document.body.appendChild(honk);
      setTimeout(function() { honk.remove(); }, 2000);
    }
    if (Math.random() < 0.1) {
      window.scrollBy(Math.random()*200 - 100, Math.random()*200 - 100);
    }
  }, 3000);
}
    `);
  } else {
    view.webContents.executeJavaScript(`
      if (window._catModInjected2) {
        var cat = document.getElementById('geometry-dash-cat-mod');
        if (cat) cat.remove();
        var cs = document.getElementById('cat-mod-style');
        if (cs) cs.remove();
        window._catModInjected2 = false;
        if (window._gooseInterval) {
          clearInterval(window._gooseInterval);
        }
      }
    `);
  }
}

function updateViewBounds(state) {
  if (!state || !state.activeTabId || !state.views[state.activeTabId]) return;
  const [width, height] = state.window.getSize();
  if (state.pageFullscreen) {
    state.views[state.activeTabId].setBounds({ x: 0, y: 0, width, height });
    return;
  }
  const chromeHeight = isPreBetaBuild ? 144 : 114;
  const bottomMargin = state.settings.science ? 280 : 0;
  state.views[state.activeTabId].setBounds({ x: 0, y: chromeHeight, width, height: height - chromeHeight - bottomMargin });
}

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) || (url.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(url.hostname));
  } catch (_) {
    return false;
  }
}

function createTab(state, initialUrl = 'https://www.google.com') {
  const id = String(++nextTabId);
  const view = new BrowserView({ webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  state.views[id] = view;
  const recordNavigation = url => {
    if (!state.isIncognito && isAllowedUrl(url) && state.history[state.history.length - 1] !== url) state.history.push(url);
    if (state.history.length > 500) state.history.splice(0, state.history.length - 500);
    sendToRenderer(state, 'url-changed', id, url);
  };
  view.webContents.on('did-navigate', (_event, url) => recordNavigation(url));
  view.webContents.on('did-navigate-in-page', (_event, url) => recordNavigation(url));
  view.webContents.on('page-title-updated', (_event, title) => sendToRenderer(state, 'title-changed', id, title));
  view.webContents.on('did-finish-load', () => applySettingsToView(view, state.settings));
  view.webContents.on('page-favicon-updated', (_event, favicons) => favicons[0] && sendToRenderer(state, 'favicon-changed', id, favicons[0]));
  view.webContents.on('did-start-loading', () => sendToRenderer(state, 'loading-state', id, true));
  view.webContents.on('did-stop-loading', () => sendToRenderer(state, 'loading-state', id, false));
  view.webContents.on('render-process-gone', (_event, details) => {
    console.error(`Renderer exited for tab ${id}: ${details.reason} (${details.exitCode})`);
  });
  view.webContents.on('unresponsive', () => {
    console.warn(`Renderer became unresponsive for tab ${id}`);
  });
  view.webContents.on('enter-html-full-screen', () => {
    state.pageFullscreen = true;
    sendToRenderer(state, 'page-fullscreen-changed', true);
    updateViewBounds(state);
  });
  view.webContents.on('leave-html-full-screen', () => {
    state.pageFullscreen = false;
    sendToRenderer(state, 'page-fullscreen-changed', false);
    updateViewBounds(state);
  });
  view.webContents.on('will-navigate', (event, url) => { if (!isAllowedUrl(url)) event.preventDefault(); });
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedUrl(url)) return { action: 'deny' };
    createTab(state, url);
    return { action: 'deny' };
  });
  view.webContents.on('update-target-url', (_event, url) => sendToRenderer(state, 'target-url-changed', url));
  view.webContents.on('context-menu', (_event, params) => {
    Menu.buildFromTemplate([
      { label: 'Back', click: () => view.webContents.canGoBack() && view.webContents.goBack(), enabled: view.webContents.canGoBack() },
      { label: 'Forward', click: () => view.webContents.canGoForward() && view.webContents.goForward(), enabled: view.webContents.canGoForward() },
      { label: 'Reload', click: () => view.webContents.reload() },
      { type: 'separator' },
      { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
      { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { label: 'Inspect Element', click: () => view.webContents.inspectElement(params.x, params.y) }
    ]).popup({ window: state.window });
  });
  sendToRenderer(state, 'tab-created', id);
  switchTab(state, id);
  view.webContents.loadURL(initialUrl);
  return id;
}

function switchTab(state, id) {
  if (!state || !state.views[id]) return;
  state.activeTabId = id;
  state.window.setBrowserView(state.views[id]);
  updateViewBounds(state);
}

function closeTab(state, id) {
  if (!state || !state.views[id]) return;
  const view = state.views[id];
  if (state.activeTabId === id) state.window.removeBrowserView(view);
  view.webContents.destroy();
  delete state.views[id];
  sendToRenderer(state, 'tab-closed', id);
  const remaining = Object.keys(state.views);
  if (!remaining.length) createTab(state);
  else if (state.activeTabId === id) {
    switchTab(state, remaining[remaining.length - 1]);
    sendToRenderer(state, 'switch-tab', state.activeTabId);
  }
}

function attachDownloadHandling(state) {
  state.window.webContents.session.on('will-download', (_event, item) => {
    const filename = item.getFilename();
    sendToRenderer(state, 'download-started', filename);
    item.on('updated', (_updateEvent, downloadState) => {
      if (downloadState === 'interrupted') sendToRenderer(state, 'download-failed', filename);
      else if (downloadState === 'progressing') sendToRenderer(state, 'download-progress', filename, item.isPaused() ? 'paused' : (item.getTotalBytes() > 0 ? item.getReceivedBytes() / item.getTotalBytes() : null));
    });
    item.once('done', (_doneEvent, downloadState) => sendToRenderer(state, downloadState === 'completed' ? 'download-completed' : 'download-failed', filename, item.getSavePath()));
      item.once('done', () => state.downloads.delete(item));
      state.downloads.add(item);
  });
}

function createWindow(isIncognito = false) {
  const browserWindow = new BrowserWindow({
    width: 1200, height: 800,
    title: isIncognito ? 'Elemental Browser (Incognito)' : 'Elemental Browser',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 12, y: 8 } } : {}),
    ...(process.platform === 'win32' ? { titleBarOverlay: { color: '#f6f6f6', symbolColor: '#202124', height: 28 } } : {}),
    backgroundColor: '#f6f6f6', minWidth: 900, minHeight: 620,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: true, ...(isIncognito ? { partition: `incognito-${Date.now()}` } : {}) }
  });
  const windowId = browserWindow.webContents.id;
  const state = { window: browserWindow, views: {}, activeTabId: null, settings: isIncognito ? { ...createSettings(), selectedElement: { ...savedState.selectedElement } } : createSettings(), history: isIncognito ? [] : [...savedState.history], downloads: new Set(), isIncognito, ready: false, overlayWindow: null };
  windowStates.set(windowId, state);
  if (!mainWindow && !isIncognito) mainWindow = browserWindow;
  browserWindow.loadFile(path.join(__dirname, 'index.html'), isPreBetaBuild ? { query: { prebeta: '1' } } : undefined);
  browserWindow.webContents.on('console-message', (_event, level, message) => { if (level >= 2) console.warn('Renderer:', message); });
  state.overlayWindow = new BrowserWindow({ transparent: true, frame: false, hasShadow: false, focusable: false, parent: browserWindow, webPreferences: { preload: path.join(__dirname, 'overlay-preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  state.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  state.overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
  const syncOverlay = () => { if (!browserWindow.isDestroyed() && state.overlayWindow && !state.overlayWindow.isDestroyed()) state.overlayWindow.setBounds(browserWindow.getBounds()); };
  browserWindow.on('move', syncOverlay);
  browserWindow.on('resize', () => { syncOverlay(); updateViewBounds(state); });
  browserWindow.on('focus', () => sendToRenderer(state, 'window-focus-changed', true, process.platform === 'darwin'));
  browserWindow.on('blur', () => sendToRenderer(state, 'window-focus-changed', false, process.platform === 'darwin'));
  syncOverlay();
  attachDownloadHandling(state);
  browserWindow.on('closed', () => { windowStates.delete(windowId); if (state.overlayWindow && !state.overlayWindow.isDestroyed()) state.overlayWindow.destroy(); });
  if (!cursorInterval) {
    const { screen } = require('electron');
    cursorInterval = setInterval(() => windowStates.forEach(current => { if (current.overlayWindow && !current.overlayWindow.isDestroyed() && !current.overlayWindow.webContents.isDestroyed()) { const point = screen.getCursorScreenPoint(); const bounds = current.overlayWindow.getBounds(); current.overlayWindow.webContents.send('mouse-move', point.x - bounds.x, point.y - bounds.y); } }), 16);
  }
  return state;
}

function createSettingsOverlay(ownerState) {
  if (ownerState.settingsOverlay && !ownerState.settingsOverlay.isDestroyed()) {
    ownerState.settingsOverlay.focus();
    return;
  }
  const settingsWindow = new BrowserWindow({
    width: 540,
    height: 700,
    parent: ownerState.window,
    modal: false,
    frame: false,
    resizable: false,
    transparent: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  const settingsId = settingsWindow.webContents.id;
  const settingsState = {
    window: settingsWindow,
    views: {},
    activeTabId: null,
    settings: ownerState.settings,
    history: ownerState.history,
    downloads: new Set(),
    isIncognito: ownerState.isIncognito,
    isSettingsOverlay: true,
    owner: ownerState,
    ready: false,
    overlayWindow: null
  };
  ownerState.settingsOverlay = settingsWindow;
  windowStates.set(settingsId, settingsState);
  const positionSettingsOverlay = () => {
    if (ownerState.window.isDestroyed() || settingsWindow.isDestroyed()) return;
    const ownerBounds = ownerState.window.getBounds();
    const overlayWidth = 540;
    const overlayHeight = Math.max(500, ownerBounds.height - 130);
    settingsWindow.setBounds({
      x: ownerBounds.x + ownerBounds.width - overlayWidth - 10,
      y: ownerBounds.y + (isPreBetaBuild ? 144 : 114),
      width: overlayWidth,
      height: overlayHeight
    });
  };
  ownerState.window.on('move', positionSettingsOverlay);
  ownerState.window.on('resize', positionSettingsOverlay);
  positionSettingsOverlay();
  settingsWindow.loadFile(path.join(__dirname, 'index.html'), { query: { settingsOverlay: '1', ...(isPreBetaBuild ? { prebeta: '1' } : {}) } });
  settingsWindow.webContents.on('did-finish-load', () => {
    settingsWindow.webContents.send('restored-state', { settings: ownerState.settings, history: ownerState.history });
    settingsWindow.show();
    settingsWindow.focus();
  });
  settingsWindow.on('closed', () => {
    windowStates.delete(settingsId);
    ownerState.settingsOverlay = null;
    sendToRenderer(ownerState, 'settings-overlay-closed');
  });
}

function registerWindowIpc() {
  ipcMain.on('app-ready', (event) => {
    const state = getStateForSender(event);
    if (!state || state.ready) return;
    state.ready = true;
    if (state.isSettingsOverlay) return;
    sendToRenderer(state, 'restored-state', { settings: state.settings, history: state.history });
    const tabs = !state.isIncognito && savedState.tabs.length ? savedState.tabs : [{ url: 'https://www.google.com' }];
    tabs.forEach(tab => createTab(state, isAllowedUrl(tab.url) ? tab.url : 'https://www.google.com'));
  });
  ipcMain.on('navigate-to', (event, url) => { const state = getStateForSender(event); const tab = state && state.views[state.activeTabId]; const target = normalizeNavigationInput(url); if (tab && isAllowedUrl(target)) tab.webContents.loadURL(target).catch(error => console.warn('Navigation failed:', error.message)); });
  ipcMain.on('go-back', event => { const state = getStateForSender(event); const tab = state && state.views[state.activeTabId]; if (tab?.webContents.canGoBack()) tab.webContents.goBack(); });
  ipcMain.on('go-forward', event => { const state = getStateForSender(event); const tab = state && state.views[state.activeTabId]; if (tab?.webContents.canGoForward()) tab.webContents.goForward(); });
  ipcMain.on('reload', event => { const state = getStateForSender(event); state?.views[state.activeTabId]?.webContents.reload(); });
  ipcMain.on('new-tab', event => { const state = getStateForSender(event); if (state) createTab(state); });
  ipcMain.on('close-tab', (event, id) => { const state = getStateForSender(event); if (state && typeof id === 'string') closeTab(state, id); });
  ipcMain.on('switch-tab', (event, id) => { const state = getStateForSender(event); if (state && typeof id === 'string') switchTab(state, id); });
  ipcMain.on('goose-jolt', event => { const state = getStateForSender(event); if (state) { const [x, y] = state.window.getPosition(); state.window.setPosition(x + Math.floor(Math.random() * 200 - 100), y + Math.floor(Math.random() * 200 - 100)); } });
  ipcMain.on('trigger-haptic', () => { if (haptic?.perform) haptic.perform('alignment'); });
  ipcMain.on('import-bookmarks', event => {
    const fs = require('fs');
    const os = require('os');
    const bookmarksPath = process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Google', 'Chrome', 'User Data', 'Default', 'Bookmarks')
      : path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Bookmarks');
    if (fs.existsSync(bookmarksPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));
        const urls = [];
        function extract(node) {
          if (node.type === 'url') urls.push({ name: node.name, url: node.url });
          if (node.children) node.children.forEach(extract);
        }
        if (data.roots) {
          if (data.roots.bookmark_bar) extract(data.roots.bookmark_bar);
          if (data.roots.other) extract(data.roots.other);
        }
        sendToRenderer(getStateForSender(event), 'bookmarks-imported', urls.filter(item => isAllowedUrl(item.url)));
      } catch (e) {
        console.error(e);
      }
    } else {
      sendToRenderer(getStateForSender(event), 'bookmarks-imported', []);
    }
  });

  ipcMain.on('select-element', (event, atomicNumber, color, surfaceGradient, textColor) => {
    const state = getStateForSender(event);
    const ownerState = state?.owner || state;
    if (!state || !Number.isInteger(atomicNumber) || atomicNumber < 1 || atomicNumber > 118 || typeof color !== 'string') return;
    ownerState.settings.selectedElement = { atomicNumber, color };
    if (typeof surfaceGradient === 'string' && typeof textColor === 'string') sendToRenderer(ownerState, 'theme-changed', surfaceGradient, textColor);
    if (ownerState.settings.atom && ownerState.overlayWindow && !ownerState.overlayWindow.isDestroyed()) ownerState.overlayWindow.webContents.send('toggle-atom', true, ownerState.settings.selectedElement);
  });

  ipcMain.on('toggle-setting', (event, setting, value) => {
    const state = getStateForSender(event);
    const ownerState = state?.owner || state;
    const allowed = ['papyrus', 'comicsans', 'cat', 'goose', 'atom', 'blackhole', 'science', 'zerogravity'];
    if (!ownerState || !allowed.includes(setting) || typeof value !== 'boolean') return;
    ownerState.settings[setting] = value;
    if (setting === 'papyrus' && value) ownerState.settings.comicsans = false;
    if (setting === 'comicsans' && value) ownerState.settings.papyrus = false;
    if (setting === 'cat' && !value) ownerState.settings.goose = false;
    if (setting === 'goose' && value) ownerState.settings.cat = true;
    if (setting === 'blackhole' && value && ownerState.settingsOverlay && !ownerState.settingsOverlay.isDestroyed()) ownerState.settingsOverlay.close();
    Object.values(ownerState.views).forEach(view => setting === 'papyrus' || setting === 'comicsans' ? view.webContents.reload() : setting !== 'science' && applySettingsToView(view, ownerState.settings));
    if (setting === 'atom' && ownerState.overlayWindow && !ownerState.overlayWindow.isDestroyed()) ownerState.overlayWindow.webContents.send('toggle-atom', ownerState.settings.atom, ownerState.settings.selectedElement);
    if (setting === 'science') {
      updateViewBounds(ownerState);
      if (state.isSettingsOverlay) sendToRenderer(ownerState, 'science-mode-changed', value);
    }
  });

  ipcMain.on('toggle-settings-panel', (event, isOpen) => {
    const state = getStateForSender(event);
    const ownerState = state?.owner || state;
    if (!ownerState || typeof isOpen !== 'boolean') return;
    if (state?.isSettingsOverlay) {
      if (!isOpen && !state.window.isDestroyed()) state.window.close();
      return;
    }
    if (isOpen) { createSettingsOverlay(ownerState); return; }
    if (ownerState.settingsOverlay && !ownerState.settingsOverlay.isDestroyed()) ownerState.settingsOverlay.close();
    if (!ownerState.activeTabId || !ownerState.views[ownerState.activeTabId]) return;
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') nativeTheme.themeSource = 'system';
  updateMacDockIcon();
  if (process.platform === 'darwin') {
    nativeTheme.on('updated', updateMacDockIcon);
    dockIconInterval = setInterval(updateMacDockIcon, 500);
  }
  createWindow();
  registerWindowIpc();

  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('open-settings');
            }
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  function registerShortcuts() {
    globalShortcut.register('CommandOrControl+T', () => {
      const focused = BrowserWindow.getFocusedWindow();
      const state = focused && windowStates.get(focused.webContents.id);
      if (state) createTab(state);
    });

    globalShortcut.register('CommandOrControl+W', () => {
      const focused = BrowserWindow.getFocusedWindow();
      const state = focused && windowStates.get(focused.webContents.id);
      if (state?.activeTabId) closeTab(state, state.activeTabId);
    });

    for (let i = 1; i <= 9; i++) {
      globalShortcut.register(`CommandOrControl+${i}`, () => {
        const focused = BrowserWindow.getFocusedWindow();
        const state = focused && windowStates.get(focused.webContents.id);
        const ids = state ? Object.keys(state.views) : [];
        if (state && ids[i - 1]) switchTab(state, ids[i - 1]);
      });
    }

    globalShortcut.register('CommandOrControl+Shift+N', () => {
      const win = BrowserWindow.getFocusedWindow() || mainWindow;
      dialog.showMessageBox(win, {
        type: 'warning',
        title: 'Incognito',
        message: 'Where do you think you\'re going?',
        buttons: ['OK']
      }).then(() => {
        createWindow(true);
      });
    });
  }

  function unregisterShortcuts() {
    globalShortcut.unregisterAll();
  }

  app.on('browser-window-focus', registerShortcuts);
  app.on('browser-window-blur', unregisterShortcuts);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function savePersistentState() {
  const state = mainWindow && windowStates.get(mainWindow.webContents.id);
  if (!state || state.isIncognito) return;
  stateStore.save({
    version: 1,
    settings: state.settings,
    selectedElement: state.settings.selectedElement,
    history: state.history,
    tabs: Object.values(state.views).map(view => ({ url: view.webContents.getURL() })).filter(tab => isAllowedUrl(tab.url))
  });
}

app.on('before-quit', event => {
  if (isQuitting) return;
  const activeDownloads = [...windowStates].some(([, state]) => state.downloads.size > 0);
  if (activeDownloads) {
    const choice = dialog.showMessageBoxSync({ type: 'warning', title: 'Downloads in progress', message: 'Downloads are still active. Close Elemental and cancel them?', buttons: ['Cancel', 'Close Elemental'], defaultId: 0, cancelId: 0 });
    if (choice !== 1) { event.preventDefault(); return; }
    windowStates.forEach(state => state.downloads.forEach(item => { if (!item.isDone()) item.cancel(); }));
  }
  isQuitting = true;
  savePersistentState();
  if (cursorInterval) { clearInterval(cursorInterval); cursorInterval = null; }
  if (dockIconInterval) { clearInterval(dockIconInterval); dockIconInterval = null; }
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
