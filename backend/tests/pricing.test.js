import test from "node:test";import assert from "node:assert/strict";import {priceCart,validateCart,validateZip,validateDedication} from "../src/pricing.js";
for(const [count,books,shipping] of [[1,1199,500],[2,2399,500],[3,3699,0]])test("approved offer "+count,()=>{const result=priceCart([{id:"india",quantity:count}]);assert.equal(result.booksCents,books);assert.equal(result.offerShippingCents,shipping);assert.equal(result.offerTotalCents,books+shipping);assert.equal(result.bookWeightOz,count*8);});
test("mixed titles count by copies",()=>{const r=priceCart([{id:"india",quantity:1},{id:"little-girl",quantity:2}]);assert.equal(r.count,3);assert.equal(r.offerTotalCents,3699);});
test("approved additional copies and shipping",()=>{for(const [n,books,shipping] of [[4,4898,0],[5,6097,0],[6,7296,0],[7,8495,0],[8,9694,0],[10,12092,0]]){const r=priceCart([{id:"india",quantity:n}]);assert.equal(r.approved,true);assert.equal(r.booksCents,books);assert.equal(r.offerShippingCents,shipping);assert.equal(r.offerTotalCents,books+shipping);}});
test("reject invalid/duplicate/negative quantities",()=>{for(const cart of [[{id:"unknown",quantity:1}],[{id:"india",quantity:-1}],[{id:"india",quantity:0}],[{id:"india",quantity:1.5}],[{id:"india",quantity:1},{id:"india",quantity:2}]])assert.throws(()=>validateCart(cart));});
test("US ZIP and dedication input validation",()=>{assert.equal(validateZip("78201"),true);assert.equal(validateZip("78201-1234"),true);assert.equal(validateZip("SW1A 1AA"),false);assert.equal(validateDedication("For Gabriella"),true);assert.equal(validateDedication("x".repeat(121)),false);});

import {mediaMailEstimate,MEDIA_MAIL_RETAIL_CENTS} from "../src/shipping.js";
test("USPS rates use published whole-pound retail bands for 1 through 16 copies",()=>{
 const cents=[439,439,513,513,586,586,660,660,734,734,808,808,881,881,955,955];
 for(let n=1;n<=16;n++){const q=mediaMailEstimate(n);assert.equal(q.estimatedBookWeightOz,n*8);assert.equal(q.billablePounds,Math.ceil(n/2));assert.equal(q.mediaMailCents,cents[n-1]);}
});
test("mixed-title 5-copy carts return correct 3 lb USPS estimate with approved price",()=>{
 const q=priceCart([{id:"india",quantity:2},{id:"little-girl",quantity:3}]);
 assert.equal(q.count,5);assert.equal(q.bookWeightOz,40);assert.equal(q.estimatedBookWeightOz,40);assert.equal(q.billablePounds,3);assert.equal(q.mediaMailCents,586);assert.equal(q.approved,true);assert.equal(q.booksCents,6097);
});
test("all official 70 lb bands present and invalid USPS counts fail closed",()=>{
 assert.equal(MEDIA_MAIL_RETAIL_CENTS.length,70);assert.equal(mediaMailEstimate(100).billablePounds,50);
 for(const n of [0,-1,1.5,101,NaN]) assert.throws(()=>mediaMailEstimate(n));
});

test("Media Mail estimate is included for 1–3 copy offers",()=>{for(const count of [1,2,3]){const q=priceCart([{id:"india",quantity:count}]);assert.equal(q.estimatedBookWeightOz,count*8);assert.equal(q.billablePounds,Math.ceil(count/2));assert.equal(q.mediaMailCents,MEDIA_MAIL_RETAIL_CENTS[Math.ceil(count/2)-1]);}});
