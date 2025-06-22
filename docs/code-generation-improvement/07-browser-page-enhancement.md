# BrowserPage.tsx 改善実装提案

## 現在の実装の課題

現在のBrowserPage.tsxは基本的な機能は実装されていますが、以下の改善が必要です：

1. **操作セッション管理の不足**: 関連する操作をグループ化していない
2. **詳細な状態追跡の不足**: DOM変更の before/after 状態が詳細に記録されていない
3. **操作意図の推定不足**: ユーザーの目標や意図が考慮されていない
4. **パフォーマンス情報の不足**: 読み込み時間やネットワーク情報が記録されていない

## 改善実装案

### 1. 拡張されたUIStateTracker クラス

```typescript
// apps/app/src/renderer/utils/UIStateTracker.ts
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

export interface TriggerAction {
  type: 'click' | 'input' | 'hover' | 'keypress' | 'scroll' | 'focus' | 'blur' | 'submit';
  element: string;
  value?: string;
  coordinates?: { x: number; y: number };
  timestamp: string;
  modifiers?: string[];
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
  
  private captureSnapshot(): DOMSnapshot {
    return this.webview.executeJavaScript(`
      (() => {
        const visibleElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map(el => this.generateSelector(el))
          .slice(0, 100); // 最大100要素まで
        
        const hiddenElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'none' || style.visibility === 'hidden';
          })
          .map(el => this.generateSelector(el))
          .slice(0, 50); // 最大50要素まで
        
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
  
  private calculateStateDiff(before: DOMSnapshot, after: DOMSnapshot): Partial<DOMSnapshot> {
    const newElements = after.visibleElements.filter(el => !before.visibleElements.includes(el));
    const removedElements = before.visibleElements.filter(el => !after.visibleElements.includes(el));
    
    const modifiedElements = [];
    // フォーム値の変更を検出
    for (const [key, afterValue] of Object.entries(after.formValues)) {
      const beforeValue = before.formValues[key];
      if (beforeValue !== afterValue) {
        modifiedElements.push({
          selector: `[name="${key}"], #${key}`,
          changes: { value: { from: beforeValue, to: afterValue } }
        });
      }
    }
    
    return {
      newElements,
      removedElements,
      modifiedElements
    };
  }
  
  private captureMetadata() {
    return {
      userAgent: navigator.userAgent,
      viewport: { 
        width: window.innerWidth, 
        height: window.innerHeight 
      },
      loadTime: performance.now(),
      performanceMetrics: {
        domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
      }
    };
  }
  
  private setupObservers(): void {
    // MutationObserver for DOM changes
    this.mutationObserver = new MutationObserver((mutations) => {
      // 重要な変更のみを記録
      const significantChanges = mutations.filter(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (significantChanges.length > 0) {
        // DOM変更を検出したら状態をキャプチャ
        this.recordDOMChange(significantChanges);
      }
    });
    
    // IntersectionObserver for visibility changes
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 要素が表示された
          this.recordVisibilityChange(entry.target, 'visible');
        } else {
          // 要素が非表示になった
          this.recordVisibilityChange(entry.target, 'hidden');
        }
      });
    });
    
    // ResizeObserver for element size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        this.recordSizeChange(entry.target, entry.contentRect);
      });
    });
  }
  
  private recordDOMChange(mutations: MutationRecord[]): void {
    // DOM変更の詳細を記録
    console.log('[UI_STATE_TRACKER] DOM changes detected:', mutations.length);
  }
  
  private recordVisibilityChange(element: Element, state: 'visible' | 'hidden'): void {
    // 可視性変更を記録
    console.log('[UI_STATE_TRACKER] Visibility change:', element, state);
  }
  
  private recordSizeChange(element: Element, rect: DOMRectReadOnly): void {
    // サイズ変更を記録
    console.log('[UI_STATE_TRACKER] Size change:', element, rect);
  }
}
```

### 2. 操作意図推定システム

```typescript
// apps/app/src/renderer/utils/OperationSemanticAnalyzer.ts
export interface UserIntent {
  goal: string;
  confidence: number;
  category: 'authentication' | 'navigation' | 'data_entry' | 'search' | 'purchase' | 'other';
}

