import test from "node:test";
import assert from "node:assert/strict";
import {createTestCheckoutSession} from "../src/stripe-test.js";

const options = {
 secretKey:"sk_test_dummy_for_unit_tests",
 successUrl:"https://example.test/cart-preview/success/",
 cancelUrl:"https://example.test/cart-preview/cancel/"
};
test("test checkout uses server-side approved amounts and US-only shipping",async()=>{
 let params;
 const stripe={checkout:{sessions:{create:async input=>{params=input;return {id:"cs_test_mock",url:"https://checkout.stripe.com/mock"};}}}};
 const result=await createTestCheckoutSession({cart:[{id:"india",quantity:2},{id:"house",quantity:1}],zip:"78201",dedication:"For a friend"}, {...options,stripe});
 assert.equal(result.id,"cs_test_mock");
 assert.equal(params.line_items[0].price_data.unit_amount,3699);
 assert.equal(params.line_items.length,1);
 assert.deepEqual(params.shipping_address_collection.allowed_countries,["US"]);
 assert.equal(params.metadata.test_only,"true");
 assert.equal(params.metadata.book_ids,"india:2,house:1");
});
test("test checkout refuses live keys and non-HTTPS redirects",async()=>{
 const stripe={checkout:{sessions:{create:async()=>{throw Error("must not reach Stripe");}}}};
 const cart=[{id:"india",quantity:1}];
 await assert.rejects(()=>createTestCheckoutSession({cart,zip:"78201"},{...options,secretKey:"sk_live_not_allowed",stripe}),/test keys/);
 await assert.rejects(()=>createTestCheckoutSession({cart,zip:"78201"},{...options,successUrl:"http://example.test/success",stripe}),/HTTPS/);
 await assert.rejects(()=>createTestCheckoutSession({cart,zip:"invalid"},{...options,stripe}),/Invalid delivery/);
});
