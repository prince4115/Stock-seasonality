-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "delisted" BOOLEAN NOT NULL DEFAULT false,
    "delistedAt" DATE,
    "dataSource" TEXT NOT NULL DEFAULT 'yfinance',
    "sourceMeta" JSONB,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(18,6) NOT NULL,
    "high" DECIMAL(18,6) NOT NULL,
    "low" DECIMAL(18,6) NOT NULL,
    "close" DECIMAL(18,6) NOT NULL,
    "adjClose" DECIMAL(18,6) NOT NULL,
    "volume" BIGINT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'yfinance',

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FestivalEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "region" TEXT NOT NULL DEFAULT 'US',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FestivalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FestivalEventCategory" (
    "festivalEventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "FestivalEventCategory_pkey" PRIMARY KEY ("festivalEventId","categoryId")
);

-- CreateTable
CREATE TABLE "SeasonalityScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "windowYears" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "avgReturn" DOUBLE PRECISION NOT NULL,
    "pctYearsPositive" DOUBLE PRECISION NOT NULL,
    "pctYearsBeatMean" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "excludeCovid" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonalityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_key" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "Stock_categoryId_idx" ON "Stock"("categoryId");

-- CreateIndex
CREATE INDEX "Stock_delisted_idx" ON "Stock"("delisted");

-- CreateIndex
CREATE INDEX "PriceHistory_date_idx" ON "PriceHistory"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_stockId_date_key" ON "PriceHistory"("stockId", "date");

-- CreateIndex
CREATE INDEX "FestivalEvent_date_idx" ON "FestivalEvent"("date");

-- CreateIndex
CREATE INDEX "FestivalEvent_slug_idx" ON "FestivalEvent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FestivalEvent_slug_date_key" ON "FestivalEvent"("slug", "date");

-- CreateIndex
CREATE INDEX "FestivalEventCategory_categoryId_idx" ON "FestivalEventCategory"("categoryId");

-- CreateIndex
CREATE INDEX "SeasonalityScore_stockId_idx" ON "SeasonalityScore"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalityScore_stockId_windowYears_month_excludeCovid_key" ON "SeasonalityScore"("stockId", "windowYears", "month", "excludeCovid");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSignup_email_key" ON "WaitlistSignup"("email");

-- CreateIndex
CREATE INDEX "WaitlistSignup_createdAt_idx" ON "WaitlistSignup"("createdAt");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalEventCategory" ADD CONSTRAINT "FestivalEventCategory_festivalEventId_fkey" FOREIGN KEY ("festivalEventId") REFERENCES "FestivalEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalEventCategory" ADD CONSTRAINT "FestivalEventCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalityScore" ADD CONSTRAINT "SeasonalityScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
