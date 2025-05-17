/*
  Warnings:

  - Added the required column `url` to the `labels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- まず、queryParamsカラムを追加
ALTER TABLE "labels" ADD COLUMN "queryParams" TEXT;

-- 次に、urlカラムをNULLABLEとして追加
ALTER TABLE "labels" ADD COLUMN "url" TEXT;

-- 既存のレコードにデフォルト値を設定
UPDATE "labels" SET "url" = 'https://example.com' WHERE "url" IS NULL;

-- 最後に、urlカラムをNOT NULLに変更
ALTER TABLE "labels" ALTER COLUMN "url" SET NOT NULL;
