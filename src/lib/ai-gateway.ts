import { supabase } from "@/integrations/supabase/client";

export interface ProductAiEnrichment {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  suggestedTags: string[];
  adCopy: {
    hook: string;
    caption: string;
    callToAction: string;
  };
  evidenceStatus: "INSUFFICIENT_EVIDENCE" | "DRAFT";
}

export async function enrichProductWithAI(
  rawName: string,
  category: string,
  productId?: string,
): Promise<ProductAiEnrichment> {
  const { data, error } = await supabase.functions.invoke("ai-enrich", {
    body: {
      rawName,
      category,
      productId,
    },
  });

  if (error) {
    throw new Error(error.message || "AI enrichment is unavailable.");
  }
  if (!data) {
    throw new Error("AI enrichment returned no draft.");
  }

  return data as ProductAiEnrichment;
}
