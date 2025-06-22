# Playwrightコード配布システム

## 概要
生成されたPlaywrightテストコードをサーバー側で一元管理し、クライアントアプリケーションやCI/CDパイプラインからダウンロード・実行できるシステムを構築します。

## 背景・目的

### 現在の課題
- **コード管理の分散**: テストコードがクライアント側に散在
- **バージョン管理の困難**: 更新の配布と同期が困難
- **セキュリティリスク**: 機密情報がクライアント側に保存される
- **チーム協業の制限**: コード共有とレビューが困難

### 目的
- **コード管理の一元化**: テストコードのバージョン管理と配布の効率化
- **セキュリティの向上**: 機密情報をローカル環境に分離
- **CI/CD統合**: 継続的インテグレーション環境での自動テスト実行
- **チーム協業**: 複数の開発者間でのテストコード共有

## システムアーキテクチャ

### 全体構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TestPilot     │    │   TestPilot     │    │   CI/CD         │
│   Client App    │    │   API Server    │    │   Pipeline      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Code Runner  │◄├────┤ │Code Manager │ ├────┤►│Test Runner  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Local Config │ │    │ │Version Ctrl │ │    │ │Environment  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### コンポーネント詳細

#### 1. サーバー側（TestPilot API Server）
- **Code Manager**: テストコードの保存・管理
- **Version Control**: バージョン管理とリリース制御
- **Access Control**: 認証・認可システム
- **Distribution API**: コード配布エンドポイント

#### 2. クライアント側（TestPilot Client App）
- **Code Runner**: ダウンロードしたコードの実行
- **Local Config**: ローカル環境設定の管理
- **Cache Manager**: ローカルキャッシュの管理
- **Sync Manager**: サーバーとの同期処理

#### 3. CI/CD統合
- **Test Runner**: 自動テスト実行
- **Environment**: 実行環境の設定
- **Report Generator**: テスト結果の生成・送信

## 技術仕様

### API エンドポイント設計

#### テストコード取得
```typescript
// 特定シナリオのコード取得
GET /api/playwright/code/:scenarioId
Response: {
  id: string;
  scenarioId: string;
  code: string;
  version: string;
  dependencies: string[];
  metadata: CodeMetadata;
}

// プロジェクト全体のコード取得
GET /api/playwright/code/project/:projectId
Response: {
  projectId: string;
  scenarios: PlaywrightCode[];
  globalConfig: GlobalConfig;
  dependencies: ProjectDependencies;
}

// 機能単位のコード取得
GET /api/playwright/code/feature/:featureId
Response: {
  featureId: string;
  scenarios: PlaywrightCode[];
  sharedSteps: SharedStep[];
}
```

#### テストコード管理
```typescript
// コード保存・更新
POST /api/playwright/code/:scenarioId
Request: {
  code: string;
  uiStates?: UIState[];
  dependencies?: string[];
  metadata?: CodeMetadata;
}

// コード削除
DELETE /api/playwright/code/:scenarioId

// バージョン履歴取得
GET /api/playwright/versions/:scenarioId
Response: {
  versions: Array<{
    version: string;
    createdAt: string;
    author: string;
    changes: string;
  }>;
}
```

#### 実行結果管理
```typescript
// テスト結果送信
POST /api/playwright/results
Request: {
  scenarioId: string;
  version: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors?: string[];
  screenshots?: string[];
  environment: EnvironmentInfo;
}

// 実行統計取得
GET /api/playwright/stats/:projectId
Response: {
  totalTests: number;
  passRate: number;
  avgDuration: number;
  recentRuns: TestRun[];
}
```

### データモデル

#### PlaywrightCode テーブル
```sql
CREATE TABLE playwright_codes (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id),
  code TEXT NOT NULL,
  version VARCHAR(50) NOT NULL,
  ui_states JSONB, -- 関連するUI状態情報
  dependencies JSONB, -- 依存関係（他のシナリオ、ペルソナ等）
  metadata JSONB, -- 実行環境、設定等
  author_id UUID, -- 作成者
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(scenario_id, version),
  INDEX idx_scenario_version (scenario_id, version),
  INDEX idx_created_at (created_at)
);
```

#### TestRun テーブル
```sql
CREATE TABLE test_runs (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id),
  code_version VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  duration INTEGER, -- ミリ秒
  errors JSONB,
  screenshots JSONB,
  environment JSONB,
  executed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_scenario_status (scenario_id, status),
  INDEX idx_executed_at (executed_at)
);
```

### セキュリティ設計

#### 認証・認可
```typescript
interface AuthConfig {
  apiKey: string; // プロジェクト固有のAPIキー
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
    admin: boolean;
  };
  rateLimit: {
    requests: number;
    window: number; // 秒
  };
}
```

#### 環境分離
```typescript
// .env.local (クライアント側)
TESTPILOT_API_URL=https://api.testpilot.com
TESTPILOT_API_KEY=your-project-api-key
TESTPILOT_PROJECT_ID=your-project-id

// 機密情報（テスト対象アプリの認証情報等）
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=secure-password
DATABASE_URL=postgresql://localhost:5432/test_db
```

## クライアント側実装

