import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/shopify': {
        target: 'https://eagles-veritas-shop-vgyv4.myshopify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shopify/, '/api/2025-07/graphql.json'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '';
            if (token) {
              proxyReq.setHeader('X-Shopify-Storefront-Access-Token', token);
            }
          });
        },
      },
    },
  },
  plugins: [react(), mcpPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));