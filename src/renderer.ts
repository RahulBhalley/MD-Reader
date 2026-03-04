import './index.css';
import { marked } from 'marked';

// TypeScript interface for the exposed API from preload
interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

console.log('Renderer starting...');

const fileList = document.getElementById('file-list') as HTMLUListElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const contentArea = document.getElementById('content-area') as HTMLDivElement;

let importedFiles: string[] = [];
let currentFile: string | null = null;

const renderFileList = () => {
  fileList.innerHTML = '';
  importedFiles.forEach((filePath) => {
    const fileName = filePath.split('/').pop() || filePath;
    const li = document.createElement('li');
    li.className = 'file-item';
    if (currentFile === filePath) li.classList.add('active');
    li.textContent = fileName;
    li.title = filePath;
    li.onclick = () => selectFile(filePath);
    fileList.appendChild(li);
  });
};

const selectFile = async (filePath: string) => {
  currentFile = filePath;
  renderFileList();
  
  const content = await window.electronAPI.readFile(filePath);
  const htmlContent = marked.parse(content);
  contentArea.innerHTML = htmlContent as string;
};

importBtn.onclick = async () => {
  console.log('Import button clicked');
  
  if (!window.electronAPI) {
    console.error('electronAPI is not found! Preload script failed to load.');
    alert('Communication error: cannot access system files.');
    return;
  }

  try {
    console.log('Calling openFileDialog...');
    const filePaths = await window.electronAPI.openFileDialog();
    console.log('Files selected:', filePaths);
    
    if (filePaths && filePaths.length > 0) {
      const newFiles = filePaths.filter(f => !importedFiles.includes(f));
      importedFiles = [...importedFiles, ...newFiles];
      renderFileList();
      if (newFiles.length > 0) {
        selectFile(newFiles[0]);
      }
    }
  } catch (err) {
    console.error('Error during file dialog:', err);
  }
};

console.log('Renderer initialized and ready');
