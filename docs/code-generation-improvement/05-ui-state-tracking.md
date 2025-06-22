# UI状態追跡システム

## 概要

ページ遷移を伴わない画面状態の変化を追跡・記録し、より精密なテストコード生成を実現するシステムです。

## 現在の実装状況

### 既存のMutationObserver
```typescript
// apps/app/src/renderer/pages/BrowserPage.tsx (269-285行目)
const observer = new MutationObserver(function (mutations) {
  for (const mutation of mutations) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log("[MUTATION]", node.innerHTML);
        }
      });
    }
  }
});
```

### 課題
- 基本的なDOM変更のみを記録
- before/after状態の詳細な差分が不足
- 操作との関連性が記録されていない

## 拡張UI状態追跡システム

### AdvancedUIStateTracker クラス

```typescript
export interface DOMSnapshot {
  visibleElements: string[];
  hiddenElements: string[];
  formValues: Record<string, string>;
  scrollPosition: { x: number; y: number };
  activeElement: string;
  newElements?: string[];
  removedElements?: string[];
  modifiedElements?: Array<{
    selector: string;
    changes: Record<string, any>;
  }>;
}

export interface UIStateTransition {
  sessionId: string;
  fromUIStateId?: string;
  toUIStateId: string;
  triggerAction: TriggerAction;
  beforeState: DOMSnapshot;
  afterState: DOMSnapshot;
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    loadTime: number;
    networkRequests?: string[];
    performanceMetrics?: Record<string, number>;
  };
  timestamp: string;
}

export class AdvancedUIStateTracker {
  private mutationObserver: MutationObserver;
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver;
  private performanceObserver: PerformanceObserver;
  
  private currentSession: string | null = null;
  private lastSnapshot: DOMSnapshot | null = null;
  private pendingTransition: Partial<UIStateTransition> | null = null;
  
  constructor(private webview: Electron.WebviewTag) {
    this.setupObservers();
  }
  
  startSession(sessionId: string, userGoal?: string): void {
    this.currentSession = sessionId;
    this.lastSnapshot = this.captureSnapshot();
    
    // セッション開始をAPIに通知
    window.api.send('start-operation-session', {
      sessionId,
      userGoal,
      initialSnapshot: this.lastSnapshot
    });
  }
  
  endSession(): void {
    if (this.currentSession) {
      window.api.send('end-operation-session', {
        sessionId: this.currentSession
      });
      this.currentSession = null;
      this.lastSnapshot = null;
    }
  }
  
  recordTransition(triggerAction: TriggerAction): void {
    if (!this.currentSession) return;
    
    const beforeState = this.lastSnapshot || this.captureSnapshot();
    
    // DOM変更を待ってからafter状態をキャプチャ
    setTimeout(() => {
      const afterState = this.captureSnapshot();
      const diff = this.calculateStateDiff(beforeState, afterState);
      
      const transition: UIStateTransition = {
        sessionId: this.currentSession!,
        triggerAction,
        beforeState,
        afterState: { ...afterState, ...diff },
        metadata: this.captureMetadata(),
        timestamp: new Date().toISOString()
      };
      
      // APIに送信
      window.api.send('record-ui-state-transition', transition);
      
      this.lastSnapshot = afterState;
    }, 100); // DOM変更の完了を待つ
  }
}
```

### 状態スナップショット機能

```typescript
private captureSnapshot(): DOMSnapshot {
  return this.webview.executeJavaScript(`
    (() => {
      // 可視要素の取得
      const visibleElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map(el => this.generateSelector(el))
        .slice(0, 100); // パフォーマンス考慮
      
      // 非表示要素の取得
      const hiddenElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || style.visibility === 'hidden';
        })
        .map(el => this.generateSelector(el))
        .slice(0, 50);
      
      // フォーム値の取得
      const formValues = {};
      document.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.name || el.id) {
          const key = el.name || el.id;
          formValues[key] = el.type === 'password' ? '********' : el.value;
        }
      });
      
      return {
        visibleElements,
        hiddenElements,
        formValues,
        scrollPosition: { x: window.scrollX, y: window.scrollY },
        activeElement: document.activeElement ? this.generateSelector(document.activeElement) : ''
      };
    })()
  `);
}
```

### 状態差分計算

