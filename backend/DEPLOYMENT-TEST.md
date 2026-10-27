# Test-only checkout deployment checklist

This backend is **not ready for live sales**. GitHub Pages cannot host Node.js. Deploy the backend to a separate HTTPS Node.js host, isolated from production, with persistent environment secrets.

## Before test deployment
1. Confirm the GitHub Actions checkout tests are green.
2. Choose a test-only HTTPS hostname and backend hosting service. Do not connect the public cart to it.
3. Set `ALLOWED_ORIGIN` to the exact origin of the browser-based test preview. CORS is not authentication; the test endpoint must remain gated.
4. Set `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` to accessible HTTPS test pages.
5. Store `STRIPE_SECRET_KEY` only in the host's secret manager, using an `sk_test_` key.
6. Set `ENABLE_TEST_CHECKOUT=true` **only** in the isolated test backend.
7. Run `npm install` and `npm test` in `backend/`; start with `npm start`.
8. Check the `POST /api/quote` and `POST /api/checkout` flows with mock/test payment data.
9. Do not set `API_BASE` in the public site. The cart preview intentionally keeps it empty until a separate test preview is safely available.

## Not implemented
- A Stripe-signed webhook and durable, idempotent order storage.
- Fulfillment, customer confirmations, taxes and shipping-label purchase.
- Production checkout approval.

A redirect to the success page does **not** prove payment. Never fulfill orders from a redirect or a test event. Do not enable real payments until webhook, storage, tax compliance and operational checks are complete.
