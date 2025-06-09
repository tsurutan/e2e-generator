/*
  Warnings:

  - You are about to drop the column `uIStateId` on the `edges` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "edges" DROP CONSTRAINT "edges_uIStateId_fkey";

-- AlterTable
ALTER TABLE "edges" DROP COLUMN "uIStateId";
