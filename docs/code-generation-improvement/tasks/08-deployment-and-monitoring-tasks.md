# デプロイメント・監視タスク

## ⚠️ 開発共通ルール
**このタスクを実行する前に、必ず [`DEVELOPMENT_RULES.md`](../../DEVELOPMENT_RULES.md) を読み、全てのルールに従ってください。**

### 特に重要なルール
- 各実装完了後に `npm run check-types`, `npm run lint`, `npm run test` が全て通ること
- ファイルが600行を超えたらリファクタリング実行
- DRY原則の徹底
- 新機能には必ずテストケースを作成
- テストケース名は日本語で記述

## Phase 1: 本番環境準備

### Task 8.1: 本番環境セットアップ
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: DevOpsエンジニア・インフラエンジニア

#### 実装内容
- [ ] 本番データベース環境の構築
- [ ] API サーバーの本番環境構築
- [ ] Electron アプリの配布準備
- [ ] 環境変数の設定
- [ ] セキュリティ設定の確認

#### 実装ファイル
- `apps/api/docker-compose.prod.yml`
- `apps/api/.env.production`
- `apps/app/electron-builder.config.js`

#### 実装詳細
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

```javascript
// electron-builder.config.js
module.exports = {
  appId: "com.testpilot.app",
  productName: "TestPilot",
  directories: {
    output: "dist"
  },
  files: [
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  mac: {
    category: "public.app-category.developer-tools",
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"]
      }
    ]
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ]
  },
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64"]
      }
    ]
  },
  publish: {
    provider: "github",
    owner: "your-org",
    repo: "testpilot"
  }
};
```

#### 検証方法
- [ ] 本番環境でアプリケーションが正常に起動することを確認
- [ ] データベース接続が正常であることを確認
- [ ] SSL証明書が正しく設定されていることを確認

---

### Task 8.2: データベースマイグレーション実行
**優先度**: 🔴 高
**期間**: 1日
**担当者**: バックエンド開発者・DevOpsエンジニア

#### 実装内容
- [ ] 本番データベースマイグレーション計画
- [ ] バックアップ戦略の実装
- [ ] マイグレーション実行スクリプト
- [ ] ロールバック計画

#### 実装ファイル
- `apps/api/scripts/migrate-production.sh`
- `apps/api/scripts/backup-database.sh`
- `apps/api/scripts/rollback-migration.sh`

#### 実装詳細
```bash
#!/bin/bash
# migrate-production.sh

set -e

echo "Starting production database migration..."

# 1. データベースバックアップ
echo "Creating database backup..."
./scripts/backup-database.sh

# 2. マイグレーション実行前チェック
echo "Checking migration status..."
npx prisma migrate status

# 3. マイグレーション実行
echo "Running migrations..."
npx prisma migrate deploy

# 4. データ整合性チェック
echo "Verifying data integrity..."
npm run verify-data-integrity

# 5. 型定義更新
echo "Generating Prisma client..."
npx prisma generate

echo "Migration completed successfully!"
```

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

echo "Creating backup: ${BACKUP_FILE}"

pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    
    # 古いバックアップファイルの削除（7日以上古いもの）
    find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
else
    echo "Backup failed!"
    exit 1
fi
```

#### 検証方法
- [ ] マイグレーションが正常に完了することを確認
- [ ] データ整合性が保たれていることを確認
- [ ] ロールバック手順が正常に動作することを確認

---

### Task 8.3: CI/CDパイプライン構築
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: DevOpsエンジニア

#### 実装内容
- [ ] GitHub Actions ワークフローの設定
- [ ] 自動テスト実行
- [ ] 自動デプロイメント
- [ ] 品質ゲートの設定

#### 実装ファイル
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/release.yml`

#### 実装詳細
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testpilot_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testpilot_test
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testpilot_test
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build API
      run: npm run build:api
    
    - name: Build App
      run: npm run build:app
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-artifacts
        path: |
          apps/api/dist
          apps/app/dist
