// USPS Media Mail retail — Notice 123, effective July 12, 2026.
// Source: https://pe.usps.com/text/dmm300/Notice123.htm
// USPS seasonal surcharges effective October 4, 2026 target competitive
// services (Priority Mail / Ground Advantage), not Media Mail.
// Review this table whenever USPS publishes a Media Mail change.
// Weight includes packaging: EXACTLY 8 oz (0.5 lb) per book as instructed.
export const MEDIA_MAIL_RETAIL_CENTS=Object.freeze([
  439,513,586,660,734,808,881,955,1029,1102,
  1176,1250,1323,1397,1471,1544,1618,1692,1765,1839,
  1913,1986,2060,2134,2207,2281,2355,2429,2502,2576,
  2650,2723,2797,2871,2944,3018,3092,3165,3239,3313,
  3386,3460,3534,3607,3681,3755,3828,3902,3976,4049,
  4123,4197,4271,4344,4418,4492,4565,4639,4713,4786,
  4860,4934,5007,5081,5155,5228,5302,5376,5449,5523
]);
export const BOOK_WEIGHT_OZ=8;
export function mediaMailEstimate(count){
  if(!Number.isSafeInteger(count)||count<1||count>100)throw Error("Invalid copy count");
  const ounces=count*BOOK_WEIGHT_OZ;
  const pounds=Math.ceil(ounces/16);
  if(pounds>MEDIA_MAIL_RETAIL_CENTS.length)throw Error("Exceeds USPS 70 lb limit");
  return {estimatedBookWeightOz:ounces, billablePounds:pounds, mediaMailCents:MEDIA_MAIL_RETAIL_CENTS[pounds-1],rateType:"USPS Media Mail Retail (published rate, not live label quote)"};
}
