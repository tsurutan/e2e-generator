/*
  Warnings:

  - The primary key for the `pages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `pages` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "pages_projectId_url_key";

-- AlterTable
ALTER TABLE "pages" DROP CONSTRAINT "pages_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("projectId", "url");
