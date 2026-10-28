import test from "node:test";
import assert from "node:assert/strict";
import {recordVerifiedTestEvent} from "./test-order-store.js";

const verified={verified:true,fulfilled:false,eventId:"evt_test_1",eventType:"checkout.session.completed",checkoutSessionId:"cs_test_1",paymentStatus:"paid"};
test("records paid test order inside transaction",async()=>{
  const calls=[];
  const db={query:async(sql,params)=>{calls.push({sql,params});return {rowCount:1}}};
  assert.deepEqual(await recordVerifiedTestEvent(db,verified),{duplicate:false,recorded:true});
  assert.equal(calls[0].sql,"BEGIN");
  assert.equal(calls.at(-1).sql,"COMMIT");
  assert.equal(calls.filter(c=>c.sql.includes("INSERT INTO stripe_test_orders")).length,1);
});
test("duplicate webhook event never creates a second order",async()=>{
  const calls=[];
  const db={query:async(sql)=>{calls.push(sql);return {rowCount:0}}};
  assert.deepEqual(await recordVerifiedTestEvent(db,verified),{duplicate:true,recorded:false});
  assert.equal(calls.some(sql=>sql.includes("INSERT INTO stripe_test_orders")),false);
});
test("failed persistence rolls back",async()=>{
  const calls=[];
  const db={query:async(sql)=>{calls.push(sql);if(sql.includes("INSERT INTO stripe_test_events"))throw Error("database error");return {rowCount:1}}};
  await assert.rejects(recordVerifiedTestEvent(db,verified),/database error/);
  assert.equal(calls.at(-1),"ROLLBACK");
});
test("unverified event is rejected before querying database",async()=>{
  const db={query:async()=>{throw Error("should not query")}};
  await assert.rejects(recordVerifiedTestEvent(db,{...verified,verified:false}),/Verified test event/);
});

test("unpaid checkout event is recorded but no order is created",async()=>{
 const queries=[];
 const db={query:async(sql)=>{queries.push(sql);return {rowCount:1}}};
 await recordVerifiedTestEvent(db,{...verified,eventId:"evt_test_unpaid",paymentStatus:"unpaid"});
 assert.equal(queries.some(sql=>sql.includes("INSERT INTO stripe_test_orders")),false);
 assert.equal(queries.at(-1),"COMMIT");
});
test("a failure inserting the order rolls back the event",async()=>{
 const queries=[];
 const db={query:async(sql)=>{queries.push(sql);if(sql.includes("INSERT INTO stripe_test_orders"))throw Error("order insert failed");return {rowCount:1}}};
 await assert.rejects(recordVerifiedTestEvent(db,{...verified,eventId:"evt_test_order_fail"}),/order insert failed/);
 assert.equal(queries.at(-1),"ROLLBACK");
});
test("purportedly fulfilled event is rejected before database access",async()=>{
 const db={query:async()=>{throw Error("should not query")}};
 await assert.rejects(recordVerifiedTestEvent(db,{...verified,fulfilled:true}),/Verified test event/);
});
