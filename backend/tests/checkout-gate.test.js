import test from "node:test";
import assert from "node:assert/strict";
import {server} from "../src/server.js";

test("checkout stays disabled without explicit test credentials",async()=>{
 const previousFlag=process.env.ENABLE_TEST_CHECKOUT;
 const previousKey=process.env.STRIPE_SECRET_KEY;
 delete process.env.ENABLE_TEST_CHECKOUT;
 delete process.env.STRIPE_SECRET_KEY;
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 try{
  const port=server.address().port;
  const payload={cart:[{id:"india",quantity:1}],zip:"78201",dedication:""};
  const response=await fetch("http://127.0.0.1:"+port+"/api/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/not configured/i);
  const quote=await fetch("http://127.0.0.1:"+port+"/api/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  assert.equal(quote.status,200);
  const data=await quote.json();
  assert.equal(data.totalBeforeTaxCents,1699);
  assert.equal(data.checkoutEnabled,false);
  assert.equal(data.uspsEstimatedCostCents,439);
 }finally{
  await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  if(previousFlag===undefined)delete process.env.ENABLE_TEST_CHECKOUT;else process.env.ENABLE_TEST_CHECKOUT=previousFlag;
  if(previousKey===undefined)delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=previousKey;
 }
});
