// Stripe test webhook verification only. No order fulfillment or persistent storage.
// The HTTP route is intentionally not enabled until durable idempotent storage exists.
import Stripe from "stripe";

export function verifyTestWebhook({payload, signature, secret, apiKey, stripe}) {
  if (!Buffer.isBuffer(payload) && typeof payload !== "string") throw Error("Raw webhook payload required");
  if (typeof signature !== "string" || !signature) throw Error("Stripe signature required");
  if (typeof secret !== "string" || !secret.startsWith("whsec_")) throw Error("Webhook signing secret required");
  if (typeof apiKey !== "string" || !apiKey.startsWith("sk_test_")) throw Error("Test-mode Stripe key required");
  const client = stripe ?? new Stripe(apiKey);
  const event = client.webhooks.constructEvent(payload, signature, secret);
  if (!event || typeof event.id !== "string" || !event.id || event.livemode !== false) {
    throw Error("Only verified Stripe test events are accepted");
  }
  return {
    eventId: event.id,
    eventType: event.type,
    checkoutSessionId: event.type === "checkout.session.completed" ? event.data?.object?.id ?? null : null,
    paymentStatus: event.type === "checkout.session.completed" ? event.data?.object?.payment_status ?? null : null,
    verified: true,
    fulfilled: false
  };
}
