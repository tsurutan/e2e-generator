import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import axios from 'axios';

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security reasons
      contextIsolation: true, // Protect against prototype pollution
      preload: path.join(__dirname, 'preload.js'), // Use a preload script
      webviewTag: true // Enable the webview tag
    }
  });

  // Load the React app
  mainWindow.loadFile('dist/renderer/index.html');

  // Open DevTools in development
  mainWindow.webContents.openDevTools();

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

// Handle IPC messages for React app

// Handle open-browser request
ipcMain.on('open-browser', () => {
  console.log('Browser operation requested');
  // In React app, this is handled in the renderer process
});

// Handle open-upload request
ipcMain.on('open-upload', () => {
  console.log('Upload operation requested');
  // In React app, this is handled in the renderer process
});

// Handle specification upload
ipcMain.on('specification-upload', (event, data) => {
  console.log('Specification upload received:', data);
  // In a real application, you would process the uploaded specification here
});

// Handle go back to menu
ipcMain.on('go-back-to-menu', () => {
  console.log('Go back to menu requested');
  // In React app, this is handled in the renderer process
});

// Handle project save
ipcMain.on('save-project', async (event, data) => {
  console.log('Project saved:', data);

  try {
    // APIサーバーのURL
    const apiUrl = 'http://localhost:3000/api/projects';

    // APIにプロジェクトデータを送信
    const response = await axios.post(apiUrl, data);
    console.log('Project saved to API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'project-save-success',
        data: response.data
      });
    }
  } catch (error: any) {
    console.error('Failed to save project to API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'project-save-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});

// Handle get projects
ipcMain.on('get-projects', async (event) => {
  console.log('Get projects requested');

  try {
    // APIサーバーのURL
    const apiUrl = 'http://localhost:3000/api/projects';

    // APIからプロジェクト一覧を取得
    const response = await axios.get(apiUrl);
    console.log('Projects loaded from API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'projects-loaded',
        data: response.data
      });
    }
  } catch (error: any) {
    console.error('Failed to load projects from API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'projects-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});
