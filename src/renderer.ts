import './index.css';
import { marked } from 'marked';
import dragDrop from 'drag-drop';

// TypeScript interface for the exposed API from preload
interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  getPathForFile: (file: File) => string;
  getAppVersion: () => Promise<string>;
  chatWithModel: (context: string, message: string, history: any[]) => Promise<string>;
  onChatChunk: (callback: (chunk: string) => void) => void;
  removeChatChunkListeners: () => void;
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
const versionInfo = document.getElementById('version-info') as HTMLSpanElement;

const scrollableContent = document.getElementById('scrollable-content') as HTMLDivElement;
const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const chatSendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;

let importedFiles: string[] = [];
let currentFile: string | null = null;
let chatHistory: any[] = [];
let rawMarkdownContent: string = '';

const init = async () => {
  const version = await window.electronAPI.getAppVersion();
  if (versionInfo) {
    versionInfo.textContent = `v${version}`;
  }
};

init();

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
  rawMarkdownContent = content; // Save for chat context
  const htmlContent = marked.parse(content);
  contentArea.innerHTML = htmlContent as string;

  // Reset chat
  chatHistory = [];
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
};

const handleNewFiles = (filePaths: string[]) => {
  if (filePaths && filePaths.length > 0) {
    const newFiles = filePaths.filter(f => !importedFiles.includes(f));
    importedFiles = [...importedFiles, ...newFiles];
    renderFileList();
    if (newFiles.length > 0) {
      selectFile(newFiles[0]);
    }
  }
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
    handleNewFiles(filePaths);
  } catch (err) {
    console.error('Error during file dialog:', err);
  }
};

// Drag and drop support using drag-drop library
dragDrop('body', (files: File[]) => {
  const filePaths: string[] = [];
  files.forEach((file: File) => {
    if (file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown')) {
      const path = window.electronAPI.getPathForFile(file);
      if (path) {
        filePaths.push(path);
      }
    }
  });
  handleNewFiles(filePaths);
});

const createMessageDiv = (sender: 'me' | 'ai') => {
  if (!chatMessages) return null;
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;
  chatMessages.appendChild(msgDiv);
  if (scrollableContent) {
    scrollableContent.scrollTo({ top: scrollableContent.scrollHeight, behavior: 'smooth' });
  }
  return msgDiv;
};

const appendMessage = (text: string, sender: 'me' | 'ai') => {
  const msgDiv = createMessageDiv(sender);
  if (!msgDiv) return;
  if (sender === 'ai') {
    msgDiv.innerHTML = marked.parse(text) as string;
  } else {
    msgDiv.textContent = text;
  }
};

let currentAiMessageDiv: HTMLDivElement | null = null;
let currentAiResponse: string = '';

const handleChatSend = async () => {
  if (!chatInput || !chatSendBtn) return;
  const message = chatInput.value.trim();
  if (!message || !rawMarkdownContent) return;

  chatInput.value = '';
  chatSendBtn.disabled = true;
  appendMessage(message, 'me');

  currentAiMessageDiv = createMessageDiv('ai');
  currentAiResponse = '';

  window.electronAPI.removeChatChunkListeners();
  window.electronAPI.onChatChunk((chunk: string) => {
    if (!currentAiMessageDiv) return;
    currentAiResponse += chunk;
    currentAiMessageDiv.innerHTML = marked.parse(currentAiResponse) as string;
    if (scrollableContent) {
      scrollableContent.scrollTo({ top: scrollableContent.scrollHeight, behavior: 'instant' });
    }
  });

  try {
    const response = await window.electronAPI.chatWithModel(rawMarkdownContent, message, chatHistory);
    if (currentAiMessageDiv) {
      currentAiMessageDiv.innerHTML = marked.parse(response) as string;
    }
    
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: response });
  } catch (error) {
    console.error("Chat error:", error);
    if (!currentAiResponse && currentAiMessageDiv) {
        currentAiMessageDiv.textContent = "Sorry, I encountered an error communicating with the model.";
    }
  } finally {
    chatSendBtn.disabled = false;
    currentAiMessageDiv = null;
    chatInput.focus();
  }
};

if (chatSendBtn) {
  chatSendBtn.addEventListener('click', handleChatSend);
}
if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleChatSend();
    }
  });
}

console.log('Renderer initialized and ready');
