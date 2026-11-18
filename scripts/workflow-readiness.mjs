import fs from 'node:fs';

const simulatorFile='.eas/workflows/ios-simulator-development.yml';
const deviceFile='.eas/workflows/ios-device-development.yml';
const sourceFile='.eas/workflows/source-checks.yml';
const files=[simulatorFile,deviceFile,sourceFile];

let failed=false;
console.log('\nSanad EAS workflow readiness\n');

for(const file of files){
  const ok=fs.existsSync(file);
  console.log((ok?'PASS':'FAIL') + '  file:' + file);
  if(!ok) failed=true;
}

if(!failed){
  const sim=fs.readFileSync(simulatorFile,'utf8');
  const dev=fs.readFileSync(deviceFile,'utf8');
  const source=fs.readFileSync(sourceFile,'utf8');

  const sharedBuildChecks=[
    ['sim_checkout',sim.includes('eas/checkout')],
    ['sim_install',sim.includes('eas/install_node_modules')],
    ['sim_build_job',sim.includes('type: build')],
    ['sim_ios',sim.includes('platform: ios')],
    ['device_checkout',dev.includes('eas/checkout')],
    ['device_install',dev.includes('eas/install_node_modules')],
    ['device_build_job',dev.includes('type: build')],
    ['device_ios',dev.includes('platform: ios')],
  ];

  const branchChecks=[
    ['simulator_branch',sim.includes("branches: ['build/eas-development']")],
    ['device_branch',dev.includes("branches: ['build/ios-device']")],
    ['simulator_profile',sim.includes('profile: development-simulator')],
    ['device_profile',dev.includes('profile: development')],
    ['simulator_prebuild',sim.includes('npm run native:ios-preflight')],
    ['device_registration',dev.includes('type: apple-device-registration-request')],
    ['device_refresh_profile',dev.includes('refresh_ad_hoc_provisioning_profile: true')],
  ];

  const sourceChecks=[
    ['source_checkout',source.includes('eas/checkout')],
    ['source_install',source.includes('eas/install_node_modules')],
    ['source_checks_branch',source.includes("branches: ['check/eas-source']")],
    ['source_no_build_job',!source.includes('type: build')],
    ['source_no_platform_build',!source.includes('platform: ios')],
    ['source_typecheck',source.includes('npm run typecheck')],
    ['source_native_check',source.includes('npm run native:check')],
    ['source_workflow_check',source.includes('npm run workflow:check')],
    ['source_prebuild',source.includes('npm run native:ios-preflight')],
  ];

  for(const [name,pass] of [...sharedBuildChecks,...branchChecks,...sourceChecks]){
    console.log((pass?'PASS':'FAIL') + '  ' + name);
    if(!pass) failed=true;
  }
}

if(failed) process.exitCode=1;
