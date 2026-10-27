import http from "node:http";
import {priceCart,validateZip,validateDedication} from "./pricing.js";
// Server-only stub. No Stripe keys or USPS credentials in browser/GitHub Pages.
const port=Number(process.env.PORT||8787);const allowedOrigin=process.env.ALLOWED_ORIGIN||"https://jessicaveretelnik.github.io";
function respond(res,code,payload){res.writeHead(code,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":allowedOrigin,"vary":"Origin"});res.end(JSON.stringify(payload));}
const server=http.createServer(async(req,res)=>{if(req.method==="OPTIONS"){res.writeHead(204,{"access-control-allow-origin":allowedOrigin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"Content-Type","vary":"Origin"});res.end();return;}
if(req.url!=="/api/quote"&&req.url!=="/api/checkout"){respond(res,404,{error:"Not found"});return;}if(req.method!=="POST"){respond(res,405,{error:"POST required"});return;}
if(req.headers.origin&&req.headers.origin!==allowedOrigin){respond(res,403,{error:"Origin not allowed"});return;}
try{let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>8192)throw Error("Payload too large");}const body=JSON.parse(raw);const cart=priceCart(body.cart);if(!validateZip(body.zip)){respond(res,400,{error:"Valid US ZIP Code required"});return;}if(!validateDedication(body.dedication??"")){respond(res,400,{error:"Invalid dedication"});return;}
if(!cart.approved){respond(res,409,{error:"Prices for 4+ copies are not approved",count:cart.count});return;}
if(req.url==="/api/quote"){respond(res,503,{error:"Carrier shipping integration not yet configured",estimatedBookWeightOz:cart.bookWeightOz,offerBooksCents:cart.booksCents,existingOfferShippingCents:cart.offerShippingCents});return;}
// Fail closed: no checkout until authenticated carrier quote, Stripe session, webhook and order persistence are implemented.
respond(res,503,{error:"Checkout unavailable until real carrier quote, verified Stripe payment, tax review and order records are configured"});
}catch(error){respond(res,400,{error:"Invalid request"});}});
if(import.meta.url===new URL("file:"+process.argv[1]).href)server.listen(port,()=>console.log("Development backend listening on "+port));
export {server};
