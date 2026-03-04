import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  chatWithModel: (context: string, message: string, history: any[]) => ipcRenderer.invoke('chat:model', context, message, history),
  onChatChunk: (callback: (chunk: string) => void) => {
    ipcRenderer.on('chat:model-chunk', (_event, chunk) => callback(chunk));
  },
  removeChatChunkListeners: () => {
    ipcRenderer.removeAllListeners('chat:model-chunk');
  }
});