### コードダウンロード機能
```typescript
class PlaywrightCodeManager {
  private cache: Map<string, CachedCode> = new Map();
  
  async downloadCode(scenarioId: string): Promise<PlaywrightCode> {
    // キャッシュチェック
    const cached = this.cache.get(scenarioId);
    if (cached && !this.isExpired(cached)) {
      return cached.code;
    }
    
    // サーバーから最新版を取得
    const response = await fetch(`${API_URL}/playwright/code/${scenarioId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    const code = await response.json();
    this.cache.set(scenarioId, { code, timestamp: Date.now() });
    
    return code;
  }
  
  async executeCode(scenarioId: string, localConfig: LocalConfig): Promise<TestResult> {
    const code = await this.downloadCode(scenarioId);
    const enrichedCode = this.injectLocalConfig(code, localConfig);
    
    return await this.runPlaywright(enrichedCode);
  }
}
```

### ローカル設定管理
```typescript
interface LocalConfig {
  environment: 'development' | 'staging' | 'production';
  baseUrl: string;
  credentials: {
    [persona: string]: {
      email: string;
      password: string;
    };
  };
  timeouts: {
    default: number;
    navigation: number;
    element: number;
  };
  browser: {
    headless: boolean;
    viewport: { width: number; height: number };
  };
}
```

## CI/CD統合

### GitHub Actions テンプレート
```yaml
name: TestPilot E2E Tests
on: 
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # 毎日午前2時に実行

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Playwright
        run: |
          npm install -g @playwright/test
          npx playwright install
          
      - name: Download TestPilot Tests
        run: |
          curl -H "Authorization: Bearer ${{ secrets.TESTPILOT_API_KEY }}" \
               "${{ secrets.TESTPILOT_API_URL }}/api/playwright/code/project/${{ secrets.TESTPILOT_PROJECT_ID }}" \
               -o testpilot-tests.json
               
      - name: Generate Test Files
        run: |
          node scripts/generate-tests.js testpilot-tests.json
          
      - name: Run Tests
        run: |
          npx playwright test --browser=${{ matrix.browser }}
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          
      - name: Upload Results
        if: always()
        run: |
          curl -X POST "${{ secrets.TESTPILOT_API_URL }}/api/playwright/results" \
               -H "Authorization: Bearer ${{ secrets.TESTPILOT_API_KEY }}" \
               -H "Content-Type: application/json" \
               -d @test-results.json
               
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots-${{ matrix.browser }}
          path: test-results/screenshots/
```

### Jenkins Pipeline
```groovy
pipeline {
    agent any
    
    environment {
        TESTPILOT_API_KEY = credentials('testpilot-api-key')
        TESTPILOT_API_URL = 'https://api.testpilot.com'
        TESTPILOT_PROJECT_ID = credentials('testpilot-project-id')
    }
    
    stages {
        stage('Download Tests') {
            steps {
                script {
                    sh """
                        curl -H "Authorization: Bearer ${TESTPILOT_API_KEY}" \
                             "${TESTPILOT_API_URL}/api/playwright/code/project/${TESTPILOT_PROJECT_ID}" \
                             -o testpilot-tests.json
                    """
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Chrome') {
                    steps {
                        sh 'npx playwright test --browser=chromium'
                    }
                }
                stage('Firefox') {
                    steps {
                        sh 'npx playwright test --browser=firefox'
                    }
                }
            }
        }
        
        stage('Upload Results') {
            steps {
                script {
                    sh """
                        curl -X POST "${TESTPILOT_API_URL}/api/playwright/results" \
                             -H "Authorization: Bearer ${TESTPILOT_API_KEY}" \
                             -H "Content-Type: application/json" \
                             -d @test-results.json
                    """
                }
            }
        }
    }
}
```

## 実装タスク

### フェーズ1: サーバー側基盤（3-4週間）
- [ ] データベーススキーマ設計・実装
- [ ] 基本API エンドポイント開発
- [ ] 認証・認可システム実装
- [ ] バージョン管理システム構築

### フェーズ2: クライアント側統合（3-4週間）
- [ ] コードダウンロード機能実装
- [ ] ローカル設定管理システム
- [ ] キャッシュ機能実装
- [ ] 実行エンジン統合

### フェーズ3: CI/CD統合（2-3週間）
- [ ] GitHub Actions テンプレート作成
- [ ] Jenkins Pipeline テンプレート作成
- [ ] 結果レポート機能実装
- [ ] 統計・分析機能開発

### フェーズ4: セキュリティ・最適化（2週間）
- [ ] セキュリティ監査・強化
- [ ] パフォーマンス最適化
- [ ] ドキュメント・使用例作成
- [ ] 運用監視機能実装

## 運用考慮事項

### 監視・ログ
- API使用量の監視
- エラー率の追跡
- パフォーマンスメトリクス
- セキュリティイベントの記録

### バックアップ・復旧
- コードの定期バックアップ
- バージョン履歴の保持
- 災害復旧計画
- データ整合性チェック

### スケーラビリティ
- 水平スケーリング対応
- CDN活用によるコード配布最適化
- データベースパーティショニング
- キャッシュ戦略の最適化

## 関連ドキュメント
- [Playwrightテストコード生成精度向上](playwright-code-generation-improvement.md)
- [UI状態管理システム](ui-state-management-system.md)
- [仕様書](../SPECIFICATION.md)
- [README.md](../../README.md)
