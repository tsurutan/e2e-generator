import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
}

// Define the WebView API interface for communication from webview to parent
interface WebViewAPI {
  sendToParent: (channel: string, data: any) => void;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels: string[] = ['message-from-renderer', 'open-browser', 'open-upload', 'specification-upload', 'go-back-to-menu', 'save-project', 'get-projects', 'save-features', 'get-features', 'get-scenarios', 'save-label', 'get-labels-by-url', 'run-scenario', 'generate-code'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: (...args: any[]) => void) => {
      const validChannels: string[] = ['message-from-main'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  } as ElectronAPI
);

// Expose API for webview to communicate with parent window
contextBridge.exposeInMainWorld(
  'electronAPI', {
    sendToParent: (channel: string, data: any) => {
      // whitelist channels
      const validChannels: string[] = ['element-click'];
      if (validChannels.includes(channel)) {
        // Use ipcRenderer to send a message to the main process
        // which will then forward it to the parent window
        ipcRenderer.sendToHost(channel, data);
      }
    }
  } as WebViewAPI
);
