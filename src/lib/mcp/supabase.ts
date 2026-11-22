import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Creates a Supabase client scoped to the MCP caller's bearer token so
 * Row Level Security applies as that user. Returns null when the call
 * is unauthenticated.
 */
export function supabaseForUser(ctx: ToolContext): SupabaseClient | null {
  const token = ctx.getToken();
  if (!token) return null;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
