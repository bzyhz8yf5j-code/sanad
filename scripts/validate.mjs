import fs from 'node:fs';
import path from 'node:path';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';

const root = process.cwd();
const required = [
  'package.json','app.json','app/_layout.tsx','app/(tabs)/geo.tsx','app/auth/login.tsx','app/auth/register.tsx','app/offices/apply.tsx',
  'src/domain/alignment.ts','src/domain/risk.ts','src/domain/professionalApproval.ts','src/domain/media.ts','src/domain/offlineSync.ts','src/domain/deepLinks.ts',
  'src/services/auth.ts','src/services/offices.ts','src/services/messaging.ts','src/services/sharing.ts','src/services/propertyMedia.ts',
  'supabase/migrations/20260827185300_sanad_core_001_006.sql','supabase/migrations/20260827185409_sanad_core_007_013.sql',
  'supabase/migrations/20260827185440_sanad_core_014_020.sql','supabase/migrations/20260827185523_sanad_core_021_025.sql',
  'supabase/migrations/20260827185553_sanad_core_026_029.sql','supabase/migrations/20260827190616_live_backend_hardening_030.sql',
  'supabase/migrations/20260827190635_performance_indexes_031.sql',
  'supabase/functions/review-professional-application/index.ts','supabase/functions/resolve-transaction/index.ts',
  'supabase/functions/create-office-invitation/index.ts','supabase/functions/process-notification-queue/index.ts','supabase/functions/check-map-source/index.ts',
  'supabase/functions/submit-office-application/index.ts','supabase/functions/review-office-application/index.ts','supabase/functions/start-conversation/index.ts',
  'supabase/functions/create-share-link/index.ts','supabase/functions/resolve-share-link/index.ts',
  'docs/SUPABASE_LIVE_BASELINE.md','app/field.tsx','src/services/fieldMode.ts','src/components/SanadMap.native.tsx','supabase/migrations/20260828015457_native_field_mode_033.sql','supabase/migrations/20260828015621_native_field_rpc_hardening_034.sql','supabase/migrations/20260828015715_native_field_performance_035.sql','docs/NATIVE_BUILD.md'
];
for (const file of required) if (!fs.existsSync(path.join(root,file))) throw new Error(`missing_required_file:${file}`);

const sourceFiles=[];
function walk(dir){ for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ const full=path.join(dir,entry.name); if(entry.isDirectory() && !['node_modules','.git','.tmp-domain'].includes(entry.name)) walk(full); else if(entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) sourceFiles.push(full); } }
walk(root);
let diagnostics=[];
for(const file of sourceFiles){
  const source=fs.readFileSync(file,'utf8');
  const result=ts.transpileModule(source,{ compilerOptions:{ target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext, jsx:ts.JsxEmit.ReactJSX }, fileName:file, reportDiagnostics:true });
  diagnostics.push(...(result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>({file,message:ts.flattenDiagnosticMessageText(d.messageText,' ')})));
}
if(diagnostics.length){ console.error(diagnostics); process.exit(1); }

const migrationDir=path.join(root,'supabase/migrations');
const sql=fs.readdirSync(migrationDir).filter(x=>x.endsWith('.sql')).sort().map(x=>fs.readFileSync(path.join(migrationDir,x),'utf8')).join('\n');
for(const token of [
  'enable row level security','professional_admin_update','properties_office_insert','messages_member_insert','audit_admin_read',
  'handle_new_user','profiles_read','conversation_members_read','enforce_property_publish_gate','appointments_office_idx','field_sessions','field_observations','capture_field_observation','field_observations_creator_idx'
]) if(!sql.includes(token)) throw new Error(`missing_database_guard:${token}`);

console.log(`validate: ok (${sourceFiles.length} TypeScript/TSX files syntax-checked)`);
