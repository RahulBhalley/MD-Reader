import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const createWindow = (): void => {
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
};

// IPC Handlers
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
