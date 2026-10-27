# Secure checkout — development backend skeleton

This Node.js backend is **not deployed** and does not accept payments. Run `npm install`, `npm test`, `npm start` in the `backend/` folder (Node.js 20+). It intentionally returns HTTP 503 for `POST /api/quote` and `POST /api/checkout` after validating the request. Do not mistake the existing fixed Stripe Payment Links for a complete per-title order system.

## Design gates to complete before enabling purchases

1. Merchant approval of exact tier-by-tier 4+ **book prices** and shipping rules; keep fixed offers for 1–3 unchanged unless approved. Source of truth is `src/pricing.js` in **integer cents**, never prices from browser input.
2. Confirm book availability and add authoritative title/inventory IDs to the server catalog.
3. Measure **packaging weight, internal dimensions, and outer parcel dimensions**. Books are assumed 8 oz each; select package type and weight server-side. Configure USPS/EasyPost/Shippo credentials as encrypted host secrets, origin ZIP, destinations and shipping options. Get a **live carrier rate** and validate its expiry; do not present current flat offer shipping as an actual carrier quote.
4. Determine Texas and other applicable sales tax obligations before turning on automatic tax calculation; document approved tax approach. Do not treat KDP author's copy purchase taxes as proof that resale tax is not due.
5. Provision Stripe secret key on the separate host, use server-side Checkout Sessions with verified line items and shipping/tax, US address collection, success/cancel URLs, rate-limit/abuse controls, idempotency keys, short-lived quote IDs, and no client-supplied amounts. **Do not embed any secret in GitHub Pages**. Do not activate Stripe checkout until orders of 4+ can be priced correctly.
6. Verify Stripe webhook signatures and completed payment status before marking any order paid, store per-title quantities, dedicated shipping address, optional dedication, transaction ID, and fulfillment status securely. Consider retention limits and privacy policy.
7. Test validation, every offer boundary, mixed carts, USPS rate changes, carrier outages, Stripe sandbox success/fail/cancel, replayed webhooks, mobile checkout and deployment CORS. Use Stripe **test** mode before production.

No automatic taxes, new charges, live carrier requests, or changes to existing Stripe payment links are performed in this skeleton. It deliberately **fails closed** rather than risking an incorrect charge.
