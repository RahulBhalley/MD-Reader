import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// electron-squirrel-startup is Windows-only; guard to avoid module-not-found on macOS/Linux.
if (process.platform === 'win32' && require('electron-squirrel-startup')) {
  app.quit();
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Track whether the user manually triggered the check (vs. silent startup check)
let manualUpdateCheck = false;

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  // autoDownload is true, so the download starts automatically.
  // We don't need to notify here — the 'update-downloaded' event handles it.
});

autoUpdater.on('update-not-available', () => {
  console.log('Update not available.');
  // Only show a dialog if the user explicitly clicked "Check for Updates"
  if (manualUpdateCheck) {
    manualUpdateCheck = false;
    dialog.showMessageBox({
      type: 'info',
      title: 'No Updates Available',
      message: 'You are already on the latest version.',
      buttons: ['OK'],
    });
  }
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
  if (manualUpdateCheck) {
    manualUpdateCheck = false;
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Error',
      message: 'Failed to check for updates.',
      detail: err.message,
      buttons: ['OK'],
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const msg = `Downloading update: ${Math.round(progressObj.percent)}% ` +
    `(${progressObj.transferred} / ${progressObj.total} bytes)`;
  console.log(msg);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded.`,
    detail: 'Restart the application to apply the update.',
    buttons: ['Restart Now', 'Later'],
  }).then((result) => {
    if (result.response === 0) autoUpdater.quitAndInstall();
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
              manualUpdateCheck = true;
              autoUpdater.checkForUpdates();
            } else {
              dialog.showMessageBox({
                title: 'Development Mode',
                message: 'Update check is only available in production builds.',
                type: 'info',
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

ipcMain.handle('chat:model', async (event, contextText: string, message: string, history: any[]) => {
  try {
    const systemPrompt = `You are a helpful AI assistant. You are answering questions about the following markdown document:\n\n${contextText}`;
    // Prepare conversation messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    const payload = {
      model: "granite4:latest", // Configurable default for Granite
      messages: messages,
      stream: false
    };

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error: any) {
    console.error('SYSTEM ERROR in chat:model:', error);
    return `Error: Could not communicate with Ollama. Make sure it is running on http://127.0.0.1:11434. (Details: ${error.message})`;
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