```typescript
private calculateStateDiff(before: DOMSnapshot, after: DOMSnapshot): Partial<DOMSnapshot> {
  // 新規表示要素
  const newElements = after.visibleElements.filter(el => 
    !before.visibleElements.includes(el)
  );
  
  // 削除要素
  const removedElements = before.visibleElements.filter(el => 
    !after.visibleElements.includes(el)
  );
  
  // 変更要素
  const modifiedElements = [];
  for (const [key, afterValue] of Object.entries(after.formValues)) {
    const beforeValue = before.formValues[key];
    if (beforeValue !== afterValue) {
      modifiedElements.push({
        selector: `[name="${key}"], #${key}`,
        changes: { 
          value: { from: beforeValue, to: afterValue } 
        }
      });
    }
  }
  
  return {
    newElements,
    removedElements,
    modifiedElements
  };
}
```

## Observer統合システム

### MutationObserver拡張

```typescript
private setupMutationObserver(): void {
  this.mutationObserver = new MutationObserver((mutations) => {
    const significantChanges = mutations.filter(mutation => {
      // 重要な変更のみをフィルタリング
      if (mutation.type === 'childList') {
        return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
      }
      if (mutation.type === 'attributes') {
        return ['class', 'style', 'hidden', 'disabled'].includes(mutation.attributeName);
      }
      return false;
    });
    
    if (significantChanges.length > 0) {
      this.handleSignificantDOMChanges(significantChanges);
    }
  });
  
  this.mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true
  });
}
```

### IntersectionObserver統合

```typescript
private setupIntersectionObserver(): void {
  this.intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target;
      const selector = this.generateSelector(element);
      
      if (entry.isIntersecting) {
        // 要素が表示された
        this.recordVisibilityChange(selector, 'visible');
      } else {
        // 要素が非表示になった
        this.recordVisibilityChange(selector, 'hidden');
      }
    });
  }, {
    threshold: [0, 0.1, 0.5, 1.0] // 複数の閾値で監視
  });
}
```

### ResizeObserver統合

```typescript
private setupResizeObserver(): void {
  this.resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target;
      const selector = this.generateSelector(element);
      const rect = entry.contentRect;
      
      this.recordSizeChange(selector, {
        width: rect.width,
        height: rect.height
      });
    });
  });
}
```

## パフォーマンス最適化

### データ量制限

```typescript
private optimizeSnapshot(snapshot: DOMSnapshot): DOMSnapshot {
  return {
    ...snapshot,
    visibleElements: snapshot.visibleElements.slice(0, 100),
    hiddenElements: snapshot.hiddenElements.slice(0, 50),
    formValues: this.limitFormValues(snapshot.formValues)
  };
}

private limitFormValues(formValues: Record<string, string>): Record<string, string> {
  const limited = {};
  let count = 0;
  
  for (const [key, value] of Object.entries(formValues)) {
    if (count >= 20) break; // 最大20個まで
    limited[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
    count++;
  }
  
  return limited;
}
```

### 非同期処理最適化

```typescript
private async captureSnapshotAsync(): Promise<DOMSnapshot> {
  // 重い処理を非同期で実行
  return new Promise((resolve) => {
    requestIdleCallback(() => {
      const snapshot = this.captureSnapshot();
      resolve(this.optimizeSnapshot(snapshot));
    });
  });
}
```

## セキュリティ考慮事項

### 機密情報の保護

```typescript
private sanitizeFormValues(formValues: Record<string, string>): Record<string, string> {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formValues)) {
    // パスワードフィールドのマスキング
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('pass')) {
      sanitized[key] = '********';
    }
    // クレジットカード番号のマスキング
    else if (this.isCreditCardNumber(value)) {
      sanitized[key] = '**** **** **** ' + value.slice(-4);
    }
    // その他の機密情報
    else if (this.isSensitiveData(key, value)) {
      sanitized[key] = '[REDACTED]';
    }
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

## 既存コードとの統合

### BrowserPage.tsxでの実装

```typescript
// apps/app/src/renderer/pages/BrowserPage.tsx
const [uiStateTracker, setUiStateTracker] = useState<AdvancedUIStateTracker | null>(null);

useEffect(() => {
  const webview = webviewRef.current;
  if (webview) {
    const tracker = new AdvancedUIStateTracker(webview);
    setUiStateTracker(tracker);
    
    // セッション開始
    tracker.startSession(`session_${Date.now()}`, 'ブラウザ操作');
    
    return () => {
      tracker.endSession();
    };
  }
}, []);

// 既存のrecordUserAction関数を拡張
const recordUserAction = (type: string, element: any, additionalData = {}) => {
  const actionData = {
    type,
    selector: generateSelector(element),
    text: element.textContent?.trim().substring(0, 50) || '',
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // UI状態追跡システムに記録
  if (uiStateTracker) {
    uiStateTracker.recordTransition(actionData);
  }
  
  // 既存のログ出力も維持
  console.log('[EVENT] USER_ACTION:' + JSON.stringify(actionData));
};
```

この拡張されたUI状態追跡システムにより、動的なWebアプリケーションの状態変化を詳細に記録し、より精密なPlaywrightテストコードの生成が可能になります。
