# Local Testing Guide

## Start Local App

Install dependencies:

```sh
npm ci
```

Start Vite:

```sh
npm run dev
```

Open:

```txt
http://127.0.0.1:8017/
```

If port `8017` is already in use, use the URL printed by Vite.

## Demo Login

For local UI testing:

```txt
username: admin
password: admin
```

This shortcut is only for local development. For real Supabase Auth, register with a real email, confirm the email, then sign in.

## Main Smoke Paths

1. `/auth`: local login with `admin/admin`.
2. `/orders`: open order list and create a manual order if seed data exists.
3. `/pos`: add product to cart and create a POS order.
4. `/order`: create a public storefront order.
5. `/tracking`: search by order number and customer phone.
6. `/data-hub`: initialize sources and confirm raw events appear after order creation.
7. `/bookings`: verify booking calendar and booking dialog render.

## Customer Stress Scenarios

Use `docs/CUSTOMER_STRESS_SCENARIOS.md` when testing demanding customer flows: missing contact data, changed shipping address, repeat buyers with incomplete order data, messy phone numbers, and high-pressure COD orders.

Run the automated stress suite:

```sh
npx vitest run src/hooks/__tests__/customerStressScenarios.test.ts
```

## Local Inventory Demo

When logged in with `admin/admin`, inventory writes are local-only:

- Products, categories, stock transactions and BOM are stored in browser `localStorage`.
- Product images are compressed and stored as local data URLs, so Supabase Storage RLS does not block local testing.
- Real Supabase users still use the `products`, `inventory_transactions`, `product_bom`, `product_categories` tables and the `product-images` storage bucket.

To reset local inventory demo data, clear site data for `http://127.0.0.1:8017`.

## Verification Commands

Fast checks:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

Full local check:

```sh
npm run test:local
```

Current known lint state: lint passes with warnings in pre-existing files.

## Local AI Provider

`run.bat` now ensures these keys exist in `.env` without overwriting existing values:

```txt
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=http://127.0.0.1:8017
OPENROUTER_APP_TITLE=Multi Sale Organizer
LOVABLE_API_KEY=
```

When `OPENROUTER_API_KEY` is filled, AI Edge Functions prefer OpenRouter. Otherwise they keep the Lovable fallback.
