/**
 * Festival/event occurrences for the past 15 years + next 5 years.
 *
 * Year range: 2010 through 2031 (covers the 15y windows we'll backtest plus
 * 5 years of forward calendar).
 *
 * For each event we generate one row per year, dated to that year's
 * occurrence. `affects` maps the event to categories with a 0..1 weight that
 * Phase 3 uses to scale event-window returns per category.
 *
 * Movable feasts (Diwali, Chinese New Year, Easter, Super Bowl) use
 * hardcoded dates — computing them from first principles is more code than
 * it's worth for a 22-row lookup table. Sources:
 *   - Diwali: drikpanchang.com (US Pacific) — Lakshmi Puja day
 *   - Chinese New Year: timeanddate.com
 *   - Easter: timeanddate.com (Western/Gregorian)
 *   - Super Bowl: nfl.com historical schedules
 */
import {
  addDays,
  FRI,
  lastWeekdayOfMonth,
  MON,
  nthWeekdayOfMonth,
  SUN,
  THU,
  utcDate,
} from "./festival-helpers";

const YEARS = Array.from({ length: 2031 - 2010 + 1 }, (_, i) => 2010 + i);

type AffectsLink = { categorySlug: string; weight?: number };

export type FestivalSeed = {
  slug: string;
  name: string;
  date: Date;
  durationDays?: number;
  region?: "US" | "IN" | "CN" | "global";
  description?: string;
  affects: AffectsLink[];
};

// --- Hardcoded lunar / variable dates -------------------------------------
// [month, day] tuples for each year. Keep them sorted by year for diffs.

const DIWALI: Record<number, [number, number]> = {
  2010: [11, 5],
  2011: [10, 26],
  2012: [11, 13],
  2013: [11, 3],
  2014: [10, 23],
  2015: [11, 11],
  2016: [10, 30],
  2017: [10, 19],
  2018: [11, 7],
  2019: [10, 27],
  2020: [11, 14],
  2021: [11, 4],
  2022: [10, 24],
  2023: [11, 12],
  2024: [11, 1],
  2025: [10, 20],
  2026: [11, 8],
  2027: [10, 29],
  2028: [11, 17],
  2029: [11, 5],
  2030: [10, 26],
  2031: [11, 14],
};

const CHINESE_NEW_YEAR: Record<number, [number, number]> = {
  2010: [2, 14],
  2011: [2, 3],
  2012: [1, 23],
  2013: [2, 10],
  2014: [1, 31],
  2015: [2, 19],
  2016: [2, 8],
  2017: [1, 28],
  2018: [2, 16],
  2019: [2, 5],
  2020: [1, 25],
  2021: [2, 12],
  2022: [2, 1],
  2023: [1, 22],
  2024: [2, 10],
  2025: [1, 29],
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
  2029: [2, 13],
  2030: [2, 3],
  2031: [1, 23],
};

const EASTER: Record<number, [number, number]> = {
  2010: [4, 4],
  2011: [4, 24],
  2012: [4, 8],
  2013: [3, 31],
  2014: [4, 20],
  2015: [4, 5],
  2016: [3, 27],
  2017: [4, 16],
  2018: [4, 1],
  2019: [4, 21],
  2020: [4, 12],
  2021: [4, 4],
  2022: [4, 17],
  2023: [4, 9],
  2024: [3, 31],
  2025: [4, 20],
  2026: [4, 5],
  2027: [3, 28],
  2028: [4, 16],
  2029: [4, 1],
  2030: [4, 21],
  2031: [4, 13],
};

const SUPER_BOWL: Record<number, [number, number]> = {
  2010: [2, 7],
  2011: [2, 6],
  2012: [2, 5],
  2013: [2, 3],
  2014: [2, 2],
  2015: [2, 1],
  2016: [2, 7],
  2017: [2, 5],
  2018: [2, 4],
  2019: [2, 3],
  2020: [2, 2],
  2021: [2, 7],
  2022: [2, 13],
  2023: [2, 12],
  2024: [2, 11],
  2025: [2, 9],
  2026: [2, 8],
  2027: [2, 14],
  2028: [2, 6],
  2029: [2, 11],
  2030: [2, 10],
  2031: [2, 9],
};

// --- Per-event constructors ------------------------------------------------

function christmas(year: number): FestivalSeed {
  return {
    slug: "christmas",
    name: "Christmas Day",
    date: utcDate(year, 12, 25),
    region: "global",
    description: "Peak holiday gifting season in Western markets.",
    affects: [
      { categorySlug: "retail", weight: 1.0 },
      { categorySlug: "toys-hobby", weight: 1.0 },
      { categorySlug: "jewelry-luxury", weight: 0.9 },
      { categorySlug: "apparel", weight: 0.8 },
      { categorySlug: "beauty-personal-care", weight: 0.7 },
      { categorySlug: "food-beverage", weight: 0.7 },
      { categorySlug: "travel", weight: 0.6 },
      { categorySlug: "restaurants", weight: 0.5 },
    ],
  };
}

