// Define the API interface to match the one in preload.ts
interface ElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
}

// Extend the Window interface to include our API
interface Window {
  api: ElectronAPI;
}

// DOM Elements
const urlInput = document.getElementById('url-input') as HTMLInputElement;
const loadButton = document.getElementById('load-button') as HTMLButtonElement;
const eventLog = document.getElementById('event-log') as HTMLDivElement;
const clearLogButton = document.getElementById('clear-log') as HTMLButtonElement;

// Create webview element
let webview: Electron.WebviewTag | null = null;

// Initialize the application
function init(): void {
  // Set default URL
  urlInput.value = 'https://www.google.com';

  // Create and load the webview
  createWebview(urlInput.value);

  // Event listeners
  loadButton.addEventListener('click', () => {
    loadURL(urlInput.value);
  });

  urlInput.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadURL(urlInput.value);
    }
  });

  clearLogButton.addEventListener('click', () => {
    clearLog();
  });
}

// Create a new webview element
function createWebview(url: string): void {

  // Create new webview
  webview = document.createElement('webview') as Electron.WebviewTag;
  webview.src = formatURL(url);
  webview.setAttribute('allowpopups', 'true');

  setupWebviewEvents();
}

// Format URL (add https:// if not present)
function formatURL(url: string): string {
  if (url.trim() === '') return 'about:blank';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }

  return url;
}

// Load URL in the webview
function loadURL(url: string): void {
  const formattedURL = formatURL(url);

  if (webview) {
    webview.src = formattedURL;
    logEvent('navigation', `Navigating to: ${formattedURL}`);
  } else {
    createWebview(formattedURL);
  }
}

// Set up event listeners for the webview
function setupWebviewEvents(): void {
  if (!webview) return;

  // Navigation events
  webview.addEventListener('did-start-loading', () => {
    logEvent('loading', 'Page started loading');
  });

  webview.addEventListener('did-finish-load', () => {
    if (webview) {
      logEvent('loaded', `Page loaded: ${webview.getURL()}`);

      // Inject event listeners into the page
      injectEventListeners();
    }
  });

  webview.addEventListener('did-fail-load', (event) => {
    logEvent('error', `Failed to load: ${event.errorDescription}`);
  });

  // Console message events
  webview.addEventListener('console-message', (event) => {
    if (event.message.startsWith('[EVENT]')) {
      logEvent('page-event', event.message.replace('[EVENT] ', ''));
    }
  });
}

// Inject event listeners into the loaded page
function injectEventListeners(): void {
  if (!webview) return;

  const script = `
    // Track mouse clicks
    document.addEventListener('click', (e) => {
      let target = e.target;
      let tagName = target.tagName.toLowerCase();
      let id = target.id ? '#' + target.id : '';
      let classes = target.className ? '.' + target.className.replace(/ /g, '.') : '';
      let text = target.innerText ? target.innerText.substring(0, 20) : '';
      if (text && text.length >= 20) text += '...';

      console.log('[EVENT] Click: <' + tagName + id + classes + '>' + (text ? ' "' + text + '"' : ''));
    });

    // Track hover events
    document.addEventListener('mouseover', (e) => {
      let target = e.target;
      let tagName = target.tagName.toLowerCase();
      let id = target.id ? '#' + target.id : '';
      let classes = target.className ? '.' + target.className.replace(/ /g, '.') : '';

      console.log('[EVENT] Hover: <' + tagName + id + classes + '>');
    }, { passive: true });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      let form = e.target;
      let id = form.id ? '#' + form.id : '';
      let action = form.action || 'unknown';

      console.log('[EVENT] Form submit: <form' + id + '> to ' + action);
    });

    // Track input changes
    document.addEventListener('input', (e) => {
      let target = e.target;
      let tagName = target.tagName.toLowerCase();
      let type = target.type || '';
      let id = target.id ? '#' + target.id : '';
      let name = target.name ? '[name=' + target.name + ']' : '';

      console.log('[EVENT] Input: <' + tagName + type + id + name + '>');
    }, { passive: true });

    console.log('[EVENT] Event listeners injected');
  `;

  webview.executeJavaScript(script)
    .catch(error => {
      logEvent('error', `Failed to inject event listeners: ${error.message}`);
    });
}

// Log an event to the event log
function logEvent(type: string, message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';

  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'timestamp';
  timestampSpan.textContent = `[${timestamp}] `;

  logEntry.appendChild(timestampSpan);
  logEntry.appendChild(document.createTextNode(`${type}: ${message}`));

  eventLog.appendChild(logEntry);

  // Auto-scroll to bottom
  eventLog.scrollTop = eventLog.scrollHeight;
}

// Clear the event log
function clearLog(): void {
  eventLog.innerHTML = '';
  logEvent('info', 'Log cleared');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
