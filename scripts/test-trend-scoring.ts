import { strict as assert } from "node:assert";
import { getGrossMarginPercent, getGrossProfitPerUnit, getOpportunityScore, rankOpportunities, type OpportunityProduct } from "../src/lib/trend-scoring";

const strongProduct: OpportunityProduct = {
  id: "strong",
  name: "Strong signal",
  category: "Home",
  unitCost: 50,
  sellingPrice: 100,
  monthlySearches: 10000,
  monthlySales: 20,
  trendGrowthPercent: 20,
  competition: "low",
};

const weakProduct: OpportunityProduct = {
  id: "weak",
  name: "Weak signal",
  category: "Home",
  unitCost: 120,
  sellingPrice: 100,
  monthlySearches: 0,
  monthlySales: 0,
  trendGrowthPercent: -50,
  competition: "high",
};

assert.equal(getGrossProfitPerUnit(strongProduct), 50);
assert.equal(getGrossMarginPercent(strongProduct), 50);
assert.equal(getOpportunityScore(strongProduct), 100);
assert.equal(getOpportunityScore(weakProduct), 5);
assert.deepEqual(rankOpportunities([weakProduct, strongProduct]).map((item) => item.product.id), ["strong", "weak"]);
assert.equal(rankOpportunities([strongProduct])[0]?.recommendedChannel, "TikTok");

console.log("Trend scoring checks passed.");