function thanksgiving(year: number): FestivalSeed {
  // 4th Thursday of November in the US.
  return {
    slug: "thanksgiving",
    name: "Thanksgiving (US)",
    date: nthWeekdayOfMonth(year, 11, THU, 4),
    region: "US",
    description: "US family travel + grocery spending peak.",
    affects: [
      { categorySlug: "travel", weight: 0.9 },
      { categorySlug: "food-beverage", weight: 1.0 },
      { categorySlug: "restaurants", weight: 0.5 },
      { categorySlug: "retail", weight: 0.5 },
    ],
  };
}

function blackFriday(year: number): FestivalSeed {
  // Day after Thanksgiving.
  const date = addDays(nthWeekdayOfMonth(year, 11, THU, 4), 1);
  return {
    slug: "black-friday",
    name: "Black Friday",
    date,
    region: "US",
    description: "Largest single-day retail event in the US calendar.",
    affects: [
      { categorySlug: "retail", weight: 1.0 },
      { categorySlug: "apparel", weight: 0.8 },
      { categorySlug: "toys-hobby", weight: 0.8 },
      { categorySlug: "beauty-personal-care", weight: 0.6 },
    ],
  };
}

function cyberMonday(year: number): FestivalSeed {
  // Monday after Thanksgiving.
  const date = addDays(nthWeekdayOfMonth(year, 11, THU, 4), 4);
  return {
    slug: "cyber-monday",
    name: "Cyber Monday",
    date,
    region: "US",
    description: "E-commerce counterpart to Black Friday.",
    affects: [
      { categorySlug: "retail", weight: 1.0 },
      { categorySlug: "apparel", weight: 0.7 },
      { categorySlug: "beauty-personal-care", weight: 0.6 },
    ],
  };
}

function halloween(year: number): FestivalSeed {
  return {
    slug: "halloween",
    name: "Halloween",
    date: utcDate(year, 10, 31),
    region: "US",
    description: "Candy + costume + horror box-office.",
    affects: [
      { categorySlug: "food-beverage", weight: 1.0 },
      { categorySlug: "retail", weight: 0.7 },
      { categorySlug: "cinema-entertainment", weight: 0.5 },
      { categorySlug: "apparel", weight: 0.4 },
    ],
  };
}

function valentinesDay(year: number): FestivalSeed {
  return {
    slug: "valentines-day",
    name: "Valentine's Day",
    date: utcDate(year, 2, 14),
    region: "global",
    description: "Jewelry, chocolate, restaurants.",
    affects: [
      { categorySlug: "jewelry-luxury", weight: 1.0 },
      { categorySlug: "restaurants", weight: 0.9 },
      { categorySlug: "food-beverage", weight: 0.7 },
      { categorySlug: "beauty-personal-care", weight: 0.6 },
    ],
  };
}

function mothersDay(year: number): FestivalSeed {
  // 2nd Sunday of May in the US.
  return {
    slug: "mothers-day",
    name: "Mother's Day (US)",
    date: nthWeekdayOfMonth(year, 5, SUN, 2),
    region: "US",
    description: "Restaurants, jewelry, beauty.",
    affects: [
      { categorySlug: "restaurants", weight: 0.9 },
      { categorySlug: "jewelry-luxury", weight: 0.8 },
      { categorySlug: "beauty-personal-care", weight: 0.8 },
      { categorySlug: "retail", weight: 0.5 },
    ],
  };
}

function fathersDay(year: number): FestivalSeed {
  return {
    slug: "fathers-day",
    name: "Father's Day (US)",
    date: nthWeekdayOfMonth(year, 6, SUN, 3),
    region: "US",
    description: "Apparel, restaurants, retail.",
    affects: [
      { categorySlug: "retail", weight: 0.5 },
      { categorySlug: "restaurants", weight: 0.5 },
      { categorySlug: "apparel", weight: 0.4 },
    ],
  };
}

function memorialDay(year: number): FestivalSeed {
  return {
    slug: "memorial-day",
    name: "Memorial Day (US)",
    date: lastWeekdayOfMonth(year, 5, MON),
    region: "US",
    description: "Unofficial start of summer travel + retail sales.",
    affects: [
      { categorySlug: "travel", weight: 0.9 },
      { categorySlug: "retail", weight: 0.6 },
    ],
  };
}

