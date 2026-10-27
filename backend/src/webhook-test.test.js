import test from "node:test";
import assert from "node:assert/strict";
import {verifyTestWebhook} from "./webhook-test.js";

const args = {
  payload: Buffer.from('{"id":"evt_test"}'),
  signature: "t=123,v1=fake",
  secret: "whsec_test_only",
  apiKey: "sk_test_fake",
};
test("test webhook accepts a verified test event but never fulfills", () => {
  const stripe = {webhooks:{constructEvent:() => ({
    id:"evt_123",type:"checkout.session.completed",livemode:false,
    data:{object:{id:"cs_test_123",payment_status:"paid"}}
  })}};
  assert.deepEqual(verifyTestWebhook({...args,stripe}),{
    eventId:"evt_123",eventType:"checkout.session.completed",
    checkoutSessionId:"cs_test_123",paymentStatus:"paid",
    verified:true,fulfilled:false
  });
});
test("rejects live keys and malformed signing secrets", () => {
  assert.throws(()=>verifyTestWebhook({...args,apiKey:"sk_live_fake"}),/Test-mode/);
  assert.throws(()=>verifyTestWebhook({...args,secret:"bad"}),/signing secret/);
});
test("rejects Stripe live-mode events", () => {
  const stripe={webhooks:{constructEvent:()=>({id:"evt_live",type:"checkout.session.completed",livemode:true})}};
  assert.throws(()=>verifyTestWebhook({...args,stripe}),/test events/);
});
test("rejects bad signatures through Stripe verifier", () => {
  const stripe={webhooks:{constructEvent:()=>{throw Error("No signatures found matching")}}};
  assert.throws(()=>verifyTestWebhook({...args,stripe}),/No signatures/);
});
