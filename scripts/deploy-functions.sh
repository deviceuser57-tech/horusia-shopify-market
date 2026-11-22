#!/usr/bin/env bash
# Deploy Supabase Edge Functions for eagles-veritas-shop.
# Requires: supabase CLI logged in and project linked (supabase link).
set -e

cd "$(dirname "$0")/.."

echo "Deploying Edge Functions..."

# Public functions: callers have no user JWT (payment providers / guests).
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy payment-webhook --no-verify-jwt

# Admin functions: verify JWT at the gateway; functions additionally
# enforce the OWNER/STORE_MANAGER/MARKETING_SPECIALIST role server-side.
supabase functions deploy ai-trend-generator
supabase functions deploy cj-connector

echo "Done. Set secrets with:"
echo "  supabase secrets set AI_GATEWAY_URL=... AI_GATEWAY_API_KEY=... CJ_ACCOUNT_EMAIL=... CJ_API_KEY=... PAYMOB_API_KEY=... PAYMOB_INTEGRATION_ID=... PAYMOB_IFRAME_ID=... PAYMOB_HMAC_SECRET=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=..."
