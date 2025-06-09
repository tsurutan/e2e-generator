-- CreateTable
CREATE TABLE "edges" (
    "id" TEXT NOT NULL,
    "sourcePageUrl" TEXT NOT NULL,
    "targetPageUrl" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "pageProjectId" TEXT,
    "pageUrl" TEXT,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_sourcePageUrl_projectId_fkey" FOREIGN KEY ("sourcePageUrl", "projectId") REFERENCES "pages"("url", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_targetPageUrl_projectId_fkey" FOREIGN KEY ("targetPageUrl", "projectId") REFERENCES "pages"("url", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_pageProjectId_pageUrl_fkey" FOREIGN KEY ("pageProjectId", "pageUrl") REFERENCES "pages"("projectId", "url") ON DELETE SET NULL ON UPDATE CASCADE;
