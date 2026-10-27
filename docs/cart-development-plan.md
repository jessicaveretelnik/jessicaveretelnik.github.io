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
