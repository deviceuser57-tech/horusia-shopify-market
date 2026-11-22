import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search Store Products",
  description: "Search active products in Tumāninah Veritas Store by keyword or category.",
  inputSchema: {
    query: z.string().optional().describe("Search term matching product titles or descriptions"),
    category: z.string().optional().describe("Filter by category name"),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of products to return"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    const client = supabaseForUser(ctx);
    if (!client) {
      return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    }

    let dbQuery = client
      .from("store_products")
      .select("id, title, title_ar, price, currency, category, business_model, image_url, status")
      .eq("status", "ACTIVE")
      .limit(limit);

    if (category) {
      dbQuery = dbQuery.ilike("category", `%${category}%`);
    }
    if (query) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,title_ar.ilike.%${query}%,description.ilike.%${query}%`,
      );
    }

    const { data, error } = await dbQuery;
    if (error) {
      return { content: [{ type: "text", text: `Database error: ${error.message}` }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
