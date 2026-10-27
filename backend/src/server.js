import http from "node:http";
import {priceCart,validateZip,validateDedication} from "./pricing.js";
// Server-only stub. No Stripe keys or USPS credentials in browser/GitHub Pages.
const port=Number(process.env.PORT||8787);const allowedOrigin=process.env.ALLOWED_ORIGIN||"https://jessicaveretelnik.github.io";
function respond(res,code,payload){res.writeHead(code,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":allowedOrigin,"vary":"Origin"});res.end(JSON.stringify(payload));}
const server=http.createServer(async(req,res)=>{if(req.method==="OPTIONS"){res.writeHead(204,{"access-control-allow-origin":allowedOrigin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"Content-Type","vary":"Origin"});res.end();return;}
if(req.url!=="/api/quote"&&req.url!=="/api/checkout"){respond(res,404,{error:"Not found"});return;}if(req.method!=="POST"){respond(res,405,{error:"POST required"});return;}
if(req.headers.origin&&req.headers.origin!==allowedOrigin){respond(res,403,{error:"Origin not allowed"});return;}
try{let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>8192)throw Error("Payload too large");}const body=JSON.parse(raw);const cart=priceCart(body.cart);if(!validateZip(body.zip)){respond(res,400,{error:"Valid US ZIP Code required"});return;}if(!validateDedication(body.dedication??"")){respond(res,400,{error:"Invalid dedication"});return;}
if(!cart.approved){respond(res,409,{error:"Prices for 4+ copies are not approved",count:cart.count,estimatedBookWeightOz:cart.estimatedBookWeightOz,billablePounds:cart.billablePounds,mediaMailEstimateCents:cart.mediaMailCents,rateType:cart.rateType});return;}
if(req.url==="/api/quote"){respond(res,200,{currency:"usd",booksCents:cart.booksCents,shippingCents:cart.offerShippingCents,totalBeforeTaxCents:cart.offerTotalCents,estimatedBookWeightOz:cart.bookWeightOz,uspsEstimatedCostCents:cart.mediaMailCents??null,shippingMethod:"Promotional shipping; USPS Media Mail estimate is not a live carrier quote",taxStatus:"Not calculated — test checkout only, tax review required before live sales",checkoutEnabled:process.env.ENABLE_TEST_CHECKOUT==="true"&&Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))});return;}
// Explicit test-only gate: never create live charges or fulfill orders from this route.
if(process.env.ENABLE_TEST_CHECKOUT!=="true"||!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")){respond(res,503,{error:"Test checkout is not configured"});return;}
try{
 const {createTestCheckoutSession}=await import("./stripe-test.js");
 const session=await createTestCheckoutSession({cart:body.cart,zip:body.zip,dedication:body.dedication??""});
 if(!session.url||!session.id){respond(res,502,{error:"Stripe test session did not return a checkout URL"});return;}
 respond(res,200,{testOnly:true,checkoutUrl:session.url,sessionId:session.id});
}catch(error){console.error("Test checkout session error:",error?.type||error?.name||"unknown");respond(res,502,{error:"Unable to create Stripe test checkout session"});}
}catch(error){respond(res,400,{error:"Invalid request"});}});
if(process.argv[1]&&import.meta.url===new URL("file:"+process.argv[1]).href)server.listen(port,()=>console.log("Development backend listening on "+port));
export {server};
