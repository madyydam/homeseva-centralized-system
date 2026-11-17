delete process.env.ELECTRON_RUN_AS_NODE;
const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, Menu } = electron;
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let log = null;
try {
  log = require('electron-log');
  log.transports.file.level = 'info';
} catch (_) {}

function logInfo(...args) {
  if (log) log.info(...args);
  else console.log(...args);
}

function logError(...args) {
  if (log) log.error(...args);
  else console.error(...args);
}

let serverProcess = null;
let mainWindow = null;
let isUpdating = false;

function getConfigFilePath() {
  return path.join(app.getPath('userData'), 'server_config.json');
}

function getSavedServerUrl() {
  try {
    const file = getConfigFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data && data.serverUrl) return data.serverUrl;
    }
  } catch (err) {
    logError('Failed to read server config:', err);
  }
  return process.env.HOMESEVA_APP_URL || 'http://localhost:3000';
}

function saveServerUrl(url) {
  try {
    const file = getConfigFilePath();
    fs.writeFileSync(file, JSON.stringify({ serverUrl: url }), 'utf8');
    return true;
  } catch (err) {
    logError('Failed to save server config:', err);
    return false;
  }
}

// Check if a local URL is responding
function checkUrlAlive(urlStr) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 80,
          path: '/',
          method: 'HEAD',
          timeout: 1000,
        },
        (res) => {
          resolve(true);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

// Auto-spawn web server if running on developer PC or local monorepo
function tryStartLocalServer() {
  const potentialRepoRoots = [
    path.join(__dirname, '../../..'),
    path.join(__dirname, '../..'),
    'C:\\Users\\madhu\\Documents\\HomeSeva',
  ];

  for (const root of potentialRepoRoots) {
    if (fs.existsSync(path.join(root, 'package.json')) && fs.existsSync(path.join(root, 'apps', 'web'))) {
      logInfo('Found HomeSeva workspace root at:', root);
      try {
        const isWin = process.platform === 'win32';
        const cmd = isWin ? 'pnpm.cmd' : 'pnpm';

        serverProcess = spawn(cmd, ['--filter', '@homeseva/web', 'dev'], {
          cwd: root,
          shell: true,
          env: { ...process.env, PORT: '3000' },
          stdio: 'ignore',
        });

        serverProcess.on('error', (err) => {
          logError('Failed to spawn local server:', err);
        });

        logInfo('Spawned background server process');
        return true;
      } catch (err) {
        logError('Error starting local server:', err);
      }
      break;
    }
  }
  return false;
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'HomeSeva ERP v1.6',
    backgroundColor: '#050609',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  // Completely remove native menu bar
  Menu.setApplicationMenu(null);
  if (mainWindow.removeMenu) mainWindow.removeMenu();
  if (mainWindow.setMenu) mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Start with updater splash screen
  mainWindow.loadFile(path.join(__dirname, 'updater.html'));

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logInfo(`Load failed (${errorCode}): ${errorDescription} on ${validatedURL}`);
    if (!validatedURL.startsWith('file://')) {
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Transition to main ERP application
async function bootstrapAndLoad() {
  if (isUpdating || !mainWindow) return;

  const targetUrl = getSavedServerUrl();
  const isAlive = await checkUrlAlive(targetUrl);

  if (isAlive) {
    if (mainWindow) {
      mainWindow.loadURL(targetUrl);
    }
    return;
  }

  // If localhost:3000 and not alive, attempt to start local server
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
    const started = tryStartLocalServer();
    if (started) {
      // Poll until server is ready
      let attempts = 0;
      const pollTimer = setInterval(async () => {
        attempts++;
        const aliveNow = await checkUrlAlive(targetUrl);
        if (aliveNow) {
          clearInterval(pollTimer);
          if (mainWindow && !isUpdating) {
            mainWindow.loadURL(targetUrl);
          }
        } else if (attempts >= 25) {
          clearInterval(pollTimer);
          if (mainWindow && !isUpdating) {
            mainWindow.loadFile(path.join(__dirname, 'offline.html'));
          }
        }
      }, 1000);
      return;
    }
  }

  // Fallback to offline / server config screen
  if (mainWindow && !isUpdating) {
    mainWindow.loadFile(path.join(__dirname, 'offline.html'));
  }
}

// IPC Handlers
ipcMain.handle('get-server-url', () => {
  return getSavedServerUrl();
});

ipcMain.handle('set-server-url', async (event, newUrl) => {
  let formatted = newUrl.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = `http://${formatted}`;
  }
  saveServerUrl(formatted);
  if (mainWindow) {
    mainWindow.loadURL(formatted).catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    });
  }
  return formatted;
});

