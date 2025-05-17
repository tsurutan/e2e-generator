import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LabelPopup from '../components/LabelPopup';
import LabelListPanel from '../components/LabelListPanel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAppContext } from '../contexts/AppContext';

interface BrowserPageProps {}

interface LogEntry {
  id: number;
  timestamp: string;
  type: string;
  message: string;
}

interface ElementInfo {
  selector: string;
  text?: string;
}

const BrowserPage: React.FC<BrowserPageProps> = () => {
  const navigate = useNavigate();
  const { project } = useAppContext();
  const projectUrl = project?.url;
  const projectId = project?.id;
  const [url, setUrl] = useState(projectUrl || 'https://www.google.com');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const [isLabelRegisterActive, setIsLabelRegisterActive] = useState(false);
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [labelSaving, setLabelSaving] = useState(false);
  const [labelSaveError, setLabelSaveError] = useState<string | null>(null);
  const [labelSaveSuccess, setLabelSaveSuccess] = useState(false);
  const [labels, setLabels] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showLabelList, setShowLabelList] = useState(false);
  const webviewRef = useRef<Electron.WebviewTag | null>(null);

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

  // Listen for messages from the main process
  useEffect(() => {
    // Listen for messages from main process
    const handleMessage = (message: any) => {
      if (message.type === 'label-save-success') {
        console.log('Label saved successfully:', message.data);
        setLabelSaving(false);
        setLabelSaveSuccess(true);
        setLabelSaveError(null);
        addLog('success', `ラベル「${message.data.name}」を保存しました`);
      } else if (message.type === 'label-save-error') {
        console.error('Error saving label:', message.error);
        setLabelSaving(false);
        setLabelSaveSuccess(false);
        setLabelSaveError(message.error);
        addLog('error', `ラベル保存エラー: ${message.error}`);
      } else if (message.type === 'labels-by-url-loaded') {
        console.log('Labels loaded successfully:', message.data);
        setLabels(message.data);
        setLoadingLabels(false);
        setLabelError(null);
        addLog('success', `${message.data.length}個のラベルを読み込みました`);
      } else if (message.type === 'labels-by-url-error') {
        console.error('Error loading labels:', message.error);
        setLabels([]);
        setLoadingLabels(false);
        setLabelError(message.error);
        addLog('error', `ラベル読み込みエラー: ${message.error}`);
      }
    };

    // Register message listener
    window.api.receive('message-from-main', handleMessage);

    // No cleanup needed as we can't remove the listener due to the API design
    return () => {};
  }, []);

  // Add a log entry (コンソールに出力するだけ)
  const addLog = (type: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${type}: ${message}`);
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

      // 現在のURLを更新
      setCurrentUrl(webview.getURL());

      // ラベル一覧を更新
      refreshLabels();

      // Inject event listeners into the page
      injectEventListeners(webview);
    });

    webview.addEventListener('did-fail-load', (event) => {
      addLog('error', `Failed to load: ${event.errorDescription}`);
    });

    // Console message events
    webview.addEventListener('console-message', (event) => {
      if (event.message.startsWith('[EVENT]')) {
        const eventMessage = event.message.replace('[EVENT] ', '');
        addLog('page-event', eventMessage);

        // Check for label registration events
        if (eventMessage.startsWith('LABEL_REGISTER:')) {
          try {
            const data = JSON.parse(eventMessage.replace('LABEL_REGISTER:', ''));
            setSelectedElement(data);
            setShowLabelPopup(true);
          } catch (error) {
            addLog('error', `Failed to parse label data: ${error}`);
          }
        }
      }
    });
  };

  // Inject event listeners into the loaded page
  const injectEventListeners = (webview: Electron.WebviewTag) => {
    const script = `
      // Add CSS for hover highlight if not already added
      if (!document.getElementById('e2e-app-styles')) {
        const style = document.createElement('style');
        style.id = 'e2e-app-styles';
        style.textContent = \`
          .e2e-app-hover-highlight {
            outline: 2px dashed red !important;
            outline-offset: 2px !important;
          }
        \`;
        document.head.appendChild(style);
      }

      // Function to handle mouseover events for hover highlight
      function handleElementHover(e) {
        const target = e.target;
        // Remove highlight from any previously highlighted element
        const highlighted = document.querySelector('.e2e-app-hover-highlight');
        if (highlighted) {
          highlighted.classList.remove('e2e-app-hover-highlight');
        }
        // Add highlight to current element
        target.classList.add('e2e-app-hover-highlight');
      }

      // Function to handle mouseout events for hover highlight
      function handleElementLeave(e) {
        const target = e.target;
        target.classList.remove('e2e-app-hover-highlight');
      }

      // Add hover highlight event listeners
      document.addEventListener('mouseover', handleElementHover);
      document.addEventListener('mouseout', handleElementLeave);

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
    navigate('/menu');
  };

  // ラベル一覧を更新する関数
  const refreshLabels = () => {
    if (!projectId) return;

    // ラベル一覧を読み込む
    setLoadingLabels(true);
    setLabelError(null);
    setLabels([]);

    // 現在のURLを取得
    let url = '';
    if (webviewRef.current) {
      url = webviewRef.current.getURL();
      setCurrentUrl(url);
    }

    // ラベル一覧を取得するリクエストを送信
    addLog('info', `URL ${url} のラベルを読み込み中...`);
    window.api.send('get-labels-by-url', {
      url: url,
      projectId
    });
  };

  // 要素をハイライトする関数
  const focusElement = (selector: string) => {
    if (!webviewRef.current) return;

    // ステップバイステップで実行してエラーを特定しやすくする

    // ステップ1: スタイルを追加する
    const addStyleScript = `
      if (!document.getElementById('e2e-app-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'e2e-app-highlight-style';
        style.textContent = '.e2e-app-element-highlight { outline: 2px dashed red !important; outline-offset: 2px !important; }';
        document.head.appendChild(style);
      }
      true;
    `;

    // ステップ2: 前回のハイライトを削除する
    const removeHighlightsScript = `
      const previousHighlights = document.querySelectorAll('.e2e-app-element-highlight');
      previousHighlights.forEach(el => {
        el.classList.remove('e2e-app-element-highlight');
      });
      true;
    `;

    // ステップ3: 要素をハイライトする
    // セレクタをJSONでエスケープして安全に渡す
    const safeSelector = JSON.stringify(selector);
    const highlightScript = `
      try {
        const elements = document.querySelectorAll(${safeSelector});
        let count = 0;
        elements.forEach(el => {
          el.classList.add('e2e-app-element-highlight');
          // 要素が表示されているか確認し、必要に応じてスクロール
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          count++;
        });
        count;
      } catch (e) {
        console.error('Error highlighting elements:', e);
        -1;
      }
    `;

    // 順番に実行する
    webviewRef.current?.executeJavaScript(addStyleScript)
      .then(() => webviewRef.current?.executeJavaScript(removeHighlightsScript))
      .then(() => webviewRef.current?.executeJavaScript(highlightScript))
      .then((count) => {
        if (count > 0) {
          addLog('success', `${count}個の要素をハイライトしました: ${selector}`);
        } else if (count === 0) {
          addLog('warning', `要素が見つかりませんでした: ${selector}`);
        } else {
          addLog('error', `セレクタのエラー: ${selector}`);
        }
      })
      .catch(error => {
        addLog('error', `ハイライト失敗: ${error.message}`);
      });
  };

  // Handle label register button click
  const handleLabelRegisterClick = () => {
    const newState = !isLabelRegisterActive;
    setIsLabelRegisterActive(newState);

    // ラベル一覧表示中の場合は閉じる
    if (showLabelList) {
      setShowLabelList(false);
    }

    // Update the label register mode in the webview
    if (webviewRef.current) {
      // Inject script to toggle label register mode
      const script = `
        // Function to handle click events in label register mode
        function handleClick(e) {
          if (${newState}) {
            e.preventDefault();
            e.stopPropagation();

            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            const id = target.id ? '#' + target.id : '';
            const classes = target.className ? '.' + target.className.replace(/ /g, '.').replace(/e2e-app-hover-highlight/g, '') : '';
            const text = target.innerText ? target.innerText.substring(0, 20) + (target.innerText.length > 20 ? '...' : '') : '';
            const selector = tagName + id + classes;

            // Send data to the parent window for custom popup
            const elementData = {
              selector: selector,
              text: text
            };
            console.log('[EVENT] LABEL_REGISTER:' + JSON.stringify(elementData));

            return false;
          }
        }

        // Remove existing click event listener if any
        document.removeEventListener('click', handleClick, true);

        // Add click event listener if label register mode is active
        if (${newState}) {
          document.addEventListener('click', handleClick, true);
          console.log('[EVENT] Label register mode: ON');
        } else {
          console.log('[EVENT] Label register mode: OFF');
        }
      `;

      webviewRef.current.executeJavaScript(script)
        .catch(error => {
          addLog('error', `Failed to update label register mode: ${error.message}`);
        });

      addLog('info', `ラベル登録モード: ${newState ? 'オン' : 'オフ'}`);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-wrap p-3 gap-3 bg-muted/30 border-b items-center">
        <Button
          variant="outline"
          onClick={handleBackClick}
          className="flex items-center gap-1"
          size="sm"
        >
          <span className="mr-1">←</span> メニューに戻る
        </Button>
        <div className="flex flex-1 min-w-[300px]">
          <Input
            id="url-input"
            type="text"
            value={url}
            onChange={handleUrlChange}
            onKeyPress={handleUrlKeyPress}
            placeholder="Enter URL (e.g., https://www.google.com)"
            className="rounded-r-none"
          />
          <Button
            id="load-button"
            onClick={loadURL}
            className="rounded-l-none"
          >
            Load
          </Button>
        </div>
        <Button
          variant={isLabelRegisterActive ? "destructive" : "default"}
          onClick={handleLabelRegisterClick}
          size="sm"
        >
          ラベル登録
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div id="webview-container" className="flex-[2] relative">
          {/* Webview will be created dynamically */}
        </div>

        <LabelListPanel
          labels={labels}
          loading={loadingLabels}
          error={labelError}
          currentUrl={currentUrl}
          onRefresh={refreshLabels}
          onFocusElement={focusElement}
        />
      </div>

      {/* Label Registration Popup */}
      {showLabelPopup && selectedElement && (
        <LabelPopup
          elementInfo={selectedElement}
          onSave={(name, description) => {
            if (!projectId) {
              addLog('error', 'プロジェクトIDが設定されていません。プロジェクトを作成してください。');
              setShowLabelPopup(false);
              setSelectedElement(null);
              return;
            }

            setLabelSaving(true);
            setLabelSaveError(null);
            setLabelSaveSuccess(false);

            // Get current URL from webview
            let currentUrl = '';
            let queryParams = null;

            if (webviewRef.current) {
              currentUrl = webviewRef.current.getURL();

              // Extract query parameters if present
              try {
                const urlObj = new URL(currentUrl);
                if (urlObj.search) {
                  queryParams = urlObj.search; // Includes the '?' character
                  currentUrl = currentUrl.replace(urlObj.search, ''); // Remove query params from base URL
                }
              } catch (error) {
                console.error('Error parsing URL:', error);
              }
            }

            // Save label to database via API
            const labelData = {
              name,
              description,
              selector: selectedElement.selector,
              elementText: selectedElement.text,
              url: currentUrl,
              queryParams,
              projectId
            };

            addLog('info', `ラベル「${name}」を保存中...`);
            window.api.send('save-label', labelData);

            setShowLabelPopup(false);
            setSelectedElement(null);
          }}
          onCancel={() => {
            setShowLabelPopup(false);
            setSelectedElement(null);
          }}
        />
      )}


    </div>
  );
};

export default BrowserPage;
