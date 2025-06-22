# データベース段階的マイグレーション戦略

## 既存スキーマとの互換性を保った段階的拡張

現在のPrismaスキーマを段階的に拡張し、既存機能を壊すことなく新機能を追加します。

## Phase 1: 基本拡張（即座に実装可能）

### 1.1 OperationSession モデル追加

```prisma
// apps/api/prisma/schema.prisma に追加

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

### 1.2 UIStateTransition モデル追加

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

### 1.3 Project モデルの拡張

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
  
  // 🆕 新規リレーション
  operationSessions    OperationSession[]
  uiStateTransitions   UIStateTransition[]

  @@map("projects")
}
```

## Phase 2: 既存モデルの拡張（1-2週間後）

### 2.1 UiState モデルの拡張

```prisma
model UiState {
  id          String   @id @default(uuid())
  title       String
  description String
  pageUrl     String
  projectId   String
  html        String?
  
  // 🆕 新規追加フィールド
  sessionId   String?  // 作成時のセッションID
  domSnapshot Json?    // DOM状態のスナップショット
  viewport    Json?    // { width, height }
  userAgent   String?  // ブラウザ情報
  
  // 既存リレーション
  page        Page     @relation(fields: [pageUrl, projectId], references: [url, projectId])
  project     Project  @relation(fields: [projectId], references: [id])
  fromEdges   Edge[]   @relation("FromUIState")
  toEdges     Edge[]   @relation("ToUIState")
  labels      Label[]
  
  // 🆕 新規リレーション
  fromTransitions UIStateTransition[] @relation("FromTransition")
  toTransitions   UIStateTransition[] @relation("ToTransition")
  
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("ui_states")
}
```

### 2.2 Label モデルの拡張

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
  
  // 🆕 新規追加フィールド
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

## マイグレーションファイル例

### Phase 1 マイグレーション

```sql
-- CreateTable
CREATE TABLE "operation_sessions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "userGoal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_state_transitions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromUIStateId" TEXT,
    "toUIStateId" TEXT NOT NULL,
    "triggerAction" JSONB NOT NULL,
    "beforeState" JSONB NOT NULL,
    "afterState" JSONB NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_state_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operation_sessions_projectId_status_idx" ON "operation_sessions"("projectId", "status");
CREATE INDEX "operation_sessions_startTime_idx" ON "operation_sessions"("startTime");
CREATE INDEX "ui_state_transitions_sessionId_timestamp_idx" ON "ui_state_transitions"("sessionId", "timestamp");
CREATE INDEX "ui_state_transitions_projectId_timestamp_idx" ON "ui_state_transitions"("projectId", "timestamp");

-- AddForeignKey
ALTER TABLE "operation_sessions" ADD CONSTRAINT "operation_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "operation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_fromUIStateId_fkey" FOREIGN KEY ("fromUIStateId") REFERENCES "ui_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_state_transitions" ADD CONSTRAINT "ui_state_transitions_toUIStateId_fkey" FOREIGN KEY ("toUIStateId") REFERENCES "ui_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Phase 2 マイグレーション

```sql
-- AlterTable
ALTER TABLE "ui_states" ADD COLUMN "sessionId" TEXT,
ADD COLUMN "domSnapshot" JSONB,
ADD COLUMN "viewport" JSONB,
ADD COLUMN "userAgent" TEXT;

-- AlterTable
ALTER TABLE "labels" ADD COLUMN "triggerActions" JSONB,
ADD COLUMN "coordinates" JSONB,
ADD COLUMN "elementSize" JSONB,
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isDynamic" BOOLEAN NOT NULL DEFAULT false;
```

## 実装手順

### Step 1: Prismaスキーマ更新
```bash
# apps/api ディレクトリで実行
npx prisma migrate dev --name add_operation_sessions_and_transitions
```

### Step 2: 型定義の更新
```bash
npx prisma generate
```

### Step 3: 新しいサービスメソッドの実装
- `buildEnhancedContext` メソッド
- `generateEnhancedCode` メソッド
- 操作分析関連メソッド

### Step 4: 新しいエンドポイントの追加
- `/scenarios/generate-enhanced-code`
- `/scenarios/session/:sessionId/scenario/:scenarioId/generate-code`
- `/scenarios/:id/analyze-code-quality`

### Step 5: BrowserPage.tsx の統合
- `AdvancedUIStateTracker` の実装
- 既存の `MutationObserver` との置き換え
- セッション管理機能の追加

## 後方互換性の保証

1. **既存エンドポイントの維持**: 既存の `/scenarios/:id/generate-code` は変更なし
2. **段階的移行**: 新機能はオプトイン方式で導入
3. **データ移行**: 既存データは影響を受けない
4. **API バージョニング**: 必要に応じてAPIバージョンを分離

## テスト戦略

1. **既存機能のリグレッションテスト**
2. **新機能の単体テスト**
3. **統合テスト**
4. **パフォーマンステスト**

この段階的アプローチにより、既存システムを壊すことなく、高度なUI状態追跡とコード生成機能を実現できます。
