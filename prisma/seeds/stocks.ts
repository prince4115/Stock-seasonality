/**
 * Ticker universe — ~95 stocks across the 9 categories.
 *
 * `delisted` is set on tickers we know were taken private / acquired / went
 * to zero, so Phase 3 keeps them in 10-year windows but flags them. TIF is
 * the canonical example (acquired by LVMH in January 2021).
 *
 * exchange is informational — Phase 3 doesn't use it. currency defaults to
 * USD; non-USD tickers (ADRs like LVMUY, KER on EPA) are noted for future
 * FX-aware analysis.
 */
export type StockSeed = {
  ticker: string;
  name: string;
  categorySlug: string;
  exchange?: string;
  currency?: string;
  delisted?: boolean;
  delistedAt?: Date;
};

export const stocksData: StockSeed[] = [
  // -------- Travel --------
  { ticker: "AAL", name: "American Airlines Group", categorySlug: "travel", exchange: "NASDAQ" },
  { ticker: "DAL", name: "Delta Air Lines", categorySlug: "travel", exchange: "NYSE" },
  { ticker: "UAL", name: "United Airlines Holdings", categorySlug: "travel", exchange: "NASDAQ" },
  { ticker: "LUV", name: "Southwest Airlines", categorySlug: "travel", exchange: "NYSE" },
  { ticker: "BKNG", name: "Booking Holdings", categorySlug: "travel", exchange: "NASDAQ" },
  { ticker: "EXPE", name: "Expedia Group", categorySlug: "travel", exchange: "NASDAQ" },
  { ticker: "ABNB", name: "Airbnb", categorySlug: "travel", exchange: "NASDAQ" },
  { ticker: "MAR", name: "Marriott International", categorySlug: "travel", exchange: "NASDAQ" },
  { ticker: "HLT", name: "Hilton Worldwide", categorySlug: "travel", exchange: "NYSE" },
  { ticker: "H", name: "Hyatt Hotels", categorySlug: "travel", exchange: "NYSE" },
  { ticker: "CCL", name: "Carnival", categorySlug: "travel", exchange: "NYSE" },
  { ticker: "RCL", name: "Royal Caribbean", categorySlug: "travel", exchange: "NYSE" },

  // -------- Retail --------
  { ticker: "WMT", name: "Walmart", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "TGT", name: "Target", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "COST", name: "Costco Wholesale", categorySlug: "retail", exchange: "NASDAQ" },
  { ticker: "AMZN", name: "Amazon", categorySlug: "retail", exchange: "NASDAQ" },
  { ticker: "HD", name: "Home Depot", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "LOW", name: "Lowe's", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "BBY", name: "Best Buy", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "DLTR", name: "Dollar Tree", categorySlug: "retail", exchange: "NASDAQ" },
  { ticker: "DG", name: "Dollar General", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "KSS", name: "Kohl's", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "M", name: "Macy's", categorySlug: "retail", exchange: "NYSE" },
  {
    ticker: "JWN",
    name: "Nordstrom",
    categorySlug: "retail",
    exchange: "NYSE",
    // Taken private by Nordstrom family + Liverpool; deal closed May 20, 2025.
    delisted: true,
    delistedAt: new Date("2025-05-20"),
  },
  { ticker: "TJX", name: "TJX Companies", categorySlug: "retail", exchange: "NYSE" },
  { ticker: "ROST", name: "Ross Stores", categorySlug: "retail", exchange: "NASDAQ" },
  { ticker: "BURL", name: "Burlington Stores", categorySlug: "retail", exchange: "NYSE" },

  // -------- Food & beverage --------
  { ticker: "KO", name: "Coca-Cola", categorySlug: "food-beverage", exchange: "NYSE" },
  { ticker: "PEP", name: "PepsiCo", categorySlug: "food-beverage", exchange: "NASDAQ" },
  {
    ticker: "MDLZ",
    name: "Mondelez International",
    categorySlug: "food-beverage",
    exchange: "NASDAQ",
  },
  { ticker: "KHC", name: "Kraft Heinz", categorySlug: "food-beverage", exchange: "NASDAQ" },
  { ticker: "GIS", name: "General Mills", categorySlug: "food-beverage", exchange: "NYSE" },
  // K = Kellanova (post-Kellogg-split entity, Oct 2023). yfinance currently
  // returns no data for the single-letter ticker — known follow-up to revisit
  // when we swap to Polygon.io.
  { ticker: "K", name: "Kellanova", categorySlug: "food-beverage", exchange: "NYSE" },
  { ticker: "CPB", name: "Campbell Soup", categorySlug: "food-beverage", exchange: "NYSE" },
  { ticker: "SJM", name: "J.M. Smucker", categorySlug: "food-beverage", exchange: "NYSE" },
  { ticker: "HSY", name: "Hershey", categorySlug: "food-beverage", exchange: "NYSE" },
  { ticker: "MNST", name: "Monster Beverage", categorySlug: "food-beverage", exchange: "NASDAQ" },
  { ticker: "STZ", name: "Constellation Brands", categorySlug: "food-beverage", exchange: "NYSE" },
  { ticker: "BUD", name: "Anheuser-Busch InBev", categorySlug: "food-beverage", exchange: "NYSE" },

  // -------- Restaurants --------
  { ticker: "MCD", name: "McDonald's", categorySlug: "restaurants", exchange: "NYSE" },
  { ticker: "SBUX", name: "Starbucks", categorySlug: "restaurants", exchange: "NASDAQ" },
  { ticker: "CMG", name: "Chipotle Mexican Grill", categorySlug: "restaurants", exchange: "NYSE" },
  { ticker: "DPZ", name: "Domino's Pizza", categorySlug: "restaurants", exchange: "NYSE" },
  { ticker: "YUM", name: "Yum! Brands", categorySlug: "restaurants", exchange: "NYSE" },
  {
    ticker: "QSR",
    name: "Restaurant Brands International",
    categorySlug: "restaurants",
    exchange: "NYSE",
  },
  { ticker: "DRI", name: "Darden Restaurants", categorySlug: "restaurants", exchange: "NYSE" },
  { ticker: "WEN", name: "Wendy's", categorySlug: "restaurants", exchange: "NASDAQ" },
  { ticker: "TXRH", name: "Texas Roadhouse", categorySlug: "restaurants", exchange: "NASDAQ" },
  { ticker: "CAKE", name: "Cheesecake Factory", categorySlug: "restaurants", exchange: "NASDAQ" },

  // -------- Apparel --------
  { ticker: "NKE", name: "Nike", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "LULU", name: "Lululemon Athletica", categorySlug: "apparel", exchange: "NASDAQ" },
  { ticker: "UAA", name: "Under Armour", categorySlug: "apparel", exchange: "NYSE" },
  {
    // Gap Inc. changed ticker from GPS to GAP in early 2024 alongside their
    // rebrand. yfinance no longer returns data under "GPS".
    ticker: "GPS",
    name: "Gap Inc. (old ticker)",
    categorySlug: "apparel",
    exchange: "NYSE",
    delisted: true,
    delistedAt: new Date("2024-02-28"),
  },
  { ticker: "GAP", name: "The Gap, Inc.", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "ANF", name: "Abercrombie & Fitch", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "AEO", name: "American Eagle Outfitters", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "URBN", name: "Urban Outfitters", categorySlug: "apparel", exchange: "NASDAQ" },
  { ticker: "VFC", name: "VF Corporation", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "RL", name: "Ralph Lauren", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "TPR", name: "Tapestry", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "CPRI", name: "Capri Holdings", categorySlug: "apparel", exchange: "NYSE" },
  { ticker: "ADDYY", name: "Adidas (ADR)", categorySlug: "apparel", exchange: "OTC" },

  // -------- Jewelry & luxury --------
  // TIF: acquired by LVMH and delisted on 2021-01-07.
  {
    ticker: "TIF",
    name: "Tiffany & Co.",
    categorySlug: "jewelry-luxury",
    exchange: "NYSE",
    delisted: true,
    delistedAt: new Date("2021-01-07"),
  },
  { ticker: "SIG", name: "Signet Jewelers", categorySlug: "jewelry-luxury", exchange: "NYSE" },
  { ticker: "LVMUY", name: "LVMH (ADR)", categorySlug: "jewelry-luxury", exchange: "OTC" },
  {
    ticker: "CFRUY",
    name: "Compagnie Financière Richemont (ADR)",
    categorySlug: "jewelry-luxury",
    exchange: "OTC",
  },
  {
    ticker: "BURBY",
    name: "Burberry Group (ADR)",
    categorySlug: "jewelry-luxury",
    exchange: "OTC",
  },
  { ticker: "PRDSY", name: "Prada (ADR)", categorySlug: "jewelry-luxury", exchange: "OTC" },
  { ticker: "DECK", name: "Deckers Outdoor", categorySlug: "jewelry-luxury", exchange: "NYSE" },

  // -------- Cinema & entertainment --------
  { ticker: "DIS", name: "Walt Disney", categorySlug: "cinema-entertainment", exchange: "NYSE" },
  { ticker: "NFLX", name: "Netflix", categorySlug: "cinema-entertainment", exchange: "NASDAQ" },
  {
    ticker: "AMC",
    name: "AMC Entertainment",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
  },
  { ticker: "CNK", name: "Cinemark", categorySlug: "cinema-entertainment", exchange: "NYSE" },
  {
    ticker: "WBD",
    name: "Warner Bros. Discovery",
    categorySlug: "cinema-entertainment",
    exchange: "NASDAQ",
  },
  {
    // PARA dissolved into Paramount Skydance (PSKY) at merger close 2025-08-07.
    ticker: "PARA",
    name: "Paramount Global (pre-merger)",
    categorySlug: "cinema-entertainment",
    exchange: "NASDAQ",
    delisted: true,
    delistedAt: new Date("2025-08-07"),
  },
  {
    ticker: "PSKY",
    name: "Paramount Skydance Corporation",
    categorySlug: "cinema-entertainment",
    exchange: "NASDAQ",
  },
  {
    ticker: "LYV",
    name: "Live Nation Entertainment",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
  },
  {
    ticker: "MSGE",
    name: "Madison Square Garden Entertainment",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
  },
  {
    // SIX merged with Cedar Fair 2024-07-01; combined entity took ticker FUN.
    ticker: "SIX",
    name: "Six Flags Entertainment (pre-merger)",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
    delisted: true,
    delistedAt: new Date("2024-07-01"),
  },
  {
    ticker: "FUN",
    name: "Six Flags Entertainment Corporation (post-merger)",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
  },
  {
    // SEAS = SeaWorld Entertainment, renamed to United Parks & Resorts on
    // 2024-02-08 with ticker change to PRKS.
    ticker: "SEAS",
    name: "SeaWorld Entertainment (old ticker)",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
    delisted: true,
    delistedAt: new Date("2024-02-08"),
  },
  {
    ticker: "PRKS",
    name: "United Parks & Resorts",
    categorySlug: "cinema-entertainment",
    exchange: "NYSE",
  },

  // -------- Toys & hobby --------
  { ticker: "HAS", name: "Hasbro", categorySlug: "toys-hobby", exchange: "NASDAQ" },
  { ticker: "MAT", name: "Mattel", categorySlug: "toys-hobby", exchange: "NASDAQ" },
  { ticker: "FNKO", name: "Funko", categorySlug: "toys-hobby", exchange: "NASDAQ" },
  { ticker: "POOL", name: "Pool Corp", categorySlug: "toys-hobby", exchange: "NASDAQ" },
  { ticker: "BC", name: "Brunswick", categorySlug: "toys-hobby", exchange: "NYSE" },

  // -------- Beauty & personal care --------
  { ticker: "EL", name: "Estée Lauder", categorySlug: "beauty-personal-care", exchange: "NYSE" },
  { ticker: "ULTA", name: "Ulta Beauty", categorySlug: "beauty-personal-care", exchange: "NASDAQ" },
  { ticker: "COTY", name: "Coty", categorySlug: "beauty-personal-care", exchange: "NYSE" },
  {
    ticker: "IPAR",
    name: "Inter Parfums",
    categorySlug: "beauty-personal-care",
    exchange: "NASDAQ",
  },
  { ticker: "LRLCY", name: "L'Oréal (ADR)", categorySlug: "beauty-personal-care", exchange: "OTC" },
  {
    ticker: "BBWI",
    name: "Bath & Body Works",
    categorySlug: "beauty-personal-care",
    exchange: "NYSE",
  },
  { ticker: "ELF", name: "e.l.f. Beauty", categorySlug: "beauty-personal-care", exchange: "NYSE" },
  {
    ticker: "PG",
    name: "Procter & Gamble",
    categorySlug: "beauty-personal-care",
    exchange: "NYSE",
  },

  // -------- Benchmarks (hidden category; backtest engine only) --------
  {
    ticker: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    categorySlug: "benchmark",
    exchange: "NYSE Arca",
  },
];
