const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('browserAPI', {
  navigateTo: (url) => ipcRenderer.send('navigate-to', url),
  goBack: () => ipcRenderer.send('go-back'),
  goForward: () => ipcRenderer.send('go-forward'),
  reload: () => ipcRenderer.send('reload'),
  onUrlChanged: (callback) => ipcRenderer.on('url-changed', (event, tabId, url) => callback(tabId, url)),
  onTitleChanged: (callback) => ipcRenderer.on('title-changed', (event, tabId, title) => callback(tabId, title)),
  toggleSetting: (setting, value) => ipcRenderer.send('toggle-setting', setting, value),

  newTab: () => ipcRenderer.send('new-tab'),
  closeTab: (id) => ipcRenderer.send('close-tab', id),
  switchTab: (id) => ipcRenderer.send('switch-tab', id),
  onTabCreated: (callback) => ipcRenderer.on('tab-created', (event, id) => callback(id)),
  onTabClosed: (callback) => ipcRenderer.on('tab-closed', (event, id) => callback(id)),
  onTabSwitched: (callback) => ipcRenderer.on('switch-tab', (event, id) => callback(id)),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', () => callback()),
  onSettingsOverlayClosed: (callback) => ipcRenderer.on('settings-overlay-closed', () => callback()),
  onScienceModeChanged: (callback) => ipcRenderer.on('science-mode-changed', (_event, enabled) => callback(enabled)),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', (_event, gradient, textColor) => callback(gradient, textColor)),
  onPageFullscreenChanged: (callback) => ipcRenderer.on('page-fullscreen-changed', (_event, active) => callback(active)),
  onWindowFocusChanged: (callback) => ipcRenderer.on('window-focus-changed', (_event, focused, isMac) => callback(focused, isMac)),
  appReady: () => ipcRenderer.send('app-ready'),
  toggleSettingsPanel: (isOpen) => ipcRenderer.send('toggle-settings-panel', isOpen),
  selectElement: (atomicNumber, color, surfaceGradient, textColor) => ipcRenderer.send('select-element', atomicNumber, color, surfaceGradient, textColor),

  importBookmarks: () => ipcRenderer.send('import-bookmarks'),
  triggerHaptic: () => ipcRenderer.send('trigger-haptic'),
  onBookmarksImported: (callback) => ipcRenderer.on('bookmarks-imported', (event, urls) => callback(urls)),

  onFaviconChanged: (callback) => ipcRenderer.on('favicon-changed', (event, tabId, faviconUrl) => callback(tabId, faviconUrl)),
  onLoadingState: (callback) => ipcRenderer.on('loading-state', (event, tabId, isLoading) => callback(tabId, isLoading)),
  onTargetUrlChanged: (callback) => ipcRenderer.on('target-url-changed', (event, url) => callback(url)),
  onRestoredState: (callback) => ipcRenderer.on('restored-state', (event, state) => callback(state)),

  onDownloadStarted: (callback) => ipcRenderer.on('download-started', (event, filename) => callback(filename)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, filename, progress) => callback(filename, progress)),
  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', (event, filename, path) => callback(filename, path)),
  onDownloadFailed: (callback) => ipcRenderer.on('download-failed', (event, filename) => callback(filename))
});
