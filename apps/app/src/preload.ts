import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels: string[] = ['message-from-renderer', 'open-browser', 'open-upload', 'specification-upload', 'go-back-to-menu', 'save-project', 'get-projects'];
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
