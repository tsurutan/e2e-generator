# @repo/shared-types

TestPilotアプリケーション全体で使用される共通の型定義とZodスキーマを提供するパッケージです。

## 概要

このパッケージは以下を提供します：

- TypeScript型定義
- Zodバリデーションスキーマ
- API通信用のインターフェース

## インストール

```bash
npm install @repo/shared-types
```

## 使用方法

### 型定義の使用

```typescript
import { DOMSnapshot, TriggerAction, UiStateBase } from '@repo/shared-types';

const snapshot: DOMSnapshot = {
  visibleElements: ['button', 'input'],
  hiddenElements: [],
  formValues: {},
  scrollPosition: { x: 0, y: 0 },
  activeElement: 'button'
};
```

### Zodスキーマの使用

```typescript
import { CreateUiStateRequestSchema, TriggerActionSchema } from '@repo/shared-types';

// バリデーション
const result = CreateUiStateRequestSchema.safeParse(data);
if (result.success) {
  // データが有効
  console.log(result.data);
}
```

### 個別インポート

```typescript
// 型定義のみ
import { DOMSnapshot } from '@repo/shared-types/types';

// スキーマのみ
import { DOMSnapshotSchema } from '@repo/shared-types/schemas';
```

## 提供される型

### UI状態管理
- `DOMSnapshot`: DOM状態のスナップショット
- `TriggerAction`: ユーザーアクション
- `UserIntent`: ユーザー意図
- `OperationGroup`: 操作グループ
- `PerformanceMetrics`: パフォーマンス指標

### API通信
- `CreateOperationSessionRequest`
- `UpdateOperationSessionRequest`
- `OperationSessionResponse`
- `CreateUIStateTransitionRequest`
- `UIStateTransitionResponse`
- `UiStateBase`
- `CreateUiStateRequest`
- `UpdateUiStateRequest`

## 提供されるスキーマ

すべての型に対応するZodスキーマが提供されています：

- `DOMSnapshotSchema`
- `TriggerActionSchema`
- `CreateUiStateRequestSchema`
- `UpdateUiStateRequestSchema`
- `CreateOperationSessionRequestSchema`
- `UpdateOperationSessionRequestSchema`
- など

## 開発

```bash
# ビルド
npm run build

# 開発モード（ウォッチ）
npm run dev

# 型チェック
npm run check-types

# テスト
npm run test
```

## 注意事項

- このパッケージはmonorepo内でのみ使用されます
- 型定義の変更は関連するアプリケーションに影響するため、慎重に行ってください
- 新しい型やスキーマを追加する際は、適切なテストも追加してください
