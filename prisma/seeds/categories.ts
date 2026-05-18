/**
 * Consumer-spending categories. Slugs feed URL routing (/category/[slug])
 * so keep them kebab-case and stable.
 */
export type CategorySeed = {
  slug: string;
  name: string;
  description: string;
};

export const categoriesData: CategorySeed[] = [
  {
    slug: "travel",
    name: "Travel",
    description:
      "Airlines, hotels, cruises, online travel agencies. Strongly seasonal around summer, holidays, and Chinese New Year.",
  },
  {
    slug: "retail",
    name: "Retail",
    description:
      "Big-box, department stores, off-price chains, e-commerce. Heavy holiday Q4; Black Friday, Cyber Monday, back-to-school.",
  },
  {
    slug: "food-beverage",
    name: "Food & beverage",
    description:
      "Packaged food, beverages, confectionery. Holiday-driven (Halloween candy, Easter, Thanksgiving) plus Super Bowl.",
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    description: "QSR, casual dining, coffee. Valentine's Day, Mother's Day, holidays.",
  },
  {
    slug: "apparel",
    name: "Apparel",
    description:
      "Athletic wear, fast fashion, department-store brands. Back-to-school and holiday gifting cycles.",
  },
  {
    slug: "jewelry-luxury",
    name: "Jewelry & luxury",
    description:
      "Jewelry, luxury fashion, watches. Diwali (gold), Chinese New Year, Valentine's, Mother's Day, holiday gifting.",
  },
  {
    slug: "cinema-entertainment",
    name: "Cinema & entertainment",
    description:
      "Theaters, streaming, theme parks, live events. Summer blockbusters, holiday tentpoles, Halloween.",
  },
  {
    slug: "toys-hobby",
    name: "Toys & hobby",
    description: "Toys, games, collectibles, recreational products. Holiday Q4 dominates the year.",
  },
  {
    slug: "beauty-personal-care",
    name: "Beauty & personal care",
    description: "Cosmetics, skincare, fragrance. Mother's Day, Valentine's, holiday gift sets.",
  },
];