function laborDay(year: number): FestivalSeed {
  return {
    slug: "labor-day",
    name: "Labor Day (US)",
    date: nthWeekdayOfMonth(year, 9, MON, 1),
    region: "US",
    description: "End of summer travel + retail sales.",
    affects: [
      { categorySlug: "travel", weight: 0.7 },
      { categorySlug: "retail", weight: 0.6 },
    ],
  };
}

function independenceDay(year: number): FestivalSeed {
  return {
    slug: "independence-day",
    name: "Independence Day (US)",
    date: utcDate(year, 7, 4),
    region: "US",
    description: "BBQ + travel + box-office.",
    affects: [
      { categorySlug: "food-beverage", weight: 0.7 },
      { categorySlug: "travel", weight: 0.6 },
      { categorySlug: "cinema-entertainment", weight: 0.5 },
    ],
  };
}

function backToSchool(year: number): FestivalSeed {
  // Fuzzy season — anchor at Aug 15, duration 30 days. Phase 3 can revisit.
  return {
    slug: "back-to-school",
    name: "Back-to-school (anchor)",
    date: utcDate(year, 8, 15),
    durationDays: 30,
    region: "US",
    description:
      "Mid-July through early-Sept consumer-spending season; date anchored at Aug 15 with a 30-day window.",
    affects: [
      { categorySlug: "apparel", weight: 1.0 },
      { categorySlug: "retail", weight: 0.9 },
      { categorySlug: "food-beverage", weight: 0.3 },
    ],
  };
}

function superBowl(year: number): FestivalSeed | null {
  const date = SUPER_BOWL[year];
  if (!date) return null;
  return {
    slug: "super-bowl",
    name: "Super Bowl Sunday",
    date: utcDate(year, date[0], date[1]),
    region: "US",
    description: "Snacks, beer, wings, ads.",
    affects: [
      { categorySlug: "food-beverage", weight: 1.0 },
      { categorySlug: "restaurants", weight: 0.7 },
    ],
  };
}

function diwali(year: number): FestivalSeed | null {
  const date = DIWALI[year];
  if (!date) return null;
  return {
    slug: "diwali",
    name: "Diwali",
    date: utcDate(year, date[0], date[1]),
    region: "IN",
    description: "Indian festival of lights; gold buying + apparel + retail.",
    affects: [
      { categorySlug: "jewelry-luxury", weight: 1.0 },
      { categorySlug: "retail", weight: 0.8 },
      { categorySlug: "apparel", weight: 0.6 },
    ],
  };
}

function chineseNewYear(year: number): FestivalSeed | null {
  const date = CHINESE_NEW_YEAR[year];
  if (!date) return null;
  return {
    slug: "chinese-new-year",
    name: "Chinese New Year",
    date: utcDate(year, date[0], date[1]),
    region: "CN",
    description: "World's largest annual human migration; luxury gifting.",
    affects: [
      { categorySlug: "travel", weight: 1.0 },
      { categorySlug: "jewelry-luxury", weight: 0.9 },
      { categorySlug: "retail", weight: 0.7 },
      { categorySlug: "restaurants", weight: 0.6 },
    ],
  };
}

function easter(year: number): FestivalSeed | null {
  const date = EASTER[year];
  if (!date) return null;
  return {
    slug: "easter",
    name: "Easter (Western)",
    date: utcDate(year, date[0], date[1]),
    region: "global",
    description: "Chocolate, family meals, spring apparel.",
    affects: [
      { categorySlug: "food-beverage", weight: 0.9 },
      { categorySlug: "apparel", weight: 0.5 },
      { categorySlug: "toys-hobby", weight: 0.4 },
    ],
  };
}

function singlesDay(year: number): FestivalSeed {
  return {
    slug: "singles-day",
    name: "Singles' Day (11.11)",
    date: utcDate(year, 11, 11),
    region: "CN",
    description: "Largest single-day e-commerce event globally.",
    affects: [
      { categorySlug: "retail", weight: 1.0 },
      { categorySlug: "apparel", weight: 0.6 },
      { categorySlug: "beauty-personal-care", weight: 0.6 },
    ],
  };
}

const BUILDERS: Array<(year: number) => FestivalSeed | null> = [
  christmas,
  thanksgiving,
  blackFriday,
  cyberMonday,
  halloween,
  valentinesDay,
  mothersDay,
  fathersDay,
  memorialDay,
  laborDay,
  independenceDay,
  backToSchool,
  superBowl,
  diwali,
  chineseNewYear,
  easter,
  singlesDay,
];

export function buildFestivalsData(): FestivalSeed[] {
  const out: FestivalSeed[] = [];
  for (const year of YEARS) {
    for (const build of BUILDERS) {
      const evt = build(year);
      if (evt) out.push(evt);
    }
  }
  return out;
}
