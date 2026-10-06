const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
  onMouseMove: (callback) => ipcRenderer.on('mouse-move', (_event, x, y) => callback(x, y)),
  onAtomToggle: (callback) => ipcRenderer.on('toggle-atom', (_event, active, element) => callback(active, element))
});
