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

test("all approved quantities produce the exact server-side Stripe total",async()=>{
 for(const [count,expected] of [[1,1699],[2,2899],[3,3699],[4,4898],[5,6097],[10,12092]]){
  let params;
  const stripe={checkout:{sessions:{create:async p=>{params=p;return {id:"cs_test_mock",url:"https://checkout.stripe.com/mock"};}}}};
  await createTestCheckoutSession({cart:[{id:"india",quantity:count}],zip:"78249"},{...options,stripe});
  assert.equal(params.line_items.reduce((sum,item)=>sum+item.price_data.unit_amount*item.quantity,0),expected);
  assert.equal(params.line_items.length,count<=2?2:1);
 }
});
test("invalid cart and dedication never reach Stripe",async()=>{
 let calls=0;
 const stripe={checkout:{sessions:{create:async()=>{calls++;return {};}}}};
 for(const input of [
  {cart:[{id:"unknown",quantity:1}],zip:"78249"},
  {cart:[{id:"india",quantity:0}],zip:"78249"},
  {cart:[{id:"india",quantity:1}],zip:"78249",dedication:"x".repeat(121)}
 ]) await assert.rejects(()=>createTestCheckoutSession(input,{...options,stripe}));
 assert.equal(calls,0);
});

test("webhook event storage is idempotent and never fulfills an order",async()=>{
 const {recordVerifiedTestEvent}=await import("../src/test-order-store.js");
 const queries=[];
 let eventExists=false;
 const db={query:async(sql,params=[])=>{
  queries.push({sql,params});
  if(sql.includes("INSERT INTO stripe_test_events")){
   if(eventExists)return {rowCount:0};
   eventExists=true;return {rowCount:1};
  }
  return {rowCount:1};
 }};
 const verified={eventId:"evt_test123",eventType:"checkout.session.completed",checkoutSessionId:"cs_test_123",paymentStatus:"paid",verified:true,fulfilled:false};
 assert.deepEqual(await recordVerifiedTestEvent(db,verified),{duplicate:false,recorded:true});
 assert.deepEqual(await recordVerifiedTestEvent(db,verified),{duplicate:true,recorded:false});
 assert.equal(queries.filter(q=>q.sql.includes("INSERT INTO stripe_test_orders")).length,1);
 assert.equal(queries.filter(q=>q.sql==="COMMIT").length,2);
 assert.equal(queries.some(q=>/fulfill|shipped/i.test(q.sql)),false);
});
test("unpaid webhook event never creates a paid order",async()=>{
 const {recordVerifiedTestEvent}=await import("../src/test-order-store.js");
 const queries=[];
 const db={query:async(sql)=>{queries.push(sql);return {rowCount:1};}};
 await recordVerifiedTestEvent(db,{eventId:"evt_unpaid123",eventType:"checkout.session.completed",checkoutSessionId:"cs_test_456",paymentStatus:"unpaid",verified:true,fulfilled:false});
 assert.equal(queries.some(sql=>sql.includes("INSERT INTO stripe_test_orders")),false);
});
test("unverified webhook event is rejected before database writes",async()=>{
 const {recordVerifiedTestEvent}=await import("../src/test-order-store.js");
 let writes=0;
 await assert.rejects(()=>recordVerifiedTestEvent({query:async()=>{writes++;}}, {eventId:"evt_bad",eventType:"checkout.session.completed",checkoutSessionId:"cs_test_1",paymentStatus:"paid",verified:false,fulfilled:false}),/Verified test event/);
 assert.equal(writes,0);
});
