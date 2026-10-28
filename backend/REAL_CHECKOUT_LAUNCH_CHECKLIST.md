# Real-checkout launch checklist — NOT APPROVED FOR PRODUCTION

This is a planning document only. No live Stripe keys, charges, migrations, or deployments are authorized.

## Tax/legal gates
- Apply for Texas Sales and Use Tax Permit through https://comptroller.texas.gov/taxes/permit/ (official, generally no application fee). Confirm entity type, sales location, and NAICS with the applicant. Do not put SSN or EIN in GitHub.
- Confirm filing frequency and tax treatment of books and seller-billed shipping. Texas generally taxes delivery charges on taxable goods.
- Confirm whether remote-state nexus requires additional registrations before collecting in other states.
- Confirm Stripe Tax registration coverage and test correct address-based calculations.

## Database and fulfillment gates
- Rotate the test PostgreSQL password previously exposed in conversation, and replace DATABASE_URL securely on Render.
- Provision separate production database with retention/backup strategy and access controls; do not reuse the free test DB.
- Add versioned production schema: orders, immutable line items, shipping address, currency, amounts (including tax), Stripe IDs, idempotent event ledger, fulfillment state, refunds, and audit timestamps.
- Validate transaction rollback, duplicate event delivery, retry/replay, and failure recovery.
- Never fulfill an order from success_url or from unverified events.

## Payments and privacy gates
- Create separate production Stripe webhook signing secret in Render (never GitHub); verify raw-body signature and event livemode=true.
- Server computes all prices from approved offers; never trust browser amounts.
- Test paid, unpaid, expired, refunded, disputed, and duplicate checkout events in isolated mode.
- Require tax-ready checkout, US-only delivery, validated shipping rates and stock/fulfillment process.
- Publish privacy, returns/refunds, shipping, and contact information after review.
- Require explicit owner approval before production deploy, merge, or any live payments.

## Current state
- The existing backend is test-only. Do not change ENABLE_TEST_CHECKOUT or ENABLE_TEST_ORDER_STORAGE to true until the private migration and persistence tests pass.
- GitHub Pages main and the draft PR must remain unchanged/unmerged until explicit approval.
