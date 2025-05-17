# E2E Testing Application

シンプルなElectronベースのブラウザアプリケーションで、Webサイトの表示とユーザーインタラクションのイベントログ記録機能を提供します。

## 機能

- プロジェクト作成画面でプロジェクト名とURLを設定
- メインメニュー画面から各機能へのアクセス
- メニュー画面で現在のプロジェクト情報を表示
- ブラウザ機能でプロジェクトURLのWebサイトを表示
- クリック、ホバー、フォーム送信、入力変更などのイベントを自動的に記録
- イベントログのリアルタイム表示

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

## プロジェクト構造

```
e2e-app/
├── apps/
│   ├── api/               # APIサーバー
│   │   ├── dist/          # コンパイル済みのJavaScriptファイル
│   │   ├── node_modules/  # 依存パッケージ
│   │   ├── src/           # ソースコードディレクトリ
│   │   │   ├── hello/       # Helloモジュール
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

### プロジェクト作成画面 (ProjectCreatePage.tsx)
- アプリケーションの初回起動時に表示
- プロジェクト名とURLを入力して保存
- 入力値のバリデーション機能

### メニュー画面 (MenuPage.tsx)
- プロジェクト作成後に表示されるメインメニュー
- 現在のプロジェクト情報（名前とURL）を表示
- 「機能一覧」「仕様書のアップロード」「ブラウザ操作」の3つの機能へのアクセス
- モダンでユーザーフレンドリーなインターフェース

### ブラウザ機能 (BrowserPage.tsx)
- プロジェクトURLを使用してWebサイトを表示
- URLを手動で変更することも可能
- Webviewを使用してWebコンテンツを表示
- イベントリスナーを注入してユーザーインタラクションを追跡
- イベントログをリアルタイムで表示

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
git clone https://github.com/yourusername/e2e-app.git
cd e2e-app

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/e2e_app_db?schema=public"

# アプリケーション設定
PORT=3000
NODE_ENV=development

# API設定
API_PREFIX=api
```

#### PostgreSQL接続情報
- **接続文字列**: postgresql://postgres:postgres@localhost:5432/e2e_app_db?schema=public
- **ホスト**: localhost
- **ポート**: 5432
- **データベース名**: e2e_app_db
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

```
GET /api/hello - 簡単なテスト用エンドポイント

# プロジェクト関連のエンドポイント
GET /api/projects - 全プロジェクトを取得
GET /api/projects/:id - 指定したプロジェクトを取得
POST /api/projects - 新規プロジェクトを作成
PUT /api/projects/:id - プロジェクトを更新
DELETE /api/projects/:id - プロジェクトを削除
```

レスポンス例:
```json
# GET /api/hello
{
  "message": "Hello from NestJS API!"
}

# GET /api/projects
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Example Project",
    "url": "https://example.com",
    "description": "This is an example project",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

## 今後の開発予定

- 「機能一覧」と「仕様書のアップロード」機能の実装
- テスト自動化機能の追加
- ブラウザセッションの保存と復元
- ネットワークリクエストのモニタリング
- テストレポート生成機能

## ライセンス

ISC

## 作者

Your Name
