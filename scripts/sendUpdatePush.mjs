// Runs only in the private Actions job after successful Pages deployment.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function pushMessage(token, release) {
  return { message: { token, data: { type: 'APP_UPDATE', release },
    webpush: { headers: { TTL: '86400', Urgency: 'normal' } } } };
}
export function eligibleSubscription(fields, release, now = Date.now()) {
  const updated = Date.parse(fields.updatedAt?.timestampValue || '');
  return fields.enabled?.booleanValue === true && Boolean(fields.token?.stringValue)
    && Number.isFinite(updated) && now - updated < 90 * 86400000
    && fields.sentRelease?.stringValue !== release;
}
async function request(url, options = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
    if (![429,500,502,503,504].includes(response.status) || attempt === 3) return response;
    await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
  }
}
export async function main() {
  const raw = process.env.FIREBASE_PUSH_SERVICE_ACCOUNT;
  if (!raw || !process.env.PUSH_OWNER_UID) throw new Error('Push sender setup missing. No notification was sent.');
  const account = JSON.parse(raw);
  if (!account.project_id || !account.client_email || !account.private_key || account.project_id !== process.env.PUSH_PROJECT_ID)
    throw new Error('Sender service account must match the app Firebase project.');
  const worker = readFileSync(process.env.RELEASE_WORKER || 'dist/sw.js', 'utf8');
  const release = worker.match(/const VERSION = "([a-f0-9]{16})"/)?.[1];
  if (!release) throw new Error('Release worker fingerprint missing.');
  const liveUrl = process.env.PUSH_LIVE_URL || 'https://sharma11ji.github.io/SAB-TOOLS/';
  let live = false;
  for (let i = 0; i < 12; i++) {
    const response = await request(new URL(`sw.js?verify=${release}`,liveUrl));
    if (response.ok && (await response.text()).includes(`const VERSION = "${release}"`)) { live = true; break; }
    await new Promise(r => setTimeout(r, 10000));
  }
  if (!live) throw new Error('Expected release not live. No update notifications sent.');
  const now = Math.floor(Date.now()/1000);
  const enc = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const claims = { iss:account.client_email, scope:'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600 };
  const unsigned = `${enc({alg:'RS256',typ:'JWT'})}.${enc(claims)}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key,'base64url');
  const oauth = await request('https://oauth2.googleapis.com/token',{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`})});
  if (!oauth.ok) throw new Error('Sender authentication failed.');
  const access = (await oauth.json()).access_token;
  if (!access) throw new Error('Sender access token missing.');
  const headers = {Authorization:`Bearer ${access}`,'Content-Type':'application/json'};
  const project = encodeURIComponent(account.project_id);
  const collection = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/users/${encodeURIComponent(process.env.PUSH_OWNER_UID)}/pushSubscriptions`;
  let pageToken, sent=0, skipped=0, failed=0;
  do {
    const listUrl = new URL(collection); listUrl.searchParams.set('pageSize','100');
    if(pageToken) listUrl.searchParams.set('pageToken',pageToken);
    const listed = await request(listUrl,{headers});
    if (!listed.ok) throw new Error('Cannot read owner notification subscriptions.');
    const result = await listed.json();pageToken=result.nextPageToken;
    for(const entry of result.documents || []) {
      if(!eligibleSubscription(entry.fields || {},release)){skipped++;continue;}
      const delivery = await request(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`,{
        method:'POST',headers,body:JSON.stringify(pushMessage(entry.fields.token.stringValue,release))});
      if(!delivery.ok) {
        const error = await delivery.json().catch(()=>({}));
        const expired = error.error?.details?.some(d=>d.errorCode==='UNREGISTERED');
        if(expired) {
          const removed=await request(`https://firestore.googleapis.com/v1/${entry.name}`,{method:'DELETE',headers});
          if(!removed.ok) failed++;
        } else failed++;
        continue;
      }
      // FCM accepted is not proof of phone delivery. Mark for retry deduplication.
      sent++;
      const marked=await request(`https://firestore.googleapis.com/v1/${entry.name}?updateMask.fieldPaths=sentRelease`,{
        method:'PATCH',headers,body:JSON.stringify({fields:{sentRelease:{stringValue:release}}})});
      if(!marked.ok) failed++;
    }
  } while(pageToken);
  console.log(`FCM accepted: ${sent}; skipped: ${skipped}; failures: ${failed}. Acceptance is not a delivery receipt.`);
  if(failed) throw new Error('Some update notifications failed. Check sender permissions/API setup and retry the job.');
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error=>{
  // Do not print provider bodies, tokens, keys, or subscription documents.
  console.error(error.message);process.exitCode=1;
});
