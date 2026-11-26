// Technix lead relay. Inert until the owner sets LEAD_DELIVERY_ENABLED, ALLOWED_ORIGIN, APPS_SCRIPT_URL and LEAD_TOKEN as Worker secrets.
// Previews can never deliver: the request Origin and the request URL origin must both equal ALLOWED_ORIGIN.
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const clean=(k,max)=>typeof input[k]==='string'?input[k].trim().slice(0,max):'';
  const name=clean('name',120),phone=clean('phone',40).replace(/[\s().-]/g,'');
  if (!name || !/^(?:0[23489]\d{7}|05\d{8}|\+972[23489]\d{7}|\+9725\d{8})$/.test(phone)) return null;
  const request_id=clean('request_id',80);
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(request_id)) return null;
  return {name,phone,town:clean('town',120),message:clean('message',4000),request_id};
}
const reply=(status,reason)=>new Response(JSON.stringify({ok:status===200,reason}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default {async fetch(request,env) {
  const path=new URL(request.url).pathname;
  if(path!=='/api/lead')return env.ASSETS.fetch(request);
  // Order: inactive (503) before method, so an unconfigured site answers honestly.
  if(env.LEAD_DELIVERY_ENABLED!=='true')return reply(503,'inactive');
  if(request.method!=='POST')return reply(405,'method');
  if(!env.ALLOWED_ORIGIN||new URL(request.url).origin!==env.ALLOWED_ORIGIN||request.headers.get('Origin')!==env.ALLOWED_ORIGIN)return reply(403,'origin');
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,'content_type');
  if(Number(request.headers.get('Content-Length')||0)>16384)return reply(413,'size');
  // Deployment must provision the rate-limiter binding. Missing binding fails closed.
  if(!env.LEAD_RATE_LIMITER||!env.APPS_SCRIPT_URL||!env.LEAD_TOKEN)return reply(503,'not_configured');
  const ip=request.headers.get('CF-Connecting-IP');
  if(!ip)return reply(503,'not_configured');
  const limit=await env.LEAD_RATE_LIMITER.limit({key:ip});
  if(!limit.success)return reply(429,'rate_limit');
  let data;
  try{const text=await request.text();if(text.length>12000)return reply(413,'size');data=JSON.parse(text)}catch{return reply(400,'invalid_input')}
  if(typeof data._honey==='string'&&data._honey.trim())return reply(200,'accepted');
  const lead=validate(data);if(!lead)return reply(400,'invalid_input');
  let target;
  try{target=new URL(env.APPS_SCRIPT_URL);if(target.origin!=='https://script.google.com'||!/^\/macros\/s\/[^/]+\/exec$/.test(target.pathname))throw Error()}catch{return reply(503,'not_configured')}
  try{
    let result=await fetch(target.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...lead,token:env.LEAD_TOKEN,source:env.ALLOWED_ORIGIN,received_at:new Date().toISOString()}),redirect:'manual',signal:AbortSignal.timeout(25000)});
    if(result.status===302||result.status===303){const u=new URL(result.headers.get('Location'));if(u.origin!=='https://script.googleusercontent.com')throw Error();result=await fetch(u.href,{redirect:'error',signal:AbortSignal.timeout(10000)})}
    const body=await result.json();return result.ok&&body.ok===true?reply(200,'accepted'):reply(502,'delivery_not_confirmed');
  }catch{return reply(502,'delivery_not_confirmed')}
}};
