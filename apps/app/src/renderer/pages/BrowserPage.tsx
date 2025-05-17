import React, { useState, useRef, useEffect } from 'react';
import { PageType } from '../App';
import '../styles/BrowserPage.css';

interface BrowserPageProps {
  onNavigate: (page: PageType) => void;
  projectUrl?: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  type: string;
  message: string;
}

const BrowserPage: React.FC<BrowserPageProps> = ({ onNavigate, projectUrl }) => {
  const [url, setUrl] = useState(projectUrl || 'https://www.google.com');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Update URL when projectUrl changes
  useEffect(() => {
    if (projectUrl) {
      setUrl(projectUrl);
    }
  }, [projectUrl]);

  // Initialize webview when component mounts
  useEffect(() => {
    const webviewElement = document.createElement('webview') as Electron.WebviewTag;
    webviewElement.src = url;
    webviewElement.setAttribute('allowpopups', 'true');
    webviewElement.className = 'webview';

    const webviewContainer = document.getElementById('webview-container');
    if (webviewContainer) {
      // Clear any existing webview
      webviewContainer.innerHTML = '';
      webviewContainer.appendChild(webviewElement);
      webviewRef.current = webviewElement;

      // Set up event listeners
      setupWebviewEvents(webviewElement);
    }

    // Add initial log
    addLog('info', 'Browser initialized');

    // Clean up on unmount
    return () => {
      if (webviewContainer) {
        webviewContainer.innerHTML = '';
      }
    };
  }, []);

  // Add a log entry
  const addLog = (type: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
      id: logIdCounter,
      timestamp,
      type,
      message
    };

    setLogs(prevLogs => [...prevLogs, newLog]);
    setLogIdCounter(prevId => prevId + 1);

    // Auto-scroll to bottom
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Log cleared');
  };

  // Load URL in webview
  const loadURL = () => {
    if (webviewRef.current) {
      const formattedURL = formatURL(url);
      webviewRef.current.src = formattedURL;
      addLog('navigation', `Navigating to: ${formattedURL}`);
    }
  };

  // Format URL (add https:// if not present)
  const formatURL = (inputUrl: string): string => {
    if (inputUrl.trim() === '') return 'about:blank';

    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      return 'https://' + inputUrl;
    }

    return inputUrl;
  };

  // Set up event listeners for the webview
  const setupWebviewEvents = (webview: Electron.WebviewTag) => {
    // Navigation events
    webview.addEventListener('did-start-loading', () => {
      addLog('loading', 'Page started loading');
    });

    webview.addEventListener('did-finish-load', () => {
      addLog('loaded', `Page loaded: ${webview.getURL()}`);

      // Inject event listeners into the page
      injectEventListeners(webview);
    });

    webview.addEventListener('did-fail-load', (event) => {
      addLog('error', `Failed to load: ${event.errorDescription}`);
    });

    // Console message events
    webview.addEventListener('console-message', (event) => {
      if (event.message.startsWith('[EVENT]')) {
        addLog('page-event', event.message.replace('[EVENT] ', ''));
      }
    });
  };

  // Inject event listeners into the loaded page
  const injectEventListeners = (webview: Electron.WebviewTag) => {
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
        addLog('error', `Failed to inject event listeners: ${error.message}`);
      });
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  // Handle URL input keypress
  const handleUrlKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadURL();
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    onNavigate('menu');
  };

  return (
    <div className="browser-page">
      <div className="controls">
        <button className="back-button" onClick={handleBackClick}>
          ← メニューに戻る
        </button>
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={handleUrlChange}
          onKeyPress={handleUrlKeyPress}
          placeholder="Enter URL (e.g., https://www.google.com)"
        />
        <button id="load-button" onClick={loadURL}>Load</button>
      </div>

      <div className="container">
        <div id="webview-container" className="webview-container">
          {/* Webview will be created dynamically */}
        </div>

        <div className="log-container" ref={logContainerRef}>
          <h3>Event Log</h3>
          <div id="event-log" className="event-log">
            {logs.map(log => (
              <div key={log.id} className="log-entry">
                <span className="timestamp">[{log.timestamp}] </span>
                <span className={`log-type ${log.type}`}>{log.type}: </span>
                {log.message}
              </div>
            ))}
          </div>
          <button className="clear-log" onClick={clearLogs}>Clear Log</button>
        </div>
      </div>
    </div>
  );
};

export default BrowserPage;
