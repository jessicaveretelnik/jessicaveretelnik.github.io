import test from "node:test";
import assert from "node:assert/strict";
import {createTestPool,storeTestEvent} from "./test-db.js";

test("database remains disabled unless explicitly opted in",()=>{
  assert.throws(()=>createTestPool({}),/disabled/);
});
test("rejects absent private database URL",()=>{
  assert.throws(()=>createTestPool({ENABLE_TEST_ORDER_STORAGE:"true",STRIPE_SECRET_KEY:"sk_test_fake"}),/DATABASE_URL/);
});
test("rejects live Stripe secret",()=>{
  assert.throws(()=>createTestPool({ENABLE_TEST_ORDER_STORAGE:"true",DATABASE_URL:"postgresql://localhost/test",STRIPE_SECRET_KEY:"sk_live_fake"}),/test key/);
});
test("releases dedicated client after failed persistence",async()=>{
  let released=false;
  const pool={connect:async()=>({query:async()=>{throw Error("simulated db error")},release:()=>{released=true}})};
  await assert.rejects(storeTestEvent(pool,{verified:true,fulfilled:false,eventId:"evt_1",eventType:"checkout.session.completed",checkoutSessionId:"cs_test_1",paymentStatus:"paid"}),/simulated db error/);
  assert.equal(released,true);
});
