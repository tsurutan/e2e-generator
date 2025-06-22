# データベーススキーマ拡張タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](../../DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 🚨 実装開始前の必須チェック（Rule 10）
- [ ] **テスト設計**: テストケースが全て定義済み（it.todoでも可）
- [ ] **型定義確認**: Prisma型・共通型の再利用を確認
- [ ] **技術選択**: tRPC・共通パッケージの使用を確認
- [ ] **依存関係**: 前提タスクと影響範囲を確認

### 🚨 テストファースト開発（Rule 12）
- [ ] **実装前**: 必ずテストファイルを作成
- [ ] **テスト網羅**: 正常系・異常系・境界値を網羅
- [ ] **TDD実践**: Red→Green→Refactorサイクル

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- テストケース名は日本語で記述

## Phase 1: 基本拡張（即座に実装可能）

### Task 1.1: OperationSession モデル追加
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [x] Prismaスキーマに`OperationSession`モデルを追加
- [x] 以下のフィールドを含める：
  - `id`: String (UUID)
  - `projectId`: String (外部キー)
  - `startTime`: DateTime
  - `endTime`: DateTime?
  - `userGoal`: String?
  - `status`: String (active/completed/abandoned)
  - `summary`: Json?

#### 実装ファイル
- `apps/api/prisma/schema.prisma`

#### 検証方法
- [x] `npx prisma validate`でスキーマ検証
- [x] マイグレーション生成確認
- [x] 型定義生成確認

---

### Task 1.2: UIStateTransition モデル追加
**優先度**: 🔴 高
**期間**: 1-2日
**担当者**: バックエンド開発者

#### 実装内容
- [x] Prismaスキーマに`UIStateTransition`モデルを追加
- [x] 以下のフィールドを含める：
  - `id`: String (UUID)
  - `sessionId`: String (外部キー)
  - `projectId`: String (外部キー)
  - `fromUIStateId`: String? (外部キー)
  - `toUIStateId`: String (外部キー)
  - `triggerAction`: Json
  - `beforeState`: Json
  - `afterState`: Json
  - `metadata`: Json?
  - `timestamp`: DateTime

#### 実装ファイル
- `apps/api/prisma/schema.prisma`

#### 検証方法
- [x] リレーション設定の確認
- [x] インデックス設定の確認
- [x] 外部キー制約の確認

---

### Task 1.3: Project モデルの拡張
**優先度**: 🔴 高
**期間**: 0.5日
**担当者**: バックエンド開発者

#### 実装内容
- [x] 既存`Project`モデルに新しいリレーションを追加
- [x] `operationSessions`リレーション追加
- [x] `uiStateTransitions`リレーション追加

#### 実装ファイル
- `apps/api/prisma/schema.prisma`

#### 検証方法
- [x] 既存リレーションが壊れていないことを確認
- [x] 新しいリレーションが正しく設定されていることを確認

---

### Task 1.4: マイグレーション実行
**優先度**: 🔴 高
**期間**: 0.5日
**担当者**: バックエンド開発者

#### 実装内容
- [x] マイグレーションファイル生成
- [x] 開発環境でのマイグレーション実行
- [x] 型定義の更新

#### 実行コマンド
```bash
cd apps/api
npx prisma migrate dev --name add_operation_sessions_and_transitions
npx prisma generate
```

#### 検証方法
- [x] データベースにテーブルが作成されていることを確認
- [x] 型定義ファイルが更新されていることを確認
- [x] 既存データが影響を受けていないことを確認

---

## Phase 2: 既存モデルの拡張（1-2週間後）

### Task 2.1: UiState モデルの拡張
**優先度**: 🟡 中
**期間**: 1日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 既存`UiState`モデルに新しいフィールドを追加
- [ ] `sessionId`: String? (オプション)
- [ ] `domSnapshot`: Json? (DOM状態のスナップショット)
- [ ] `viewport`: Json? (ビューポート情報)
- [ ] `userAgent`: String? (ブラウザ情報)
- [ ] 新しいリレーション追加：
  - `fromTransitions`: UIStateTransition[]
  - `toTransitions`: UIStateTransition[]

#### 実装ファイル
- `apps/api/prisma/schema.prisma`

#### 検証方法
- [ ] 既存のUiStateデータが影響を受けないことを確認
- [ ] 新しいフィールドがオプションとして正しく設定されていることを確認

---

### Task 2.2: Label モデルの拡張
**優先度**: 🟡 中
**期間**: 1日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] 既存`Label`モデルに新しいフィールドを追加
- [ ] `triggerActions`: Json? (トリガーアクション情報)
- [ ] `coordinates`: Json? (要素の位置情報)
- [ ] `elementSize`: Json? (要素のサイズ情報)
- [ ] `isVisible`: Boolean (可視性フラグ)
- [ ] `isDynamic`: Boolean (動的要素フラグ)

#### 実装ファイル
- `apps/api/prisma/schema.prisma`

#### 検証方法
- [ ] 既存のLabelデータが影響を受けないことを確認
- [ ] デフォルト値が正しく設定されていることを確認

---

### Task 2.3: インデックス最適化
**優先度**: 🟡 中
**期間**: 0.5日
**担当者**: バックエンド開発者

#### 実装内容
- [ ] パフォーマンス向上のためのインデックス追加
- [ ] `operation_sessions_projectId_status_idx`
- [ ] `operation_sessions_startTime_idx`
- [ ] `ui_state_transitions_sessionId_timestamp_idx`
- [ ] `ui_state_transitions_projectId_timestamp_idx`

#### 実装ファイル
- マイグレーションファイル

#### 検証方法
- [ ] クエリパフォーマンスの測定
- [ ] インデックスが正しく作成されていることを確認

---

## 関連タスク

### Task 3.1: 型定義ファイルの作成
**優先度**: 🔴 高
**期間**: 1日
**担当者**: フロントエンド・バックエンド開発者

#### 実装内容
- [x] TypeScript型定義ファイルの作成
- [x] `OperationSession`型
- [x] `UIStateTransition`型
- [x] `DOMSnapshot`型
- [x] `TriggerAction`型
- [x] `UserIntent`型

#### 実装ファイル
- `apps/api/src/types/ui-state.types.ts`
- `apps/app/src/types/ui-state.types.ts`

---

### Task 3.2: 基本CRUD API実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: バックエンド開発者

#### 実装内容
- [x] `OperationSession`のCRUD操作
- [x] `UIStateTransition`のCRUD操作
- [x] 基本的なクエリメソッド
- [x] エラーハンドリング

#### 実装ファイル
- `apps/api/src/operation-sessions/operation-sessions.service.ts`
- `apps/api/src/ui-state-transitions/ui-state-transitions.service.ts`

---

## 完了基準

### Phase 1完了基準
- [x] 新しいテーブルが正常に作成されている
- [x] 既存機能が正常に動作している
- [x] 基本的なCRUD操作が実装されている
- [x] 型定義が正しく生成されている

### Phase 2完了基準
- [ ] 既存モデルの拡張が完了している
- [ ] データ整合性が保たれている
- [ ] パフォーマンスが劣化していない
- [ ] 全てのテストが通過している

## リスク管理

### 高リスク項目
1. **データ整合性**: 既存データとの互換性
2. **パフォーマンス**: 大量データ処理時の性能
3. **マイグレーション**: 本番環境での安全な実行

### 軽減策
1. **段階的実装**: 小さな変更を積み重ねる
2. **十分なテスト**: 各段階での包括的テスト
3. **ロールバック計画**: 問題発生時の迅速な復旧

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `02-browser-page-enhancement-tasks.md`
- `03-api-enhancement-tasks.md`
