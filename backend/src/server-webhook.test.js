import test from "node:test";
import assert from "node:assert/strict";
import {server} from "./server.js";
test("test webhook refuses requests while storage is disabled",async()=>{
 const old=process.env.ENABLE_TEST_ORDER_STORAGE;
 process.env.ENABLE_TEST_ORDER_STORAGE="false";
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 try {
  const address=server.address();
  const response=await fetch("http://127.0.0.1:"+address.port+"/api/stripe-test-webhook",{method:"POST",body:"{}"});
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/disabled/);
 }finally{
  await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  if(old===undefined)delete process.env.ENABLE_TEST_ORDER_STORAGE;else process.env.ENABLE_TEST_ORDER_STORAGE=old;
 }
});
