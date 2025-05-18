import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LabelPopup from '../components/LabelPopup';
import LabelListPanel from '../components/LabelListPanel';
import LabelReviewPanel from '../components/LabelReviewPanel';
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

interface TriggerAction {
  type: string;
  selector: string;
  text?: string;
  timestamp: string;
}

interface ElementInfo {
  selector: string;
  text?: string;
  triggerActions?: TriggerAction[];
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
  const [generatedLabels, setGeneratedLabels] = useState<any[]>([]);
  const [showLabelReviewPanel, setShowLabelReviewPanel] = useState(false);
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSavingMultipleLabels, setIsSavingMultipleLabels] = useState(false);
  const [userActions, setUserActions] = useState<TriggerAction[]>([]);
  const [isRecordingActions, setIsRecordingActions] = useState(true); // デフォルトでアクション記録を有効化
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
    // 高さを100%に設定
    webviewElement.style.height = '100%';
    webviewElement.style.width = '100%';

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
      } else if (message.type === 'labels-auto-generated') {
        console.log('Labels auto-generated:', message.data);
        setGeneratedLabels(message.data);
        setIsGeneratingLabels(false);
        setGenerationError(null);
        setShowLabelReviewPanel(true);
        addLog('success', `${message.data.length}個のラベルを自動生成しました`);
      } else if (message.type === 'labels-auto-generation-error') {
        console.error('Error auto-generating labels:', message.error);
        setGeneratedLabels([]);
        setIsGeneratingLabels(false);
        setGenerationError(message.error);
        addLog('error', `ラベル自動生成エラー: ${message.error}`);
      } else if (message.type === 'multiple-labels-saved') {
        console.log('Multiple labels saved:', message.data);
        setIsSavingMultipleLabels(false);
        setShowLabelReviewPanel(false);
        refreshLabels(); // ラベル一覧を更新
        addLog('success', `${message.data.length}個のラベルを保存しました`);
      } else if (message.type === 'multiple-labels-save-error') {
        console.error('Error saving multiple labels:', message.error);
        setIsSavingMultipleLabels(false);
        addLog('error', `複数ラベル保存エラー: ${message.error}`);
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
            // 記録されたアクションを要素情報に追加
            data.triggerActions = userActions;
            setSelectedElement(data);
            setShowLabelPopup(true);
          } catch (error) {
            addLog('error', `Failed to parse label data: ${error}`);
          }
        }
        // ユーザーアクションの記録
        else if (eventMessage.startsWith('USER_ACTION:')) {
          try {
            const actionData = JSON.parse(eventMessage.replace('USER_ACTION:', ''));
            if (isRecordingActions) {
              // 新しいアクションを追加
              setUserActions(prevActions => {
                // 最大アクション数を制限（10個まで）
                const newActions = [...prevActions, actionData];
                if (newActions.length > 10) {
                  return newActions.slice(-10);
                }
                return newActions;
              });
              addLog('info', `アクション記録: ${actionData.type} on ${actionData.selector}`);
            }
          } catch (error) {
            addLog('error', `Failed to parse action data: ${error}`);
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

      // セレクタを生成する関数
      function generateSelector(element) {
        if (!element) return '';

        // IDがあればそれを使用
        if (element.id) {
          return '#' + element.id;
        }

        // クラス名があれば最初の2つまで使用
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ').filter(c => c && !c.includes('e2e-app-'));
          if (classes.length > 0) {
            return element.tagName.toLowerCase() + '.' + classes.slice(0, 2).join('.');
          }
        }

        // タグ名と属性を使用
        let selector = element.tagName.toLowerCase();
        if (element.hasAttribute('type')) {
          selector += '[type="' + element.getAttribute('type') + '"]';
        } else if (element.hasAttribute('name')) {
          selector += '[name="' + element.getAttribute('name') + '"]';
        }

        // 親要素の情報を追加
        if (element.parentElement && element.parentElement !== document.body) {
          const parentTag = element.parentElement.tagName.toLowerCase();
          const siblings = Array.from(element.parentElement.children);
          const index = siblings.indexOf(element);
          if (siblings.length > 1) {
            selector = parentTag + ' > ' + selector + ':nth-child(' + (index + 1) + ')';
          } else {
            selector = parentTag + ' > ' + selector;
          }
        }

        return selector;
      }

      // ユーザーアクションを記録する関数
      function recordUserAction(type, element, additionalData = {}) {
        if (!element) return;

        const selector = generateSelector(element);
        const text = element.textContent ? element.textContent.trim().substring(0, 50) : '';

        const actionData = {
          type,
          selector,
          text,
          timestamp: new Date().toISOString(),
          ...additionalData
        };

        console.log('[EVENT] USER_ACTION:' + JSON.stringify(actionData));
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

        // ラベル登録モードでない場合はアクションを記録
        if (!window.testpilotLabelRegisterActive) {
          recordUserAction('click', target);
        }
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
        recordUserAction('submit', form, { action });
      });

      // Track input changes
      document.addEventListener('input', (e) => {
        let target = e.target;
        let tagName = target.tagName.toLowerCase();
        let type = target.type || '';
        let id = target.id ? '#' + target.id : '';
        let name = target.name ? '[name=' + target.name + ']' : '';

        console.log('[EVENT] Input: <' + tagName + type + id + name + '>');

        // ラベル登録モードでない場合はアクションを記録
        if (!window.testpilotLabelRegisterActive) {
          let value = '';
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
            value = target.value;
            // パスワードフィールドの場合は値を隠す
            if (target.type === 'password') {
              value = '********';
            }
          }
          recordUserAction('input', target, { value: value.substring(0, 50) });
        }
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

  // Handle auto-generate labels button click
  const handleAutoGenerateLabelsClick = () => {
    if (!projectId) {
      addLog('error', 'プロジェクトIDが設定されていません。プロジェクトを作成してください。');
      return;
    }

    if (!webviewRef.current) {
      addLog('error', 'Webviewが初期化されていません。');
      return;
    }

    setIsGeneratingLabels(true);
    setGenerationError(null);

    // Get current URL and HTML content
    const currentUrl = webviewRef.current.getURL();
    let queryParams = null;

    // Extract query parameters if present
    try {
      const urlObj = new URL(currentUrl);
      if (urlObj.search) {
        queryParams = urlObj.search; // Includes the '?' character
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    // Get only body content from webview
    webviewRef.current.executeJavaScript(`
      // bodyタグの中身だけを取得する関数
      function getBodyContent() {
        // body要素のクローンを作成
        const bodyClone = document.body.cloneNode(true);

        // スクリプト、スタイル、コメント、大きな画像を削除
        const scripts = bodyClone.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        const styles = bodyClone.querySelectorAll('style');
        styles.forEach(style => style.remove());

        // 大きな画像やデータのURIを削除
        const images = bodyClone.querySelectorAll('img');
        images.forEach(img => {
          if (img.src && img.src.startsWith('data:')) {
            img.setAttribute('src', '');
          }
        });

        // コメントノードを削除
        const walker = document.createTreeWalker(
          bodyClone,
          NodeFilter.SHOW_COMMENT,
          null,
          false
        );
        const commentsToRemove = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
          commentsToRemove.push(currentNode);
        }
        commentsToRemove.forEach(comment => comment.parentNode.removeChild(comment));

        // ページのタイトルを取得
        const pageTitle = document.title || '';

        // ページの基本情報とbodyの内容を返す
        return {
          title: pageTitle,
          bodyContent: bodyClone.innerHTML
        };
      }

      getBodyContent();
    `).then(result => {
      // Send HTML content to API for label generation
      addLog('info', 'HTMLコンテンツからラベルを自動生成中...');

      // ページタイトルとbodyの内容を取得
      const { title, bodyContent } = result;

      // シンプルなHTMLを作成
      const simplifiedHtml = `<html><head><title>${title}</title></head><body>${bodyContent}</body></html>`;

      window.api.send('auto-generate-labels', {
        htmlContent: simplifiedHtml,
        url: currentUrl,
        queryParams,
        projectId
      });
    }).catch(error => {
      setIsGeneratingLabels(false);
      setGenerationError(error.message);
      addLog('error', `HTML取得エラー: ${error.message}`);
    });
  };

  // Handle save selected labels
  const handleSaveSelectedLabels = (selectedLabels: any[]) => {
    if (!projectId || selectedLabels.length === 0) {
      return;
    }

    setIsSavingMultipleLabels(true);
    addLog('info', `${selectedLabels.length}個のラベルを保存中...`);

    window.api.send('save-multiple-labels', {
      labels: selectedLabels
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleAutoGenerateLabelsClick}
            size="sm"
            disabled={isGeneratingLabels}
          >
            {isGeneratingLabels ? 'ラベル生成中...' : 'ラベル自動生成'}
          </Button>
          <Button
            variant={isLabelRegisterActive ? "destructive" : "default"}
            onClick={handleLabelRegisterClick}
            size="sm"
          >
            ラベル登録
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-60px)]">
        <div id="webview-container" className="flex-[2] relative h-full">
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
          onSave={(name, description, includeTriggerActions) => {
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
              projectId,
              // トリガーアクション情報を含める場合のみ追加
              triggerActions: includeTriggerActions ? selectedElement.triggerActions : undefined
            };

            addLog('info', `ラベル「${name}」を保存中...`);
            window.api.send('save-label', labelData);

            // アクション履歴をクリア
            setUserActions([]);
            setShowLabelPopup(false);
            setSelectedElement(null);
          }}
          onCancel={() => {
            setShowLabelPopup(false);
            setSelectedElement(null);
          }}
        />
      )}

      {/* Label Review Panel */}
      {showLabelReviewPanel && generatedLabels.length > 0 && (
        <LabelReviewPanel
          labels={generatedLabels}
          onSave={handleSaveSelectedLabels}
          onCancel={() => {
            setShowLabelReviewPanel(false);
            setGeneratedLabels([]);
          }}
        />
      )}
    </div>
  );
};

export default BrowserPage;
