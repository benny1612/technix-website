# Technix lead delivery

The form, the Worker (worker.mjs in the repo root, which supersedes lead-relay.mjs here) and Code.gs are built but inert: no Apps Script is deployed, no secrets exist, no email was sent. Until LEAD_DELIVERY_ENABLED is set the form tells visitors to call or use WhatsApp. No endpoint, recipient, sender account or secret was copied from Rachel.

Reference checked: current api/lead.js in benny161299/Landing-page. Adapted design: same-origin server relay keeps the token out of the browser, then a separate Google Apps Script sends the email. Technix is a Cloudflare assets site, so the Vercel handler is not directly usable.

Files:
- lead-relay.mjs: candidate Cloudflare Worker, deliberately not configured in wrangler.jsonc.
- Code.gs: separate Apps Script project preparation, deliberately not deployed.
- email-preview.html: synthetic local visual preview only, not an email send.

Submitted inquiry fields: name, phone, town, message. Also request ID, server receipt timestamp, configured source origin. All appear in HTML and plain-text email, with quick-call and WhatsApp chat buttons. No attachments, location tracking, inferred information or Google Sheet storage. Email fields are HTML-escaped. Phone links use validated Israeli numbers. Unknown fields are not transmitted.

Before activation:
1. Owner supplies recipient and chooses the sending Google account. Approve any new account effects separately. No account access or sending authorization is implied by code preparation.
2. Confirm final form fields, privacy notice, retention and access, final domain, permitted origins and spam protection. Google account mail and Cloudflare infrastructure will process submitted data once enabled. No privacy-compliance guarantee.
3. Review provider terms/quotas, Apps Script deployment/access and sending limits, Cloudflare Worker/rate-limit availability and cost. No paid plan is authorized. Rate-limit binding is required and missing binding fails closed.
4. Store separate Technix token in managed secrets, never repo/browser/chat. Configure a separate Apps Script deployment URL and recipient. Preview must never enable delivery, including if production secrets exist.
5. Choose and implement activation config only after approval. Current assets routing remains unchanged. Wire client-side validation, stable retry request ID, timeout and honest delivery error UI. Do not show success until server confirms.
6. Approve a test recipient and exact synthetic test data before any test send. Verify actual delivery, all fields/buttons, duplicate suppression, spam limits, malicious markup and failed/uncertain delivery. Then request production activation approval.

Reliability: Apps Script email delivery is not transactional. Persisting a sending state before MailApp prevents blind duplicate retry after an unknown result, but a crash can leave a lead unsent. Such a request is flagged uncertain and needs manual reconciliation, not an automatic resend. Status IDs only are kept for seven days with the documented cleanup trigger; mailbox retention is a separate owner decision. No claim of exactly-once email delivery. No personal inquiry fields are written to status storage or application logs.
