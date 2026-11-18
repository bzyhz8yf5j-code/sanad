import fs from 'node:fs';
const files=['.eas/workflows/ios-simulator-development.yml','.eas/workflows/ios-device-development.yml','.eas/workflows/source-checks.yml'];
let failed=false;
console.log('\nSanad EAS workflow readiness\n');
for(const file of files){
  const ok=fs.existsSync(file);
  console.log((ok?'PASS':'FAIL') + '  file:' + file);
  if(!ok){ failed=true; continue; }
  const text=fs.readFileSync(file,'utf8');
  const checks=[
    ['checkout',text.includes('eas/checkout')],
    ['install_node_modules',text.includes('eas/install_node_modules')],
    ['build_job',text.includes('type: build')],
    ['ios',text.includes('platform: ios')],
  ];
  for(const [name,pass] of checks){
    console.log((pass?'PASS':'FAIL') + '  ' + file + ':' + name);
    if(!pass) failed=true;
  }
}
const sim=fs.readFileSync(files[0],'utf8');
const dev=fs.readFileSync(files[1],'utf8');
const source=fs.readFileSync(files[2],'utf8');
const branchChecks=[
  ['simulator_branch',sim.includes("branches: ['build/eas-development']")],
  ['device_branch',dev.includes("branches: ['build/ios-device']")],
  ['simulator_profile',sim.includes('profile: development-simulator')],
  ['device_profile',dev.includes('profile: development')],
  ['simulator_prebuild',sim.includes('npm run native:ios-preflight')],
  ['device_registration',dev.includes('type: apple-device-registration-request')],
  ['device_refresh_profile',dev.includes('refresh_ad_hoc_provisioning_profile: true')],
  ['source_checks_branch',source.includes("branches: ['check/eas-source']")],
  ['source_checks_no_build_job',!source.includes('type: build')],
  ['source_checks_prebuild',source.includes('npm run native:ios-preflight')],
];
for(const [name,pass] of branchChecks){
  console.log((pass?'PASS':'FAIL') + '  ' + name);
  if(!pass) failed=true;
}
if(failed) process.exitCode=1;
