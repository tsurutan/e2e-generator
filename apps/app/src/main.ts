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
ipcMain.on('specification-upload', async (event, data) => {
  console.log('Specification upload received:', data);

  try {
    // APIサーバーのURL
    const apiUrl = 'http://localhost:3000/api/features/extract';

    // APIに仕様書データを送信
    const response = await axios.post(apiUrl, data);
    console.log('Features extracted from API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'features-extracted',
        data: response.data
      });
    }
  } catch (error: any) {
    console.error('Failed to extract features from API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'features-extraction-error',
        error: error.message || 'Unknown error'
      });
    }
  }
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

// Handle save features
ipcMain.on('save-features', async (event, data) => {
  console.log('Save features requested:', data);

  try {
    // APIサーバーのURL
    const apiUrl = 'http://localhost:3000/api/features/save';

    // APIに機能データを送信
    const response = await axios.post(apiUrl, data);
    console.log('Features saved to API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'features-saved',
        data: response.data
      });
    }
  } catch (error: any) {
    console.error('Failed to save features to API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'features-save-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});

// Handle get features
ipcMain.on('get-features', async (event, data) => {
  console.log('Get features requested:', data);

  try {
    // APIサーバーのURL
    let apiUrl = 'http://localhost:3000/api/features';

    // プロジェクトIDが指定されている場合は、そのプロジェクトの機能を取得
    if (data && data.projectId) {
      apiUrl = `http://localhost:3000/api/projects/${data.projectId}/features`;
    }

    // APIから機能一覧を取得
    const response = await axios.get(apiUrl);
    console.log('Features loaded from API:', response.data);
    console.log('API URL used:', apiUrl);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      // レスポンスデータが配列か確認
      const featuresData = Array.isArray(response.data) ? response.data : [];
      console.log('Sending features to renderer:', featuresData);

      event.sender.send('message-from-main', {
        type: 'features-loaded',
        data: featuresData
      });
    }
  } catch (error: any) {
    console.error('Failed to load features from API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'features-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});

// Handle save label
ipcMain.on('save-label', async (event, data) => {
  console.log('Save label requested:', data);

  try {
    // APIサーバーのURL
    const apiUrl = 'http://localhost:3000/api/labels/save';

    // APIにラベルデータを送信
    const response = await axios.post(apiUrl, {
      label: data
    });
    console.log('Label saved to API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'label-save-success',
        data: response.data
      });
    }
  } catch (error: any) {
    console.error('Failed to save label to API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'label-save-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});

// Handle get labels by URL
ipcMain.on('get-labels-by-url', async (event, data) => {
  console.log('Get labels by URL requested:', data);

  try {
    // APIサーバーのURL
    const apiUrl = 'http://localhost:3000/api/labels/url';

    // URLとプロジェクトIDをクエリパラメータとして追加
    const params = {
      url: data.url,
      projectId: data.projectId
    };

    // APIからラベル一覧を取得
    const response = await axios.get(apiUrl, { params });
    console.log('Labels loaded from API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'labels-by-url-loaded',
        data: response.data
      });
    }
  } catch (error: any) {
    console.error('Failed to load labels by URL from API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'labels-by-url-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});

// Handle get scenarios by feature ID
ipcMain.on('get-scenarios', async (event, data) => {
  console.log('Get scenarios requested:', data);

  try {
    // APIサーバーのURL
    const apiUrl = `http://localhost:3000/api/features/${data.featureId}/scenarios`;

    // APIからシナリオ一覧を取得
    const response = await axios.get(apiUrl);
    console.log('Scenarios loaded from API:', response.data);

    // 成功メッセージをレンダラープロセスに送信
    if (event.sender) {
      // レスポンスデータが配列か確認
      const scenariosData = Array.isArray(response.data) ? response.data : [];
      console.log('Sending scenarios to renderer:', scenariosData);

      event.sender.send('message-from-main', {
        type: 'scenarios-loaded',
        data: scenariosData
      });
    }
  } catch (error: any) {
    console.error('Failed to load scenarios from API:', error);

    // エラーメッセージをレンダラープロセスに送信
    if (event.sender) {
      event.sender.send('message-from-main', {
        type: 'scenarios-error',
        error: error.message || 'Unknown error'
      });
    }
  }
});