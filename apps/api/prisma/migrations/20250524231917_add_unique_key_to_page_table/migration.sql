/*
  Warnings:

  - A unique constraint covering the columns `[projectId,url]` on the table `pages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pages_projectId_url_key" ON "pages"("projectId", "url");
