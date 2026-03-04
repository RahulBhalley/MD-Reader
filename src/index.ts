import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Configure autoUpdater
autoUpdater.autoDownload = true;

// Custom logging for autoUpdater
const sendStatusToWindow = (text: string) => {
  console.log(text);
};

autoUpdater.on('checking-for-update', () => sendStatusToWindow('Checking for update...'));
autoUpdater.on('update-available', (info) => sendStatusToWindow('Update available.'));
autoUpdater.on('update-not-available', (info) => sendStatusToWindow('Update not available.'));
autoUpdater.on('error', (err) => sendStatusToWindow('Error in auto-updater: ' + err));
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart the application to apply the updates.',
    buttons: ['Restart', 'Later']
  }).then((buttonIndex) => {
    if (buttonIndex.response === 0) autoUpdater.quitAndInstall();
  });
});

const createMenu = () => {
  const template: any[] = [
    {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          click: () => {
            dialog.showMessageBox({
              title: `About ${app.name}`,
              message: `${app.name}`,
              detail: `Version: ${app.getVersion()}\n\nA simple and elegant Markdown reader.`,
              buttons: ['OK'],
              type: 'info'
            });
          }
        },
        {
          label: 'Check for Updates...',
          click: () => {
            if (app.isPackaged) {
              autoUpdater.checkForUpdatesAndNotify().then(result => {
                if (result && result.updateInfo.version === app.getVersion()) {
                  dialog.showMessageBox({
                    title: 'No Updates',
                    message: 'You are on the latest version.',
                    type: 'info'
                  });
                }
              });
            } else {
              dialog.showMessageBox({
                title: 'Development Mode',
                message: 'Update check is only available in production builds.',
                type: 'info'
              });
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
    },
    {
      label: 'File',
      submenu: [
        { role: 'close' }
      ]
    },
    {
      role: 'editMenu'
    },
    {
      role: 'viewMenu'
    },
    {
      role: 'windowMenu'
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = (): void => {
  createMenu();
  // During development, Forge puts the built preload script in .vite/build/preload.js
  // In production, it might be in different locations depending on ASAR
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Main process __dirname:', __dirname);
  console.log('Looking for preload at:', preloadPath);
  console.log('Preload exists?', fs.existsSync(preloadPath));

  const mainWindow = new BrowserWindow({
    height: 700,
    width: 1000,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Ensure the preload bridge can work
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Check for updates when the window is ready
  mainWindow.once('ready-to-show', () => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });
};

// IPC Handlers
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('app:checkForUpdates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

ipcMain.handle('dialog:openFile', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
    });
    
    if (result.canceled) {
      return [];
    } else {
      return result.filePaths;
    }
  } catch (err) {
    console.error('SYSTEM ERROR in dialog:openFile:', err);
    return [];
  }
});

ipcMain.handle('file:read', async (event, filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return 'Error: File not found.';
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('SYSTEM ERROR reading file:', error);
    return `Error reading file: ${error}`;
  }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
