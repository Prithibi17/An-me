const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowStateChange: (callback) => {
    const subscription = (_event, state) => callback(state);
    ipcRenderer.on('window-state-change', subscription);
    return () => ipcRenderer.removeListener('window-state-change', subscription);
  },

  // Desktop integration
  openExternal: (url) => ipcRenderer.send('open-external', url),
  showNotification: (title, body, icon) => ipcRenderer.send('show-notification', { title, body, icon }),

  // Exclusive local database & store microservice
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
    all: () => ipcRenderer.invoke('store-all'),
  },

  // Password crypto bridge for Turso web database
  auth: {
    hashPassword: (password) => ipcRenderer.invoke('auth-hash-password', password),
    verifyPassword: (password, storedHash) => ipcRenderer.invoke('auth-verify-password', password, storedHash),
  },
  
  // Video stream error failover listener
  onStreamError: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('stream-server-error', subscription);
    return () => ipcRenderer.removeListener('stream-server-error', subscription);
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isDesktop: true,

  // Updater Microservice Bridge
  updater: {
    downloadAndInstall: (downloadUrl, fileName) => ipcRenderer.invoke('updater-download-and-install', { downloadUrl, fileName }),
    onProgress: (callback) => {
      const sub = (_event, data) => callback(data);
      ipcRenderer.on('updater-progress', sub);
      return () => ipcRenderer.removeListener('updater-progress', sub);
    },
  },

  // Installer & Uninstaller Wizard Microservice Bridge
  installer: {
    selectDirectory: (defaultPath) => ipcRenderer.invoke('installer-select-directory', defaultPath),
    getDiskSpace: (targetPath) => ipcRenderer.invoke('installer-get-disk-space', targetPath),
    getDefaultInstallPath: () => ipcRenderer.invoke('installer-get-default-path'),
    getInstallInfo: () => ipcRenderer.invoke('installer-get-info'),
    performInstall: (options) => ipcRenderer.invoke('installer-perform-install', options),
    performUninstall: (options) => ipcRenderer.invoke('installer-perform-uninstall', options),
    onProgress: (callback) => {
      const sub = (_event, data) => callback(data);
      ipcRenderer.on('installer-progress', sub);
      return () => ipcRenderer.removeListener('installer-progress', sub);
    },
    launchApp: (installPath) => ipcRenderer.invoke('installer-launch-app', installPath),
    close: () => ipcRenderer.send('window-close'),
  },
});