ipcMain.on('retry-connection', () => {
  bootstrapAndLoad();
});

ipcMain.on('check-for-updates', () => {
  checkUpdates(true);
});

// Auto-Updater with Live Screen & Auto-Restart
let autoUpdater = null;
let updateCheckTimeout = null;

function initAutoUpdater() {
  // Safety timeout: If updater check takes > 4s, smoothly proceed to ERP
  updateCheckTimeout = setTimeout(() => {
    if (!isUpdating) {
      logInfo('Updater timeout reached; launching HomeSeva ERP...');
      if (mainWindow) {
        mainWindow.webContents.send('update-status', { status: 'starting-erp' });
      }
      setTimeout(bootstrapAndLoad, 600);
    }
  }, 4000);

  if (!app.isPackaged) {
    logInfo('Running in development mode; simulating update check screen.');
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.webContents.send('update-status', { status: 'not-available' });
      }
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.send('update-status', { status: 'starting-erp' });
        }
        setTimeout(bootstrapAndLoad, 800);
      }, 800);
    }, 1200);
    return;
  }

  try {
    const updaterPkg = require('electron-updater');
    autoUpdater = updaterPkg.autoUpdater;
    if (log) autoUpdater.logger = log;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      logInfo('Checking for updates...');
      if (mainWindow) {
        mainWindow.webContents.send('update-status', { status: 'checking' });
      }
    });

    autoUpdater.on('update-available', (info) => {
      logInfo('Update available:', info.version);
      isUpdating = true;
      if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'available',
          version: info.version,
        });
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      isUpdating = true;
      logInfo(`Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent}%`);
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'downloading',
          percent: progressObj.percent,
          transferred: `${((progressObj.transferred || 0) / 1024 / 1024).toFixed(1)} MB`,
          total: `${((progressObj.total || 0) / 1024 / 1024).toFixed(1)} MB`,
        });
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      isUpdating = true;
      logInfo('Update downloaded successfully:', info.version);
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'downloaded',
          version: info.version,
        });
      }

      // Automatically install and restart the ERP application!
      setTimeout(() => {
        logInfo('Calling autoUpdater.quitAndInstall to reopen application...');
        autoUpdater.quitAndInstall(false, true);
      }, 1500);
    });

    autoUpdater.on('update-not-available', () => {
      logInfo('App is up to date.');
      if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
      if (mainWindow) {
        mainWindow.webContents.send('update-status', { status: 'not-available' });
      }
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.send('update-status', { status: 'starting-erp' });
        }
        setTimeout(bootstrapAndLoad, 700);
      }, 700);
    });

    autoUpdater.on('error', (err) => {
      logError('Auto-updater error:', err);
      if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
      if (!isUpdating) {
        setTimeout(bootstrapAndLoad, 800);
      }
    });

    // Launch update check
    autoUpdater.checkForUpdates().catch((err) => {
      logError('checkForUpdates error:', err);
      if (!isUpdating) {
        setTimeout(bootstrapAndLoad, 800);
      }
    });
  } catch (err) {
    logError('Auto-updater init error:', err);
    if (!isUpdating) {
      setTimeout(bootstrapAndLoad, 800);
    }
  }
}

function checkUpdates(userInitiated = false) {
  if (!autoUpdater || !app.isPackaged) {
    if (userInitiated && mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'HomeSeva ERP',
        message: 'HomeSeva ERP v1.6 is up to date.',
      });
    }
    return;
  }
  autoUpdater.checkForUpdates().catch((err) => {
    logError('Update check failed:', err);
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  initAutoUpdater();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (_) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
