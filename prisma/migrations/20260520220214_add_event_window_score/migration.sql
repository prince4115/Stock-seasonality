-- CreateEnum
CREATE TYPE "EventWindowKind" AS ENUM ('PRE30_PRE7', 'PRE7_EVENT', 'EVENT_POST7');

-- CreateTable
CREATE TABLE "EventWindowScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "festivalSlug" TEXT NOT NULL,
    "windowKind" "EventWindowKind" NOT NULL,
    "avgReturn" DOUBLE PRECISION NOT NULL,
    "pctYearsPositive" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "excludeCovid" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventWindowScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventWindowScore_stockId_idx" ON "EventWindowScore"("stockId");

-- CreateIndex
CREATE INDEX "EventWindowScore_festivalSlug_idx" ON "EventWindowScore"("festivalSlug");

-- CreateIndex
CREATE UNIQUE INDEX "EventWindowScore_stockId_festivalSlug_windowKind_excludeCov_key" ON "EventWindowScore"("stockId", "festivalSlug", "windowKind", "excludeCovid");

-- AddForeignKey
ALTER TABLE "EventWindowScore" ADD CONSTRAINT "EventWindowScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
