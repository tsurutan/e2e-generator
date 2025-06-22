// UI状態管理に関する共通型定義

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
    changes: any;
  }>;
}

export interface TriggerAction {
  type: 'click' | 'input' | 'submit' | 'hover' | 'focus' | 'blur' | 'keydown' | 'keyup';
  element: string;
  selector: string;
  text?: string;
  value?: string;
  timestamp: string;
  coordinates?: { x: number; y: number };
  elementSize?: { width: number; height: number };
}

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

export interface PerformanceMetrics {
  domContentLoaded?: number;
  loadComplete?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

// API通信用の型定義
export interface CreateOperationSessionRequest {
  projectId: string;
  userGoal?: string;
}

export interface UpdateOperationSessionRequest {
  endTime?: Date;
  status?: 'active' | 'completed' | 'abandoned';
  summary?: any;
}

export interface CreateUIStateTransitionRequest {
  sessionId: string;
  projectId: string;
  fromUIStateId?: string;
  toUIStateId: string;
  triggerAction: TriggerAction;
  beforeState: DOMSnapshot;
  afterState: DOMSnapshot;
  metadata?: any;
}

export interface OperationSessionResponse {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  userGoal?: string;
  status: string;
  summary?: any;
  transitionCount?: number;
}

export interface UIStateTransitionResponse {
  id: string;
  sessionId: string;
  projectId: string;
  fromUIStateId?: string;
  toUIStateId: string;
  triggerAction: TriggerAction;
  beforeState: DOMSnapshot;
  afterState: DOMSnapshot;
  metadata?: any;
  timestamp: Date;
}

// UiState関連の型
export interface UiStateBase {
  id: string;
  title: string;
  description: string;
  pageUrl: string;
  projectId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUiStateRequest {
  title: string;
  html?: string;
  description: string;
  pageUrl: string;
  projectId: string;
  isDefault?: boolean;
}

export interface UpdateUiStateRequest {
  title?: string;
  description?: string;
  pageUrl?: string;
  isDefault?: boolean;
}
