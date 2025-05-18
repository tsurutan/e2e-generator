# TestPilot

シンプルなElectronベースのブラウザアプリケーションで、Webサイトの表示とユーザーインタラクションのイベントログ記録機能を提供します。

詳細な仕様については[SPECIFICATION.md](docs/SPECIFICATION.md)を参照してください。

## 機能

- プロジェクト作成画面でプロジェクト名とURLを設定
- メインメニュー画面から各機能へのアクセス
- メニュー画面で現在のプロジェクト情報を表示
- ブラウザ機能でプロジェクトURLのWebサイトを表示
- クリック、ホバー、フォーム送信、入力変更などのイベントを自動的に記録
- 「ラベル登録」ボタンを有効にすると、ホバーしたDOM要素を赤い点線で囲んで視覚的に強調表示
- 動的に表示される要素（モーダルや動的コンテンツ）に対するトリガーアクション情報を含めたラベル登録機能
- イベントログのリアルタイム表示
- 仕様書アップロード機能でテキスト仕様書から機能一覧を自動抽出
- OpenAI GPT-4oを活用した機能名と説明の自動生成
- 抽出された機能一覧のプロジェクトへの関連付け、保存、表示
- Gherkin記法に基づいたシナリオの自動生成
- 機能ごとのシナリオ管理と表示

## 技術スタック

- **Electron**: クロスプラットフォームデスクトップアプリケーションフレームワーク
- **TypeScript**: 型安全なJavaScriptスーパーセット
- **React**: ユーザーインターフェース構築のためのJavaScriptライブラリ
- **HTML/CSS**: ユーザーインターフェース
- **Node.js**: バックエンド処理
- **NestJS**: スケーラブルなNode.jsサーバーサイドアプリケーションフレームワーク
- **Prisma**: 次世代のNode.jsとTypeScript用ORM
- **PostgreSQL**: リレーショナルデータベース
- **Docker**: コンテナ化プラットフォーム
- **LangChain**: 大規模言語モデル（LLM）アプリケーション構築フレームワーク
- **OpenAI API**: GPT-4oを使用した自然言語処理

## プロジェクト構造

```
testpilot/
├── apps/
│   ├── api/               # APIサーバー
│   │   ├── dist/          # コンパイル済みのJavaScriptファイル
│   │   ├── node_modules/  # 依存パッケージ
│   │   ├── src/           # ソースコードディレクトリ
│   │   │   ├── hello/       # Helloモジュール
│   │   │   ├── projects/    # プロジェクト管理モジュール
│   │   │   ├── features/    # 機能管理モジュール
│   │   │   ├── scenarios/   # シナリオ管理モジュール
│   │   │   ├── prisma/      # Prisma ORM関連
│   │   │   ├── app.module.ts # メインモジュール
│   │   │   ├── app.controller.ts # メインコントローラー
│   │   │   ├── app.service.ts # メインサービス
│   │   │   └── main.ts      # アプリケーションエントリーポイント
│   │   ├── package.json   # プロジェクト設定
│   │   └── tsconfig.json  # TypeScript設定
│   └── app/               # メインアプリケーション
│       ├── dist/          # コンパイル済みのJavaScriptファイル
│       ├── node_modules/  # 依存パッケージ
│       ├── src/           # ソースコードディレクトリ
│       │   ├── main.ts    # メインプロセス
│       │   ├── preload.ts # プリロードスクリプト
│       │   └── renderer/  # レンダラープロセス
│       │       ├── App.tsx                # メインReactコンポーネント
│       │       ├── index.tsx              # Reactエントリーポイント
│       │       ├── pages/                 # ページコンポーネント
│       │       │   ├── BrowserPage.tsx    # ブラウザ操作画面
│       │       │   ├── MenuPage.tsx       # メニュー画面
│       │       │   ├── ProjectCreatePage.tsx # プロジェクト作成画面
│       │       │   ├── ProjectListPage.tsx # プロジェクト一覧画面
│       │       │   ├── FeatureListPage.tsx # 機能一覧画面
│       │       │   └── UploadPage.tsx     # 仕様書アップロード画面
│       │       └── styles/                # CSSスタイル
│       ├── package.json   # プロジェクト設定
│       └── tsconfig.json  # TypeScript設定
├── packages/              # 共有パッケージ
├── node_modules/          # ルート依存パッケージ
├── package.json           # ルートプロジェクト設定
└── turbo.json             # Turborepo設定
```

## 主要コンポーネント

### メインプロセス (main.ts)
- Electronアプリケーションのエントリーポイント
- ウィンドウ管理とアプリケーションのライフサイクル処理
- IPC（プロセス間通信）の設定

### プリロードスクリプト (preload.ts)
- メインプロセスとレンダラープロセス間の安全な通信を提供
- コンテキスト分離によるセキュリティ強化
- 必要なAPIのみをレンダラープロセスに公開

### APIサーバー (apps/api)
- NestJSを使用したREST APIサーバー
- モジュラーなアーキテクチャで拡張性が高い
- コントローラー、サービス、モジュールの明確な分離
- エンドポイント例: `/api/hello` - 簡単なテスト用エンドポイント

