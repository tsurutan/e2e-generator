-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "given" TEXT NOT NULL,
    "when" TEXT NOT NULL,
    "then" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
