import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List Store Categories",
  description: "Get all distinct active product categories available in the store catalog.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const client = supabaseForUser(ctx);
    if (!client) {
      return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    }

    const { data, error } = await client
      .from("store_products")
      .select("category")
      .eq("status", "ACTIVE");

    if (error) {
      return { content: [{ type: "text", text: `Failed to fetch categories: ${error.message}` }], isError: true };
    }

    const categories = Array.from(
      new Set((data ?? []).map((row) => row.category).filter((c): c is string => Boolean(c))),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(categories) }],
      structuredContent: { categories },
    };
  },
});