### 主要コンポーネント

各コンポーネントの詳細な仕様は[SPECIFICATION.md](docs/SPECIFICATION.md#%E6%A9%9F%E8%83%BD%E4%BB%95%E6%A7%98)を参照してください。

- **プロジェクト作成画面** (ProjectCreatePage.tsx): プロジェクト名とURLを設定
- **メニュー画面** (MenuPage.tsx): 各機能へのアクセスを提供
- **ブラウザ機能** (BrowserPage.tsx): Webサイト表示とイベント記録
- **仕様書アップロード機能** (UploadPage.tsx): プロジェクト選択と仕様書から機能抽出
- **機能一覧画面** (FeatureListPage.tsx): 機能一覧の表示と管理

## セキュリティ対策

- コンテキスト分離を使用してレンダラープロセスを保護
- Node.js統合を無効化
- プリロードスクリプトを通じた安全なIPC通信
- Webviewの分離

## インストールと実行

### 前提条件
- Node.js (v14以上)
- npm (v6以上)
- DockerとDocker Compose

### インストール
```bash
# リポジトリをクローン
git clone https://github.com/yourusername/testpilot.git
cd testpilot

# 依存パッケージをインストール
npm install
```

### 開発モードで実行

#### Electronアプリケーション
```bash
# apps/appディレクトリに移動
cd apps/app

# TypeScriptをコンパイルして実行
npm start

# または、ファイル変更を監視しながら実行
npm run dev
```

#### APIサーバー
```bash
# apps/apiディレクトリに移動
cd apps/api

# 開発モードで実行
npm run start:dev

# 本番モードで実行
npm run start:prod
```

### ビルド

#### Turborepoを使用したビルド
```bash
# ルートディレクトリで実行
npm run build
```

#### 個別のビルド
```bash
# Electronアプリケーションのビルド
cd apps/app
npm run build

# APIサーバーのビルド
cd apps/api
npm run build
```

### PostgreSQLとPrismaの設定と実行

```bash
# Docker ComposeでPostgreSQLとpgAdminを起動
docker-compose up -d

# Prismaと関連パッケージをインストール
./setup-postgres.sh

# Prismaスキーマをデータベースに適用
cd apps/api
npx prisma migrate dev --name init

# Prismaクライアントを生成
npx prisma generate
```

#### 環境変数の管理
アプリケーションの環境変数は `apps/api/.env` ファイルで管理されています。以下の環境変数ファイルが利用可能です：

- `.env` - デフォルトの環境変数
- `.env.development` - 開発環境用の環境変数
- `.env.production` - 本番環境用の環境変数

主な環境変数：

```
# データベース設定
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/testpilot_db?schema=public"

# アプリケーション設定
PORT=3000
NODE_ENV=development

# API設定
API_PREFIX=api

# OpenAI設定
OPENAI_API_KEY=your-openai-api-key
```

#### PostgreSQL接続情報
- **接続文字列**: postgresql://postgres:postgres@localhost:5432/testpilot_db?schema=public
- **ホスト**: localhost
- **ポート**: 5432
- **データベース名**: testpilot_db
- **ユーザー名**: postgres
- **パスワード**: postgres

#### pgAdminアクセス
- **URL**: http://localhost:5050
- **メールアドレス**: admin@example.com
- **パスワード**: admin

#### Prisma Studioの使用
```bash
cd apps/api
npx prisma studio
```

Prisma Studioはブラウザでデータベースを管理できるツールで、http://localhost:5555 でアクセスできます。

### APIエンドポイント

主要なAPIエンドポイントは以下の通りです。詳細な仕様とレスポンス例は[SPECIFICATION.md](docs/SPECIFICATION.md#api%E4%BB%95%E6%A7%98)を参照してください。

```
# プロジェクト関連のエンドポイント
GET /api/projects - 全プロジェクトを取得
GET /api/projects/:id - 指定したプロジェクトを取得
POST /api/projects - 新規プロジェクトを作成
GET /api/projects/:id/features - 指定したプロジェクトの機能一覧を取得

# 機能関連のエンドポイント
POST /api/features/extract - 仕様書から機能を抽出
POST /api/features/save - 機能を保存
GET /api/features/:featureId/scenarios - 指定した機能のシナリオ一覧を取得

# シナリオ関連のエンドポイント
POST /api/scenarios/extract - 仕様書からシナリオを抽出
POST /api/scenarios/save - シナリオを保存
POST /api/scenarios/save-multiple - 複数のシナリオを保存
GET /api/scenarios/feature/:featureId - 指定した機能のシナリオ一覧を取得
```

## 今後の開発予定

詳細な開発ロードマップは[SPECIFICATION.md](docs/SPECIFICATION.md)を参照してください。

- テスト自動化機能の追加
- ブラウザセッションの保存と復元
- ネットワークリクエストのモニタリング
- 機能一覧からテストケースの自動生成

## ライセンス

ISC

## 作者

Your Name
