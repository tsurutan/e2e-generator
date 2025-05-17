#!/bin/bash

# NestJSアプリケーションディレクトリに移動
cd apps/api

# Prismaとクライアントをインストール
npm install --save @prisma/client @nestjs/config
npm install --save-dev prisma

# Prismaの初期化
npx prisma init

# 環境変数ファイルを作成
cat > .env << EOL
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/testpilot_db?schema=public"

# Application Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_PREFIX=api
EOL

# 開発環境用の環境変数ファイルを作成
cat > .env.development << EOL
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/testpilot_db?schema=public"

# Application Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_PREFIX=api
EOL

# 本番環境用の環境変数ファイルを作成
cat > .env.production << EOL
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/e2e_app_db?schema=public"

# Application Configuration
PORT=3000
NODE_ENV=production

# API Configuration
API_PREFIX=api
EOL

echo "Prismaと環境変数ファイルがセットアップされました。"
