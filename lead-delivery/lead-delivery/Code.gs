// Separate Technix Apps Script project, not Rachel's project. Do not deploy yet.
// Script properties required: LEAD_ENABLED, LEAD_TOKEN, LEAD_RECIPIENT.
// Sender is the Google account that deploys this script (Execute as: me, access: Anyone). Recipient lives only in LEAD_RECIPIENT.
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function emailHtml(d){
  var number=d.phone.replace(/^\+/,'').replace(/^0/,'972');
  var isTest=/^(בדיקה|ניסוי)$/.test(String(d.name||'').trim());
  function row(l,v,big){return '<tr><td style="padding:14px 0;border-bottom:1px solid #ccd5d1"><div style="font-size:12px;color:#53666a;margin-bottom:4px">'+l+'</div><div style="font-size:'+(big?'20px;font-weight:bold':'16px')+';line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:#172d32">'+escapeHtml(v||'לא נמסר')+'</div></td></tr>'}
  function btn(bg,href,label){return '<td style="padding:0 0 0 10px"><a href="'+href+'" style="display:block;background:'+bg+';color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;text-align:center;padding:14px 10px;border-radius:28px">'+label+'</a></td>'}
  function dead(label){return '<td style="padding:0 0 0 10px"><span style="display:block;background:#b8c5bb;color:#5b6b66;font-weight:bold;font-size:16px;text-align:center;padding:14px 10px;border-radius:28px">'+label+'</span></td>'}
  return '<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#f3f4ee;font-family:Arial,Helvetica,sans-serif;color:#172d32">'
  +'<div style="max-width:600px;margin:0 auto;padding:16px">'
  +'<div style="background:#172d32;color:#ffffff;border-radius:20px 20px 0 0;padding:22px 26px"><div style="font-size:13px;letter-spacing:1px;color:#e6c4b6">טכניקס שירותי חשמל</div><div style="font-size:26px;font-weight:bold;margin-top:6px">'+(isTest?'פנייה לבדיקה':'פנייה חדשה מהאתר')+'</div></div>'
  +'<div style="background:#fcfcf8;padding:8px 26px 26px;border-radius:0 0 20px 20px">'
  +'<table role="presentation" width="100%" style="margin:14px 0 0;border-collapse:separate;border-spacing:0"><tr>'+(isTest?dead('חיוג מהיר')+dead('וואטסאפ'):btn('#285e82','tel:+'+number,'חיוג מהיר')+btn('#172d32','https://wa.me/'+number,'וואטסאפ'))+'</tr></table>'+(isTest?'<p style="font-size:12px;color:#99462b;margin:10px 0 0">פנייה לבדיקה: כפתורי החיוג והוואטסאפ מושבתים.</p>':'')
  +'<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:8px">'+row('שם',d.name,true)+row('טלפון',d.phone,true)+row('יישוב',d.town)+row('פרטי הפנייה',d.message)+'</table>'
  +'<p style="font-size:12px;color:#53666a;line-height:1.7;margin:18px 0 0">התקבל: '+escapeHtml(d.received_at)+' | מזהה: '+escapeHtml(d.request_id)+'<br>הפרטים נמסרו על ידי הפונה ולא אומתו. אין להשיב למייל זה, יש לחזור ללקוח בטלפון או בוואטסאפ.</p>'
  +'</div></div></body></html>';
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
      MailApp.sendEmail({to:to,subject:(/^(בדיקה|ניסוי)$/.test(String(d.name).trim())?'[בדיקה] ':'')+'טכניקס: פנייה חדשה מהאתר',body:['שם: '+d.name,'טלפון: '+d.phone,'יישוב: '+d.town,'פרטי הפנייה: '+d.message,'מקור: '+d.source,'מועד: '+d.received_at,'מזהה: '+d.request_id].join('\n'),htmlBody:emailHtml(d),name:'טכניקס | פניות מהאתר'});
      p.setProperty(key,JSON.stringify({status:'sent',at:Date.now()}));return out({ok:true});
    }catch(err){p.setProperty(key,JSON.stringify({status:'uncertain',at:Date.now()}));return out({ok:false,error:'delivery_uncertain'})}
  }finally{lock.releaseLock()}
}
// Before activation, install a daily time trigger for this cleanup. Status retention: seven days.
function cleanupRequestStatus(){var p=PropertiesService.getScriptProperties(),all=p.getProperties(),cutoff=Date.now()-7*86400000;Object.keys(all).filter(function(k){return k.indexOf('request_')===0}).forEach(function(k){try{if(JSON.parse(all[k]).at<cutoff)p.deleteProperty(k)}catch(e){}})}
