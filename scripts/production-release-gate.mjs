import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const app = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const eas = JSON.parse(fs.readFileSync('eas.json', 'utf8'));

const checks = [];
const add = (name, ok, detail = '') => checks.push({ name, ok, detail });

add('version_match', pkg.version === app.version, pkg.version + ' / ' + app.version);
add('eas_owner', app.owner === 'engmohammad92s-team', app.owner || 'missing');
add('eas_project_id', app.extra?.eas?.projectId === 'd8021acb-3d10-41f5-8623-f41ac8e64e8b', app.extra?.eas?.projectId || 'missing');
add('ios_bundle', app.ios?.bundleIdentifier === 'iq.sanad.app', app.ios?.bundleIdentifier || 'missing');
add('production_profile', Boolean(eas.build?.production), 'eas.json');
add('production_environment', eas.build?.production?.environment === 'production', eas.build?.production?.environment || 'missing');

const iconPath = app.icon;
add('official_icon_configured', Boolean(iconPath && fs.existsSync(iconPath)), iconPath || 'app.icon missing');

const productionMapStyle =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ||
  eas.build?.production?.env?.EXPO_PUBLIC_MAP_STYLE_URL ||
  '';
add('production_map_style', Boolean(productionMapStyle), productionMapStyle ? 'configured' : 'EXPO_PUBLIC_MAP_STYLE_URL missing');

console.log('\nSanad production release gate\n');
for (const check of checks) {
  console.log((check.ok ? 'PASS' : 'BLOCK') + '  ' + check.name + (check.detail ? ' — ' + check.detail : ''));
}

const blocked = checks.filter((check) => !check.ok);
if (blocked.length) {
  console.error('\nProduction release blocked: ' + blocked.length + ' requirement(s) incomplete.');
  process.exitCode = 1;
} else {
  console.log('\nProduction release gate: PASS');
}
