import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import listCategoriesTool from "./tools/list-categories";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const issuer = supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}/auth/v1` : "";

export default defineMcp({
  name: "tumaninah-veritas-store",
  title: "Tumāninah Veritas Store",
  version: "1.0.0",
  instructions:
    "Search products and browse categories in the Tumāninah Veritas Store catalog (zero-inventory: dropshipping and affiliate products).",
  auth: issuer
    ? auth.oauth.issuer({
        issuer,
        acceptedAudiences: "authenticated",
      })
    : undefined,
  tools: [searchProductsTool, listCategoriesTool],
});
