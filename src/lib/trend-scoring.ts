export type CompetitionLevel = "low" | "medium" | "high";

export interface OpportunityProduct {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  sellingPrice: number;
  monthlySearches: number;
  monthlySales: number;
  trendGrowthPercent: number;
  competition: CompetitionLevel;
}

export interface RankedOpportunity {
  product: OpportunityProduct;
  score: number;
  grossProfitPerUnit: number;
  grossMarginPercent: number;
  recommendedChannel: string;
  channelReason: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getGrossProfitPerUnit(product: OpportunityProduct) {
  return product.sellingPrice - product.unitCost;
}

export function getGrossMarginPercent(product: OpportunityProduct) {
  if (product.sellingPrice <= 0) return 0;
  return (getGrossProfitPerUnit(product) / product.sellingPrice) * 100;
}

export function getOpportunityScore(product: OpportunityProduct) {
  const marginScore = clamp(getGrossMarginPercent(product) * 2, 0, 100);
  const searchScore = clamp(product.monthlySearches / 100, 0, 100);
  const salesScore = clamp(product.monthlySales * 5, 0, 100);
  const trendScore = clamp(50 + product.trendGrowthPercent * 2.5, 0, 100);
  const competitionScore = { low: 100, medium: 65, high: 30 }[product.competition];

  return Math.round(
    marginScore * 0.25 +
      searchScore * 0.2 +
      salesScore * 0.2 +
      trendScore * 0.2 +
      competitionScore * 0.15,
  );
}

function recommendChannel(product: OpportunityProduct) {
  if (product.trendGrowthPercent >= 15 && product.monthlySearches >= 500) {
    return {
      recommendedChannel: "TikTok",
      channelReason: "Rising interest makes short-form discovery worth testing.",
    };
  }

  if (product.monthlySearches >= 2500 && product.competition !== "high") {
    return {
      recommendedChannel: "Google Search",
      channelReason: "Existing search demand supports a high-intent test.",
    };
  }

  return {
    recommendedChannel: "Meta Ads",
    channelReason: "Broad discovery can test creative angles before scaling.",
  };
}

export function rankOpportunities(products: OpportunityProduct[]): RankedOpportunity[] {
  return products
    .map((product) => ({
      product,
      score: getOpportunityScore(product),
      grossProfitPerUnit: getGrossProfitPerUnit(product),
      grossMarginPercent: getGrossMarginPercent(product),
      ...recommendChannel(product),
    }))
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name));
}