```

#### 検証方法
- [ ] CI パイプラインが正常に実行されることを確認
- [ ] 全てのテストが通過することを確認
- [ ] ビルドが成功することを確認

---

## Phase 2: 監視システム実装

### Task 8.4: アプリケーション監視実装
**優先度**: 🔴 高
**期間**: 2-3日
**担当者**: DevOpsエンジニア・バックエンド開発者

#### 実装内容
- [ ] ログ収集システムの構築
- [ ] メトリクス監視の実装
- [ ] アラート設定
- [ ] ダッシュボード構築

#### 実装ファイル
- `apps/api/src/monitoring/logger.service.ts`
- `apps/api/src/monitoring/metrics.service.ts`
- `docker-compose.monitoring.yml`

#### 実装詳細
```typescript
// logger.service.ts
import { Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class LoggerService {
  private logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    defaultMeta: { service: 'testpilot-api' },
    transports: [
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      })
    ]
  });

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
}
```

```typescript
// metrics.service.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private codeGenerationCounter = new Counter({
    name: 'code_generation_total',
    help: 'Total number of code generations',
    labelNames: ['status', 'project_id']
  });

  private codeGenerationDuration = new Histogram({
    name: 'code_generation_duration_seconds',
    help: 'Duration of code generation in seconds',
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  });

  private activeSessionsGauge = new Gauge({
    name: 'active_sessions_total',
    help: 'Number of active user sessions'
  });

  recordCodeGeneration(status: 'success' | 'error', projectId: string, duration: number) {
    this.codeGenerationCounter.inc({ status, project_id: projectId });
    this.codeGenerationDuration.observe(duration);
  }

  setActiveSessions(count: number) {
    this.activeSessionsGauge.set(count);
  }

  getMetrics() {
    return register.metrics();
  }
}
```

#### 検証方法
- [ ] ログが正常に収集されることを確認
- [ ] メトリクスが正確に記録されることを確認
- [ ] アラートが適切に発火することを確認

---

### Task 8.5: パフォーマンス監視実装
**優先度**: 🟡 中
**期間**: 2日
**担当者**: DevOpsエンジニア

#### 実装内容
- [ ] APM（Application Performance Monitoring）の導入
- [ ] データベースパフォーマンス監視
- [ ] リソース使用量監視
- [ ] ユーザーエクスペリエンス監視

#### 実装ファイル
- `apps/api/src/monitoring/apm.service.ts`
- `monitoring/grafana/dashboards/`

#### 実装詳細
```typescript
// apm.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class APMService {
  private performanceMetrics = new Map<string, PerformanceEntry[]>();

  startTransaction(name: string): Transaction {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    return {
      name,
      startTime,
      startMemory,
      end: (status: 'success' | 'error' = 'success') => {
        this.endTransaction(name, startTime, startMemory, status);
      }
    };
  }

  private endTransaction(
    name: string,
    startTime: number,
    startMemory: NodeJS.MemoryUsage,
    status: string
  ) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const transaction = {
      name,
      duration: endTime - startTime,
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      status,
      timestamp: new Date().toISOString()
    };

    this.recordTransaction(transaction);
  }

  private recordTransaction(transaction: any) {
    // メトリクスサービスに送信
    // 外部APMサービス（New Relic、DataDog等）に送信
  }
}
```

#### 検証方法
- [ ] パフォーマンスメトリクスが正確に収集されることを確認
- [ ] ダッシュボードが有用な情報を表示することを確認
- [ ] 異常検知が正常に動作することを確認

---

## Phase 3: セキュリティ・バックアップ

### Task 8.6: セキュリティ強化実装
**優先度**: 🔴 高
**期間**: 2日
**担当者**: セキュリティエンジニア・DevOpsエンジニア

#### 実装内容
- [ ] API認証・認可の強化
- [ ] データ暗号化の実装
- [ ] セキュリティヘッダーの設定
- [ ] 脆弱性スキャンの自動化

#### 実装ファイル
- `apps/api/src/auth/auth.guard.ts`
- `apps/api/src/security/security.middleware.ts`

#### 実装詳細
```typescript
// security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: 'Too many requests from this IP'
  });

  use(req: Request, res: Response, next: NextFunction) {
    // セキュリティヘッダーの設定
    helmet()(req, res, () => {
      // レート制限
      this.limiter(req, res, () => {
        // リクエストログ
        console.log(`${req.method} ${req.path} - ${req.ip}`);
        next();
      });
    });
  }
}
```

#### 検証方法
- [ ] セキュリティヘッダーが正しく設定されていることを確認
- [ ] レート制限が正常に動作することを確認
- [ ] 脆弱性スキャンで問題がないことを確認

---

### Task 8.7: バックアップ・復旧システム実装
**優先度**: 🔴 高
**期間**: 2日
**担当者**: DevOpsエンジニア

#### 実装内容
- [ ] 自動バックアップシステム
- [ ] 復旧手順の自動化
- [ ] バックアップ検証システム
- [ ] 災害復旧計画

#### 実装ファイル
- `scripts/backup-system.sh`
- `scripts/restore-system.sh`
- `scripts/verify-backup.sh`

#### 実装詳細
```bash
#!/bin/bash
# backup-system.sh

BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="${BACKUP_DIR}/${DATE}"

mkdir -p $BACKUP_PATH

# データベースバックアップ
echo "Backing up database..."
pg_dump $DATABASE_URL > "${BACKUP_PATH}/database.sql"

# アプリケーションファイルバックアップ
echo "Backing up application files..."
tar -czf "${BACKUP_PATH}/app_files.tar.gz" /app

# 設定ファイルバックアップ
echo "Backing up configuration..."
cp -r /config "${BACKUP_PATH}/"

# バックアップ検証
echo "Verifying backup..."
./scripts/verify-backup.sh $BACKUP_PATH

# 古いバックアップの削除（30日以上古いもの）
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed: $BACKUP_PATH"
```

#### 検証方法
- [ ] バックアップが正常に作成されることを確認
- [ ] 復旧手順が正常に動作することを確認
- [ ] バックアップの整合性が保たれていることを確認

---

## Phase 4: 運用開始準備

### Task 8.8: 運用手順書作成
**優先度**: 🔴 高
**期間**: 2日
**担当者**: DevOpsエンジニア・開発チーム

#### 実装内容
- [ ] デプロイメント手順書
- [ ] 障害対応手順書
- [ ] 監視・アラート対応手順
- [ ] バックアップ・復旧手順書

#### 実装ファイル
- `docs/operations/deployment-guide.md`
- `docs/operations/incident-response.md`
- `docs/operations/monitoring-guide.md`

#### 検証方法
- [ ] 手順書に従って実際の作業が実行できることを確認
- [ ] 緊急時対応が適切に実行できることを確認

---

### Task 8.9: 本格運用開始
**優先度**: 🔴 高
**期間**: 1日
**担当者**: 全チーム

#### 実装内容
- [ ] 本番環境への最終デプロイ
- [ ] 監視システムの稼働確認
- [ ] ユーザーへの通知
- [ ] 初期運用監視

#### 検証方法
- [ ] 全システムが正常に稼働していることを確認
- [ ] ユーザーが正常にアクセスできることを確認
- [ ] 監視・アラートが正常に動作することを確認

---

## 完了基準

### Phase 1完了基準
- [ ] 本番環境が正常に構築されている
- [ ] CI/CDパイプラインが動作している
- [ ] データベースマイグレーションが完了している

### Phase 2完了基準
- [ ] 監視システムが稼働している
- [ ] メトリクス収集が正常に動作している
- [ ] アラート機能が設定されている

### Phase 3完了基準
- [ ] セキュリティ対策が実装されている
- [ ] バックアップシステムが動作している
- [ ] 災害復旧計画が策定されている

### Phase 4完了基準
- [ ] 運用手順書が整備されている
- [ ] 本格運用が開始されている
- [ ] 初期運用が安定している

## 次のステップ
このタスクが完了したら、以下のタスクに進む：
- `09-documentation-and-training-tasks.md`
- `10-maintenance-and-improvement-tasks.md`