export interface OperationGroup {
  id: string;
  operations: TriggerAction[];
  intent: UserIntent;
  startTime: string;
  endTime: string;
  success: boolean;
}

export class OperationSemanticAnalyzer {
  private operationBuffer: TriggerAction[] = [];
  private readonly OPERATION_TIMEOUT = 5000; // 5秒
  
  analyzeUserIntent(operations: TriggerAction[]): UserIntent {
    // 操作パターンから意図を推定
    const selectors = operations.map(op => op.element.toLowerCase());
    const types = operations.map(op => op.type);
    
    // ログインパターンの検出
    if (this.detectLoginPattern(selectors, types)) {
      return {
        goal: 'ユーザーログイン',
        confidence: 0.9,
        category: 'authentication'
      };
    }
    
    // 検索パターンの検出
    if (this.detectSearchPattern(selectors, types)) {
      return {
        goal: 'コンテンツ検索',
        confidence: 0.8,
        category: 'search'
      };
    }
    
    // フォーム入力パターンの検出
    if (this.detectFormPattern(selectors, types)) {
      return {
        goal: 'データ入力・送信',
        confidence: 0.7,
        category: 'data_entry'
      };
    }
    
    return {
      goal: '一般的な操作',
      confidence: 0.5,
      category: 'other'
    };
  }
  
  private detectLoginPattern(selectors: string[], types: string[]): boolean {
    const hasEmailInput = selectors.some(s => 
      s.includes('email') || s.includes('username') || s.includes('login')
    );
    const hasPasswordInput = selectors.some(s => 
      s.includes('password') || s.includes('pass')
    );
    const hasSubmit = types.includes('submit') || selectors.some(s => 
      s.includes('login') || s.includes('signin') || s.includes('submit')
    );
    
    return hasEmailInput && hasPasswordInput && hasSubmit;
  }
  
  private detectSearchPattern(selectors: string[], types: string[]): boolean {
    const hasSearchInput = selectors.some(s => 
      s.includes('search') || s.includes('query') || s.includes('q')
    );
    const hasSearchAction = types.includes('submit') || selectors.some(s => 
      s.includes('search') || s.includes('find')
    );
    
    return hasSearchInput && hasSearchAction;
  }
  
  private detectFormPattern(selectors: string[], types: string[]): boolean {
    const inputCount = types.filter(t => t === 'input').length;
    const hasSubmit = types.includes('submit');
    
    return inputCount >= 2 && hasSubmit;
  }
  
  groupRelatedOperations(operations: TriggerAction[]): OperationGroup[] {
    const groups: OperationGroup[] = [];
    let currentGroup: TriggerAction[] = [];
    let lastTimestamp = 0;
    
    for (const operation of operations) {
      const timestamp = new Date(operation.timestamp).getTime();
      
      // タイムアウトまたは新しいページ遷移で新しいグループを開始
      if (timestamp - lastTimestamp > this.OPERATION_TIMEOUT || currentGroup.length === 0) {
        if (currentGroup.length > 0) {
          groups.push(this.createOperationGroup(currentGroup));
        }
        currentGroup = [operation];
      } else {
        currentGroup.push(operation);
      }
      
      lastTimestamp = timestamp;
    }
    
    if (currentGroup.length > 0) {
      groups.push(this.createOperationGroup(currentGroup));
    }
    
    return groups;
  }
  
  private createOperationGroup(operations: TriggerAction[]): OperationGroup {
    const intent = this.analyzeUserIntent(operations);
    
    return {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operations,
      intent,
      startTime: operations[0].timestamp,
      endTime: operations[operations.length - 1].timestamp,
      success: this.determineSuccess(operations, intent)
    };
  }
  
  private determineSuccess(operations: TriggerAction[], intent: UserIntent): boolean {
    // 意図に基づいて成功を判定
    switch (intent.category) {
      case 'authentication':
        // ログイン後のページ遷移があるかチェック
        return operations.some(op => op.type === 'submit');
      case 'data_entry':
        // フォーム送信があるかチェック
        return operations.some(op => op.type === 'submit');
      default:
        return true;
    }
  }
}
```
