# 拡張データベーススキーマ提案

## 現在のスキーマの課題

現在のPrismaスキーマは基本的なUI状態管理には対応していますが、以下の点で改善が必要です：

1. **操作セッション管理の不足**: 関連する操作をグループ化する仕組みがない
2. **詳細な状態変遷記録の不足**: DOM変更の詳細な before/after 状態が記録されない
3. **トリガーアクション情報の不足**: 操作の詳細情報（座標、値など）が記録されない
4. **パフォーマンス情報の不足**: 読み込み時間、ネットワークリクエストなどが記録されない

## 拡張スキーマ提案

### 1. OperationSession モデル（新規追加）

```prisma
model OperationSession {
  id          String    @id @default(uuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  startTime   DateTime  @default(now())
  endTime     DateTime?
  userGoal    String?   // ユーザーが達成しようとしている目標
  status      String    @default("active") // active, completed, abandoned
  summary     Json?     // 総アクション数、ユニーク要素数、エラー数など
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // リレーション
  uiStateTransitions UIStateTransition[]
  
  @@map("operation_sessions")
}
```

### 2. UIStateTransition モデル（新規追加）

```prisma
model UIStateTransition {
  id                String           @id @default(uuid())
  sessionId         String
  session           OperationSession @relation(fields: [sessionId], references: [id])
  projectId         String
  project           Project          @relation(fields: [projectId], references: [id])
  fromUIStateId     String?
  fromUIState       UiState?         @relation(fields: [fromUIStateId], references: [id], name: "FromTransition")
  toUIStateId       String
  toUIState         UiState          @relation(fields: [toUIStateId], references: [id], name: "ToTransition")
  
  // トリガー情報
  triggerAction     Json             // { type, element, value, coordinates, timestamp }
  
  // 状態情報
  beforeState       Json             // DOM状態のスナップショット
  afterState        Json             // 変更後のDOM状態
  
  // メタデータ
  metadata          Json?            // userAgent, viewport, loadTime, networkRequests
  
  timestamp         DateTime         @default(now())
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  @@map("ui_state_transitions")
}
```

### 3. 既存UiStateモデルの拡張

```prisma
model UiState {
  id          String   @id @default(uuid())
  title       String
  description String
  pageUrl     String
  projectId   String
  html        String?
  
  // 新規追加フィールド
  sessionId   String?  // 作成時のセッションID
  domSnapshot Json?    // DOM状態のスナップショット
  viewport    Json?    // { width, height }
  userAgent   String?  // ブラウザ情報
  
  // リレーション
  page        Page     @relation(fields: [pageUrl, projectId], references: [url, projectId])
  project     Project  @relation(fields: [projectId], references: [id])
  fromEdges   Edge[]   @relation("FromUIState")
  toEdges     Edge[]   @relation("ToUIState")
  labels      Label[]
  
  // 新規リレーション
  fromTransitions UIStateTransition[] @relation("FromTransition")
  toTransitions   UIStateTransition[] @relation("ToTransition")
  
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("ui_states")
}
```

### 4. 既存Labelモデルの拡張

```prisma
model Label {
  id            String   @id @default(uuid())
  name          String   @db.VarChar(100)
  description   String?
  selector      String
  elementText   String?
  url           String
  uiStateId     String
  uiState       UiState  @relation(fields: [uiStateId], references: [id])
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id])
  
  // 新規追加フィールド
  triggerActions Json?   // トリガーアクションの配列
  coordinates   Json?    // { x, y } 要素の位置
  elementSize   Json?    // { width, height } 要素のサイズ
  isVisible     Boolean  @default(true)
  isDynamic     Boolean  @default(false) // 動的に表示される要素かどうか
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("labels")
}
```

### 5. Projectモデルの拡張

```prisma
model Project {
  id          String    @id @default(uuid())
  name        String    @db.VarChar(100)
  url         String
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 既存リレーション
  features    Feature[]
  labels      Label[]
  personas    Persona[]
  pages       Page[]
  edges       Edge[]
  uiStates    UiState[]
  
  // 新規リレーション
  operationSessions    OperationSession[]
  uiStateTransitions   UIStateTransition[]

  @@map("projects")
}
```

## マイグレーション戦略

### フェーズ1: 基本拡張
1. OperationSession モデルの追加
2. UIStateTransition モデルの追加
3. 既存モデルへの基本フィールド追加

### フェーズ2: 詳細拡張
1. JSON フィールドの詳細スキーマ定義
2. インデックスの最適化
3. パフォーマンステストと調整

### フェーズ3: 高度な機能
1. 分析用ビューの作成
2. データ圧縮・アーカイブ機能
3. リアルタイム分析機能

## JSON フィールドの構造例

### triggerAction
```json
{
  "type": "click",
  "element": "button.submit-btn",
  "value": null,
  "coordinates": { "x": 150, "y": 300 },
  "timestamp": "2024-01-01T12:00:00Z",
  "modifiers": ["ctrl"]
}
```

### beforeState / afterState
```json
{
  "visibleElements": ["#header", ".main-content", "button.submit"],
  "hiddenElements": [".loading-spinner"],
  "formValues": {
    "input[name='email']": "user@example.com",
    "input[name='password']": "********"
  },
  "scrollPosition": { "x": 0, "y": 150 },
  "activeElement": "input[name='email']",
  "newElements": [".success-message"],
  "removedElements": [".error-message"],
  "modifiedElements": [
    {
      "selector": "button.submit",
      "changes": {
        "disabled": false,
        "textContent": "送信完了"
      }
    }
  ]
}
```

### metadata
```json
{
  "userAgent": "Mozilla/5.0...",
  "viewport": { "width": 1920, "height": 1080 },
  "loadTime": 1250,
  "networkRequests": [
    "POST /api/login",
    "GET /api/user/profile"
  ],
  "performanceMetrics": {
    "domContentLoaded": 800,
    "firstPaint": 600,
    "largestContentfulPaint": 1100
  }
}
```
