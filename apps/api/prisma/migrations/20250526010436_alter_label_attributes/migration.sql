/*
  Warnings:

  - You are about to drop the column `queryParams` on the `labels` table. All the data in the column will be lost.
  - You are about to drop the column `triggerActions` on the `labels` table. All the data in the column will be lost.
  - You are about to drop the column `xpath` on the `labels` table. All the data in the column will be lost.
  - Added the required column `uiStateId` to the `labels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "labels" DROP COLUMN "queryParams",
DROP COLUMN "triggerActions",
DROP COLUMN "xpath",
ADD COLUMN     "uiStateId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_uiStateId_fkey" FOREIGN KEY ("uiStateId") REFERENCES "ui_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
