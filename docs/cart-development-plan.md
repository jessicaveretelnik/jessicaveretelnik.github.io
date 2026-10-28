# Book cart — development plan

This branch is for a safe staged implementation. The published main branch is unchanged.

## Verified current behavior
- The existing index.html has three Stripe Payment Links for fixed 1/2/3-book tiers.
- Four or more books currently use an email request.
- The weight estimate assumes 0.5 lb per book and excludes packaging.

## Required before enabling dynamic checkout
1. Agree on pricing for 4+ books; preserve existing 1/2/3 offers.
2. Confirm book inventory, covers and which titles are available for direct sale.
3. Measure mailers/boxes and configure origin ZIP and carrier account.
4. Implement a server-side shipping quote endpoint (USPS or a shipping provider).
5. Implement a server-side Stripe Checkout Session endpoint; calculate and validate totals on the server.
6. Configure webhook verification and order confirmation, without publishing secrets.
7. Test mobile layout, mixed-title carts, ZIP code validation, pricing boundaries, shipping failures, and checkout success/cancel.
8. Resolve Texas tax obligations before enabling automated tax collection.

## Guardrails
- Do not modify existing live Stripe links before replacement checkout is verified.
- Never put Stripe secret keys or shipping-provider credentials in GitHub Pages.
- Never invent shipping rates or imply weight estimates are postage quotes.
- Do not charge for 4+ books before pricing and shipping are approved.

## Implementation audit — 26 October 2026
- Existing eight-title cart reviewed and revised. Adds removal/clear cart, English-first preview, links to all eight existing Amazon listings, safer quantity validation, auto-selection from the main catalogue, noindex preview, and explicit non-payment notice.
- Existing homepage has been updated **on this development branch only** to direct individual books to the experimental cart, with English as the default. Existing live Stripe Payment Links are unchanged.
- A separate undeployed `backend/` foundation now includes catalog IDs, exact 1–3 fixed-price offers in integer cents, server-side validation, ZIP/dedication guards, tests and fail-closed API stubs. API intentionally returns 503 for quotes/checkout, never makes actual carrier/Stripe requests.
- Shipping rates, packaging specs, 4+ prices, Texas tax treatment, payment webhooks, order database, backend hosting and end-to-end payment testing are **not configured**. No checkout is authorized and the PR remains draft.
- Important: The displayed $5 / free shipping figures are existing **promotional amounts**, not carrier quotes. The 3-book total is $34.99 before any applicable tax.
- Development source reviewed in GitHub; automated tests are committed but not represented as executed in CI. Verify with `cd backend && npm install && npm test` and manual browser tests before deployment.
