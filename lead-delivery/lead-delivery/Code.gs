// Separate Technix Apps Script project, not Rachel's project. Do not deploy yet.
// Script properties required: LEAD_ENABLED, LEAD_TOKEN, LEAD_RECIPIENT.
// Sender is the Google account deploying this script. Obtain owner decision first.
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function emailHtml(d){
  var number=d.phone.replace(/^0/,'972').replace(/^\+/,'');
  var rows=[['שם',d.name],['טלפון',d.phone],['יישוב',d.town],['פרטי הפנייה',d.message],['עמוד מקור',d.source],['מועד קבלה בשרת',d.received_at],['מזהה פנייה',d.request_id]];
  return '<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#f3f4ee;color:#172d32;font-family:Arial,sans-serif"><div style="max-width:600px;margin:24px auto;background:#fcfcf8;padding:28px;border-radius:20px"><p style="color:#99462b">טכניקס שירותי חשמל</p><h1 style="font-size:26px">פנייה חדשה מהאתר</h1><table role="presentation" style="width:100%;border-collapse:collapse">'+rows.map(function(r){return '<tr><th style="text-align:right;vertical-align:top;padding:12px;border-bottom:1px solid #ccd5d1">'+r[0]+'</th><td style="text-align:right;padding:12px;border-bottom:1px solid #ccd5d1;white-space:pre-wrap;overflow-wrap:anywhere">'+escapeHtml(r[1]||'לא נמסר')+'</td></tr>'}).join('')+'</table><p style="line-height:3"><a style="display:inline-block;background:#172d32;color:#fff;padding:3px 20px;border-radius:24px;text-decoration:none" href="tel:+'+number+'">חיוג לפונה</a> <a style="display:inline-block;background:#285e82;color:#fff;padding:3px 20px;border-radius:24px;text-decoration:none" href="https://wa.me/'+number+'">צ׳אט בוואטסאפ</a></p><p style="font-size:13px;color:#53666a">הפרטים נמסרו על ידי הפונה. אין להסתמך עליהם כאימות זהות. אין להשיב לכתובת המערכת.</p></div></body></html>';
}
function doPost(e){
  function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
  var p=PropertiesService.getScriptProperties();
  if(p.getProperty('LEAD_ENABLED')!=='true')return out({ok:false,error:'inactive'});
  var d;try{if(!e||!e.postData||e.postData.contents.length>15000)throw Error();d=JSON.parse(e.postData.contents)}catch(err){return out({ok:false,error:'invalid_input'})}
  var token=p.getProperty('LEAD_TOKEN'),to=p.getProperty('LEAD_RECIPIENT');
  if(!token||!to||d.token!==token)return out({ok:false,error:'unauthorized'});
  if(typeof d.name!=='string'||!d.name.trim()||d.name.length>120||typeof d.phone!=='string'||!/^(?:0[23489]\d{7}|05\d{8}|\+972[23489]\d{7}|\+9725\d{8})$/.test(d.phone)||!/^[a-zA-Z0-9_-]{16,80}$/.test(d.request_id||''))return out({ok:false,error:'invalid_input'});
  for(var field in {town:120,message:4000,source:300,received_at:40}){if(typeof d[field]!=='string'||d[field].length>({town:120,message:4000,source:300,received_at:40})[field])return out({ok:false,error:'invalid_input'})}
  var lock=LockService.getScriptLock();if(!lock.tryLock(5000))return out({ok:false,error:'busy'});
  try{
    // Store request status only, never inquiry contents. Sending/uncertain is not retried automatically.
    var key='request_'+d.request_id,previous=p.getProperty(key);
    if(previous){var old=JSON.parse(previous);return out(old.status==='sent'?{ok:true}:{ok:false,error:'delivery_uncertain'})}
    p.setProperty(key,JSON.stringify({status:'sending',at:Date.now()}));
    try{
      MailApp.sendEmail({to:to,subject:'טכניקס: פנייה חדשה מהאתר',body:['שם: '+d.name,'טלפון: '+d.phone,'יישוב: '+d.town,'פרטי הפנייה: '+d.message,'מקור: '+d.source,'מועד: '+d.received_at,'מזהה: '+d.request_id].join('\n'),htmlBody:emailHtml(d),name:'טכניקס | פניות מהאתר'});
      p.setProperty(key,JSON.stringify({status:'sent',at:Date.now()}));return out({ok:true});
    }catch(err){p.setProperty(key,JSON.stringify({status:'uncertain',at:Date.now()}));return out({ok:false,error:'delivery_uncertain'})}
  }finally{lock.releaseLock()}
}
// Before activation, install a daily time trigger for this cleanup. Status retention: seven days.
function cleanupRequestStatus(){var p=PropertiesService.getScriptProperties(),all=p.getProperties(),cutoff=Date.now()-7*86400000;Object.keys(all).filter(function(k){return k.indexOf('request_')===0}).forEach(function(k){try{if(JSON.parse(all[k]).at<cutoff)p.deleteProperty(k)}catch(e){}})}
