// DOM Elements
const featuresButton = document.getElementById('features-button') as HTMLButtonElement;
const uploadButton = document.getElementById('upload-button') as HTMLButtonElement;
const browserButton = document.getElementById('browser-button') as HTMLButtonElement;

// Electron API interface
interface ElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
}

// Extend Window interface
interface Window {
  api: ElectronAPI;
}

// Initialize the menu application
function initMenu(): void {
  // Add event listeners to menu buttons
  featuresButton?.addEventListener('click', () => {
    console.log('Features button clicked');
    // For now, just show an alert since this feature is not implemented
    alert('機能一覧は現在開発中です。');
  });

  uploadButton?.addEventListener('click', () => {
    console.log('Upload button clicked');
    // For now, just show an alert since this feature is not implemented
    alert('仕様書のアップロード機能は現在開発中です。');
  });

  browserButton?.addEventListener('click', () => {
    console.log('Browser button clicked');
    // Send message to main process to open browser window
    window.api.send('open-browser', {});
  });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMenu);
