/*
  Warnings:

  - You are about to drop the column `pageUrl` on the `edges` table. All the data in the column will be lost.
  - You are about to drop the column `sourcePageUrl` on the `edges` table. All the data in the column will be lost.
  - You are about to drop the column `targetPageUrl` on the `edges` table. All the data in the column will be lost.
  - Added the required column `fromUIStateId` to the `edges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toUIStateId` to the `edges` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "edges" DROP CONSTRAINT "edges_pageProjectId_pageUrl_fkey";

-- DropForeignKey
ALTER TABLE "edges" DROP CONSTRAINT "edges_sourcePageUrl_projectId_fkey";

-- DropForeignKey
ALTER TABLE "edges" DROP CONSTRAINT "edges_targetPageUrl_projectId_fkey";

-- AlterTable
ALTER TABLE "edges" DROP COLUMN "pageUrl",
DROP COLUMN "sourcePageUrl",
DROP COLUMN "targetPageUrl",
ADD COLUMN     "fromUIStateId" TEXT NOT NULL,
ADD COLUMN     "toUIStateId" TEXT NOT NULL,
ADD COLUMN     "uIStateId" TEXT;

-- CreateTable
CREATE TABLE "ui_states" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_states_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ui_states" ADD CONSTRAINT "ui_states_pageUrl_projectId_fkey" FOREIGN KEY ("pageUrl", "projectId") REFERENCES "pages"("url", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_states" ADD CONSTRAINT "ui_states_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_fromUIStateId_fkey" FOREIGN KEY ("fromUIStateId") REFERENCES "ui_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_toUIStateId_fkey" FOREIGN KEY ("toUIStateId") REFERENCES "ui_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_uIStateId_fkey" FOREIGN KEY ("uIStateId") REFERENCES "ui_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
