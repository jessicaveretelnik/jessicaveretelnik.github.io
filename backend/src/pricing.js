import {mediaMailEstimate} from "./shipping.js";
// Author-approved offers. Do not change without approval.
export const OFFERS=Object.freeze({1:Object.freeze({books:1199,shipping:500}),2:Object.freeze({books:2399,shipping:500}),3:Object.freeze({books:3499,shipping:0})});
// Approved: 1–3 copy promotions unchanged; each additional copy costs $11.99.
export const ADDITIONAL_BOOK_CENTS=1199;
export const BOOK_IDS=Object.freeze(["india","little-girl","invisible","mirror","behind-screen","house","alright","billion"]);
export const TITLES=Object.freeze({"india":"A Journey to India","little-girl":"The Little Girl / Маленька дівчинка","invisible":"You Are Not... Invisible","mirror":"Mirror, Mirror, Mine! / I'm Scared!","behind-screen":"Behind the Screen","house":"Who Lives in This House?","alright":"Everything Will Be Alright!","billion":"8 Billion and You"});
export function validateCart(cart){if(!Array.isArray(cart)||cart.length<1||cart.length>BOOK_IDS.length)throw Error("Invalid cart");const ids=new Set();let count=0;const items=cart.map(item=>{if(!item||typeof item.id!=="string"||!BOOK_IDS.includes(item.id)||ids.has(item.id)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>99)throw Error("Invalid item");ids.add(item.id);count+=item.quantity;return {id:item.id,quantity:item.quantity};});if(count>100)throw Error("Cart too large");return {items,count,bookWeightOz:count*8};}
export function priceCart(cart){const checked=validateCart(cart);const tier=OFFERS[checked.count];if(!tier){const rate=mediaMailEstimate(checked.count);const booksCents=OFFERS[3].books+(checked.count-3)*ADDITIONAL_BOOK_CENTS;return {...checked,...rate,approved:true,booksCents,offerShippingCents:rate.mediaMailCents,offerTotalCents:booksCents+rate.mediaMailCents};}return {...checked,approved:true,booksCents:tier.books,offerShippingCents:tier.shipping,offerTotalCents:tier.books+tier.shipping};}
export function validateZip(zip){return typeof zip==="string"&&/^\d{5}(?:-\d{4})?$/.test(zip);}
export function validateDedication(value){return typeof value==="string"&&value.length<=120&&!/[\r\n<>]/.test(value);}
