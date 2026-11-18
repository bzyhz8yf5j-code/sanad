import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const source=path.join(process.cwd(),'supabase/functions/_shared/reportPdf.ts');
const out=path.join(process.cwd(),'.tmp-report-pdf.mjs');
const js=ts.transpileModule(fs.readFileSync(source,'utf8'),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}
}).outputText;
fs.writeFileSync(out,js);
const report=await import(pathToFileURL(out).href+'?t='+Date.now());

assert.equal(report.sanitizeReportText('  a\n  b  '),'a b');
assert.equal(report.reportRateLimitExceeded(4),false);
assert.equal(report.reportRateLimitExceeded(5),true);
assert.deepEqual(
  report.wrapMeasuredText('واحد اثنين ثلاثة',8,(text)=>text.length),
  ['واحد','اثنين','ثلاثة']
);
assert.deepEqual(report.wrapMeasuredText('',100,(text)=>text.length),['—']);

fs.rmSync(out,{force:true});
console.log('test:report: ok (sanitization, wrapping, rate limit)');
