// Test-mode Stripe Checkout preparation only. Not wired to public routes.
// Never accept client-provided prices. No fulfillment without verified webhook and durable order storage.
import Stripe from "stripe";
import {priceCart, TITLES} from "./pricing.js";
export async function createTestCheckoutSession({cart, zip, dedication = ""}, options = {}) {
  const {validateZip,validateDedication} = await import("./pricing.js");
  if (!validateZip(zip) || !validateDedication(dedication)) throw Error("Invalid delivery details");
  const key = options.secretKey ?? process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw Error("Only Stripe test keys are allowed");
  const successUrl = options.successUrl ?? process.env.CHECKOUT_SUCCESS_URL;
  const cancelUrl = options.cancelUrl ?? process.env.CHECKOUT_CANCEL_URL;
  if (!successUrl || !cancelUrl || ![successUrl,cancelUrl].every(url => /^https:\/\//.test(url))) throw Error("HTTPS redirect URLs required");
  const quote = priceCart(cart);
  const stripe = options.stripe ?? new Stripe(key);
  return stripe.checkout.sessions.create({
    mode:"payment",
    payment_method_types:["card"],
    billing_address_collection:"required",
    shipping_address_collection:{allowed_countries:["US"]},
    line_items:[
      {price_data:{currency:"usd",product_data:{name:"Jéssica Veretelnik Books — printed books bundle"},unit_amount:quote.booksCents},quantity:1},
      ...(quote.offerShippingCents?[{price_data:{currency:"usd",product_data:{name:"Shipping"},unit_amount:quote.offerShippingCents},quantity:1}]:[])
    ],
    metadata:{test_only:"true",book_ids:quote.items.map(i=>i.id+":"+i.quantity).join(","),dedication},
    success_url:successUrl,
    cancel_url:cancelUrl
  });
}
