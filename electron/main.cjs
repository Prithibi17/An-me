const { app, BrowserWindow, ipcMain, shell, Notification, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

// Explicitly register Windows Application User Model ID so Taskbar groups and displays the An:me rounded icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.anme.desktop');
}

Menu.setApplicationMenu(null);

let mainWindow = null;

function getAppIcon() {
  const icoPath = path.join(__dirname, '..', 'public', 'anme-icon.ico');
  const pngPath = path.join(__dirname, '..', 'public', 'anme-icon.png');
  if (process.platform === 'win32' && fs.existsSync(icoPath)) {
    return icoPath;
  }
  return pngPath;
}

const isUninstallMode =
  process.argv.includes('--uninstall') ||
  process.argv.includes('-uninstall') ||
  process.env.APP_MODE === 'uninstall' ||
  path.basename(process.execPath).toLowerCase().includes('uninstall');

const isInstallerMode =
  !isUninstallMode && (
    process.argv.includes('--setup') ||
    process.argv.includes('--installer') ||
    process.env.APP_MODE === 'installer' ||
    path.basename(process.execPath).toLowerCase().includes('setup')
  );

const isWizardMode = isInstallerMode || isUninstallMode;

function createWindow() {
  console.log('[MAIN] Creating BrowserWindow... Installer:', isInstallerMode, 'Uninstall:', isUninstallMode);
  const appIcon = getAppIcon();
  const windowTitle = isUninstallMode ? 'An:me Uninstall' : isInstallerMode ? 'An:me Setup' : 'An:me Desktop';
  
  mainWindow = new BrowserWindow({
    width: isWizardMode ? 760 : 1320,
    height: isWizardMode ? 520 : 840,
    minWidth: isWizardMode ? 740 : 1000,
    minHeight: isWizardMode ? 500 : 680,
    resizable: !isWizardMode,
    frame: false,
    title: windowTitle,
    icon: appIcon,
    backgroundColor: '#000008',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      partition: isWizardMode ? 'persist:anme_wizard' : 'persist:anme_main',
    },
  });

  if (mainWindow && appIcon) {
    mainWindow.setIcon(appIcon);
  }

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[MAIN] Failed to load: ${errorCode} - ${errorDescription} at ${validatedURL}`);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[RENDERER CONSOLE]: ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-change', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-change', { isMaximized: false });
  });

  // Block all popups, ad windows, and new tabs completely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('[MAIN] Denied popup window request:', url);
    return { action: 'deny' };
  });

  // Prevent embedded iframes from hijacking or navigating the main application window
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!navigationUrl.startsWith('file:') && !navigationUrl.includes('localhost')) {
      event.preventDefault();
      console.log('[MAIN] Prevented top-level navigation to:', navigationUrl);
    }
  });

  // Intercept stream errors (410 Gone, 404 Not Found, 502, 503, network drop) from video providers
  mainWindow.webContents.session.webRequest.onCompleted((details) => {
    if (details.resourceType === 'subFrame' || details.url.includes('/stream/') || details.url.includes('/embed/')) {
      if (details.statusCode === 410 || details.statusCode === 404 || details.statusCode === 502 || details.statusCode === 503) {
        console.log(`[STREAM MONITOR] Video stream error ${details.statusCode} on ${details.url}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('stream-server-error', {
            statusCode: details.statusCode,
            url: details.url,
            reason: `Server error ${details.statusCode}`,
          });
        }
      }
    }
  });

  mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    if (details.resourceType === 'subFrame' || details.url.includes('/stream/') || details.url.includes('/embed/')) {
      console.log(`[STREAM MONITOR] Video stream failed: ${details.error} on ${details.url}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('stream-server-error', {
          error: details.error,
          url: details.url,
          reason: details.error,
        });
      }
    }
  });

  mainWindow.webContents.on('did-finish-load', async () => {
    console.log('[MAIN] Page loaded successfully!');
    try {
      const title = await mainWindow.webContents.getTitle();
      const html = await mainWindow.webContents.executeJavaScript('document.getElementById("root")?.innerHTML');
      console.log('[MAIN] Window title:', title, 'Root innerHTML length:', html ? html.length : 'null');
    } catch (e) {
      console.error('[MAIN] Error evaluating JS:', e);
    }
  });

  const distPath = path.join(__dirname, '..', 'dist', 'index.html');
  console.log('[MAIN] Loading path:', distPath, 'Exists:', fs.existsSync(distPath));

  const queryParam = isUninstallMode ? '?mode=uninstall' : isInstallerMode ? '?mode=installer' : '';
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}${queryParam}`);
  } else if (fs.existsSync(distPath)) {
    if (isUninstallMode) {
      mainWindow.loadFile(distPath, { query: { mode: 'uninstall' } });
    } else if (isInstallerMode) {
      mainWindow.loadFile(distPath, { query: { mode: 'installer' } });
    } else {
      mainWindow.loadFile(distPath);
    }
  } else {
    mainWindow.loadURL(`http://localhost:5173${queryParam}`);
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(false);
    }
  }, 1000);
}

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.on('open-external', (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

const crypto = require('crypto');
const util = require('util');
const scryptAsync = util.promisify(crypto.scrypt);

// Exclusive Local Database & Persistent Store Microservice
let storeFilePath = null;
let inMemoryStore = {};

function initLocalStore() {
  try {
    storeFilePath = path.join(app.getPath('userData'), 'anme_local_store.json');
    console.log('[STORE] Local database path:', storeFilePath);
    if (fs.existsSync(storeFilePath)) {
      const raw = fs.readFileSync(storeFilePath, 'utf-8');
      inMemoryStore = JSON.parse(raw) || {};
      console.log('[STORE] Loaded persistent keys:', Object.keys(inMemoryStore));
    } else {
      inMemoryStore = {};
      fs.writeFileSync(storeFilePath, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[STORE] Failed initializing local store:', err);
    inMemoryStore = {};
  }
}

function persistStoreToDisk() {
  try {
    if (storeFilePath) {
      fs.writeFileSync(storeFilePath, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[STORE] Failed saving to disk:', err);
  }
}

ipcMain.handle('store-get', (_event, key) => {
  return inMemoryStore[key] !== undefined ? inMemoryStore[key] : null;
});

ipcMain.handle('store-set', (_event, key, value) => {
  inMemoryStore[key] = value;
  persistStoreToDisk();
  return true;
});

ipcMain.handle('store-delete', (_event, key) => {
  delete inMemoryStore[key];
  persistStoreToDisk();
  return true;
});

ipcMain.handle('store-all', () => {
  return inMemoryStore;
});

ipcMain.on('show-notification', (_event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'An:me Desktop',
      body: body || '',
      icon: icon || getAppIcon(),
    }).show();
  }
});

// Native Scrypt Password Hashing & Verification (Exact Web App Database Match)
ipcMain.handle('auth-hash-password', async (_event, password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
});

ipcMain.handle('auth-verify-password', async (_event, password, storedHash) => {
  try {
    const [salt, key] = (storedHash || '').split(':');
    if (!salt || !key) return false;
    const derived = await scryptAsync(password, salt, 64);
    const expected = Buffer.from(key, 'hex');
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch (err) {
    console.error('[MAIN] Password verification error:', err);
    return false;
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ================= INSTALLER & UNINSTALLER WIZARD IPC HANDLERS =================
ipcMain.handle('installer-get-default-path', () => {
  if (process.platform === 'win32') {
    try {
      if (fs.existsSync('D:\\')) {
        return 'D:\\Apps\\Anime';
      }
    } catch {}
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Local');
    return path.join(localAppData, 'Programs', 'An-me');
  }
  return path.join(app.getPath('home'), 'Applications', 'An-me');
});

ipcMain.handle('installer-get-info', () => {
  const currentDir = path.dirname(process.execPath);
  let installPath = currentDir;
  try {
    const regOut = execSync('powershell -NoProfile -Command "(Get-ItemProperty -Path HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\An-me -Name InstallLocation -ErrorAction SilentlyContinue).InstallLocation"', { encoding: 'utf8' }).trim();
    if (regOut && fs.existsSync(regOut)) {
      installPath = regOut;
    }
  } catch {}
  return { installPath };
});

ipcMain.handle('installer-select-directory', async (_event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select An:me Installation Folder',
    defaultPath: defaultPath || 'D:\\Apps\\Anime',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('installer-get-disk-space', async (_event, targetPath) => {
  try {
    const rootDrive = path.parse(targetPath || 'C:\\').root;
    return new Promise((resolve) => {
      fs.statfs(rootDrive, (err, stats) => {
        if (err || !stats) {
          resolve({ availableGB: 182.4, requiredMB: 255 });
        } else {
          const freeGB = (stats.bavail * stats.bsize) / (1024 ** 3);
          resolve({ availableGB: parseFloat(freeGB.toFixed(1)), requiredMB: 255 });
        }
      });
    });
  } catch {
    return { availableGB: 182.4, requiredMB: 255 };
  }
});

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

ipcMain.handle('installer-perform-install', async (event, options) => {
  const { installPath, createDesktopShortcut, createStartMenuShortcut } = options;
  console.log('[INSTALLER] Installing An:me to:', installPath);
  fs.mkdirSync(installPath, { recursive: true });

  const totalMB = options.totalMB || 253;
  for (let p = 5; p <= 45; p += 5) {
    await new Promise((r) => setTimeout(r, 40));
    const copiedMB = Math.round((p / 100) * totalMB);
    event.sender.send('installer-progress', { percent: p, copiedMB, totalMB });
  }

  // Check if we are running from a packaged executable directory
  const isPackaged = !process.defaultApp && (app.isPackaged || path.basename(process.execPath).toLowerCase().includes('setup'));
  const execDir = path.dirname(process.execPath);

  if (isPackaged && fs.existsSync(path.join(execDir, 'resources'))) {
    // Copy all runtime binaries, DLLs, and resources from installer bundle
    const items = fs.readdirSync(execDir);
    for (const item of items) {
      const src = path.join(execDir, item);
      const dest = path.join(installPath, item === 'An-me Setup.exe' ? 'An-me.exe' : item);
      try {
        copyRecursiveSync(src, dest);
      } catch (err) {
        console.warn('[INSTALLER] Copy item error:', item, err.message);
      }
    }
  } else {
    // Development / Source copy (Only required runtime folders, NO node_modules)
    const appRoot = path.join(__dirname, '..');
    const itemsToCopy = ['dist', 'electron', 'public', 'package.json', 'launch.bat'];
    for (const item of itemsToCopy) {
      const src = path.join(appRoot, item);
      const dest = path.join(installPath, item);
      if (fs.existsSync(src)) {
        try {
          copyRecursiveSync(src, dest);
        } catch (err) {
          console.warn('[INSTALLER] Notice copying', item, err.message);
        }
      }
    }
  }

  // Create an explicit uninstall.bat inside the installation directory
  try {
    const uninstallBatContent = `@echo off\r\nstart "" "%~dp0An-me.exe" --uninstall\r\n`;
    fs.writeFileSync(path.join(installPath, 'uninstall.bat'), uninstallBatContent, 'utf8');
  } catch (err) {
    console.warn('[INSTALLER] Could not create uninstall.bat:', err.message);
  }

  for (let p = 50; p <= 100; p += 5) {
    await new Promise((r) => setTimeout(r, 30));
    const copiedMB = Math.min(totalMB, Math.round((p / 100) * totalMB));
    event.sender.send('installer-progress', { percent: p, copiedMB, totalMB });
  }

  // Windows Integration: Shortcuts & Registry Uninstallation
  if (process.platform === 'win32') {
    let icoPath = path.join(installPath, 'public', 'anme-icon.ico');
    if (!fs.existsSync(icoPath)) {
      icoPath = path.join(installPath, 'resources', 'app', 'public', 'anme-icon.ico');
    }
    const exePath = path.join(installPath, 'An-me.exe');
    const targetScript = fs.existsSync(exePath) ? exePath : path.join(installPath, 'launch.bat');

    // 1. Windows Settings "Installed apps" Registry Registration
    try {
      const regPs = `
        $reg = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\An-me";
        New-Item -Path $reg -Force | Out-Null;
        Set-ItemProperty -Path $reg -Name "DisplayName" -Value "An:me Desktop";
        Set-ItemProperty -Path $reg -Name "DisplayIcon" -Value "${targetScript.replace(/\\/g, '\\\\')},0";
        Set-ItemProperty -Path $reg -Name "DisplayVersion" -Value "1.0.0";
        Set-ItemProperty -Path $reg -Name "Publisher" -Value "An:me Inc.";
        Set-ItemProperty -Path $reg -Name "InstallLocation" -Value "${installPath.replace(/\\/g, '\\\\')}";
        Set-ItemProperty -Path $reg -Name "UninstallString" -Value "\`"${targetScript.replace(/\\/g, '\\\\')}\`" --uninstall";
        Set-ItemProperty -Path $reg -Name "EstimatedSize" -Value 255000;
      `;
      execSync(`powershell -NoProfile -Command "${regPs.replace(/\n/g, ' ')}"`);
      console.log('[INSTALLER] Registered An:me in Windows Installed Apps');
    } catch (err) {
      console.warn('[INSTALLER] Error registering uninstaller in Windows Registry:', err.message);
    }

    // 2. Desktop Shortcut
    if (createDesktopShortcut) {
      try {
        const desktopPs = `
          $wsh = New-Object -ComObject WScript.Shell;
          $desktop = [System.Environment]::GetFolderPath('Desktop');
          $sc = $wsh.CreateShortcut("$desktop\\An-me Desktop.lnk");
          $sc.TargetPath = "${targetScript.replace(/\\/g, '\\\\')}";
          $sc.IconLocation = "${(fs.existsSync(icoPath) ? icoPath : targetScript).replace(/\\/g, '\\\\')},0";
          $sc.WorkingDirectory = "${installPath.replace(/\\/g, '\\\\')}";
          $sc.Description = "An:me Desktop Client";
          $sc.Save();
        `;
        execSync(`powershell -NoProfile -Command "${desktopPs.replace(/\n/g, ' ')}"`);
        console.log('[INSTALLER] Created Desktop Shortcut');
      } catch (err) {
        console.error('[INSTALLER] Error creating Desktop Shortcut:', err);
      }
    }

    // 3. Start Menu Folder & Shortcuts
    if (createStartMenuShortcut) {
      try {
        const startMenuPs = `
          $wsh = New-Object -ComObject WScript.Shell;
          $startFolder = [System.Environment]::GetFolderPath('StartMenu') + '\\Programs\\An-me';
          if (!(Test-Path $startFolder)) { New-Item -ItemType Directory -Path $startFolder -Force | Out-Null };
          
          # App Shortcut
          $sc = $wsh.CreateShortcut("$startFolder\\An-me Desktop.lnk");
          $sc.TargetPath = "${targetScript.replace(/\\/g, '\\\\')}";
          $sc.IconLocation = "${(fs.existsSync(icoPath) ? icoPath : targetScript).replace(/\\/g, '\\\\')},0";
          $sc.WorkingDirectory = "${installPath.replace(/\\/g, '\\\\')}";
          $sc.Description = "An:me Desktop Client";
          $sc.Save();

          # Uninstall Shortcut
          $unSc = $wsh.CreateShortcut("$startFolder\\Uninstall An-me.lnk");
          $unSc.TargetPath = "${targetScript.replace(/\\/g, '\\\\')}";
          $unSc.Arguments = "--uninstall";
          $unSc.IconLocation = "shell32.dll,31";
          $unSc.WorkingDirectory = "${installPath.replace(/\\/g, '\\\\')}";
          $unSc.Description = "Uninstall An:me Desktop Client";
          $unSc.Save();
        `;
        execSync(`powershell -NoProfile -Command "${startMenuPs.replace(/\n/g, ' ')}"`);
        console.log('[INSTALLER] Created Start Menu Folder and Shortcuts');
      } catch (err) {
        console.error('[INSTALLER] Error creating Start Menu Shortcut:', err);
      }
    }
  }

  return { success: true };
});

// ================= REAL UNINSTALLER IPC HANDLER =================
ipcMain.handle('installer-perform-uninstall', async (_event, options) => {
  const { installPath, removeAppData } = options;
  console.log('[UNINSTALLER] Performing full uninstallation from:', installPath);

  if (process.platform === 'win32') {
    // 1. Remove Desktop Shortcuts
    try {
      const removeDesktopPs = `
        $desktop = [System.Environment]::GetFolderPath('Desktop');
        Remove-Item "$desktop\\An:me Desktop.lnk" -ErrorAction SilentlyContinue;
        Remove-Item "$desktop\\An-me.lnk" -ErrorAction SilentlyContinue;
        Remove-Item "$desktop\\An-me Desktop.lnk" -ErrorAction SilentlyContinue;
      `;
      execSync(`powershell -NoProfile -Command "${removeDesktopPs.replace(/\n/g, ' ')}"`);
      console.log('[UNINSTALLER] Removed Desktop Shortcuts');
    } catch (err) {
      console.warn('[UNINSTALLER] Error removing Desktop shortcut:', err.message);
    }

    // 2. Remove Start Menu Folder
    try {
      const removeStartPs = `
        $startFolder = [System.Environment]::GetFolderPath('StartMenu') + '\\Programs\\An-me';
        Remove-Item -LiteralPath "$startFolder" -Recurse -Force -ErrorAction SilentlyContinue;
        $legacyLnk = [System.Environment]::GetFolderPath('StartMenu') + '\\Programs\\An-me.lnk';
        Remove-Item -LiteralPath "$legacyLnk" -Force -ErrorAction SilentlyContinue;
      `;
      execSync(`powershell -NoProfile -Command "${removeStartPs.replace(/\n/g, ' ')}"`);
      console.log('[UNINSTALLER] Removed Start Menu Folder and shortcuts');
    } catch (err) {
      console.warn('[UNINSTALLER] Error removing Start Menu folder:', err.message);
    }

    // 3. Remove Windows Registry Uninstall Entry
    try {
      const removeRegPs = `
        Remove-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\An-me" -Recurse -Force -ErrorAction SilentlyContinue;
      `;
      execSync(`powershell -NoProfile -Command "${removeRegPs.replace(/\n/g, ' ')}"`);
      console.log('[UNINSTALLER] Removed Windows Registry Uninstall Key');
    } catch (err) {
      console.warn('[UNINSTALLER] Error removing Registry entry:', err.message);
    }

    // 4. Optionally remove local AppData database & cache
    if (removeAppData) {
      try {
        const appDataDir = path.join(app.getPath('appData'), 'an-me-desktop');
        if (fs.existsSync(appDataDir)) {
          fs.rmSync(appDataDir, { recursive: true, force: true });
          console.log('[UNINSTALLER] Cleaned local AppData');
        }
      } catch (err) {
        console.warn('[UNINSTALLER] Error cleaning AppData:', err.message);
      }
    }

    // 5. Schedule self-deletion of installation directory after this process exits
    if (installPath && fs.existsSync(installPath)) {
      const cleanScript = `Start-Sleep -Seconds 2; Remove-Item -LiteralPath '${installPath}' -Recurse -Force -ErrorAction SilentlyContinue`;
      spawn('powershell.exe', ['-WindowStyle', 'Hidden', '-NoProfile', '-Command', cleanScript], {
        detached: true,
        stdio: 'ignore',
      }).unref();
      console.log('[UNINSTALLER] Scheduled background deletion of:', installPath);
    }
  }

  return { success: true };
});

ipcMain.handle('installer-launch-app', (_event, installPath) => {
  try {
    const targetFolder = installPath || path.join(__dirname, '..');
    const exePath = path.join(targetFolder, 'An-me.exe');
    const launchBat = path.join(targetFolder, 'launch.bat');

    if (fs.existsSync(exePath)) {
      spawn(exePath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: targetFolder,
      }).unref();
    } else if (fs.existsSync(launchBat)) {
      spawn('cmd.exe', ['/c', launchBat], {
        detached: true,
        stdio: 'ignore',
        cwd: targetFolder,
      }).unref();
    }
  } catch (err) {
    console.error('[INSTALLER] Failed to spawn app:', err);
  }
  app.quit();
});

app.whenReady().then(() => {
  initLocalStore();
  createWindow();

  app.on('web-contents-created', (_event, contents) => {
    // Intercept and deny window open on all frames/iframes
    contents.setWindowOpenHandler(({ url }) => {
      console.log('[MAIN] Blocked subframe popup window for:', url);
      return { action: 'deny' };
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
