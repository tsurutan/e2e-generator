import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// Keep a global reference of the window objects to prevent them from being garbage collected
let mainWindow: BrowserWindow | null = null;
let browserWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security reasons
      contextIsolation: true, // Protect against prototype pollution
      preload: path.join(__dirname, 'src/preload.js'), // Use a preload script
      webviewTag: true // Enable the webview tag
    }
  });

  // Load the menu.html file
  mainWindow.loadFile('menu.html');

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate the window when the dock icon is clicked and no other windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle IPC messages from renderer process if needed
ipcMain.on('message-from-renderer', (event, message: string) => {
  console.log('Message from renderer:', message);
});

// Function to create browser window
function createBrowserWindow(): void {
  // Create the browser window if it doesn't exist
  if (browserWindow === null) {
    browserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'src/preload.js'),
        webviewTag: true
      }
    });

    // Load the index.html file (browser interface)
    browserWindow.loadFile('index.html');

    // Handle window close event
    browserWindow.on('closed', () => {
      browserWindow = null;
    });
  } else {
    // If window exists, focus it
    browserWindow.focus();
  }
}

// Handle open-browser request from menu
ipcMain.on('open-browser', () => {
  createBrowserWindow();
});
