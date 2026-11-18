import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const source=path.join(process.cwd(),'supabase/functions/_shared/expoPush.ts');
const out=path.join(process.cwd(),'.tmp-expo-push.mjs');
const js=ts.transpileModule(fs.readFileSync(source,'utf8'),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}
}).outputText;
fs.writeFileSync(out,js);

const push=await import(pathToFileURL(out).href+'?t='+Date.now());
assert.deepEqual(push.chunk([1,2,3,4,5],2),[[1,2],[3,4],[5]]);
assert.equal(push.classifyExpoHttpStatus(200),'ok');
assert.equal(push.classifyExpoHttpStatus(429),'retry');
assert.equal(push.classifyExpoHttpStatus(503),'retry');
assert.equal(push.classifyExpoHttpStatus(400),'permanent');
assert.equal(push.classifyExpoTicket({status:'ok',id:'ticket-1'}),'accepted');
assert.equal(push.classifyExpoTicket({status:'error',details:{error:'DeviceNotRegistered'}}),'disable_device');
assert.equal(push.classifyExpoTicket({status:'error',details:{error:'MessageRateExceeded'}}),'retry');
assert.equal(push.classifyExpoTicket({status:'error',details:{error:'MessageTooBig'}}),'permanent');
assert.equal(push.classifyExpoReceipt({status:'error',details:{error:'DeviceNotRegistered'}}),'disable_device');
assert.ok(push.retryDelayMs(2)>push.retryDelayMs(1));
assert.ok(push.retryDelayMs(20)<=15*60_000);

fs.rmSync(out,{force:true});
console.log('test:push: ok (batching, HTTP retry, tickets, receipts, dead-device handling)');
