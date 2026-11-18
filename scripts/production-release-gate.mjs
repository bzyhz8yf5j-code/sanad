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
add('production_map_https', /^https:\/\//i.test(productionMapStyle), productionMapStyle || 'missing');
add('production_map_not_demo', !/demotiles\.maplibre\.org/i.test(productionMapStyle), productionMapStyle || 'missing');

const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL || eas.build?.production?.env?.EXPO_PUBLIC_PRIVACY_URL || '';
const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL || eas.build?.production?.env?.EXPO_PUBLIC_TERMS_URL || '';
const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL || eas.build?.production?.env?.EXPO_PUBLIC_SUPPORT_URL || '';
add('privacy_url_https', /^https:\/\//i.test(privacyUrl), privacyUrl || 'EXPO_PUBLIC_PRIVACY_URL missing');
add('terms_url_https', /^https:\/\//i.test(termsUrl), termsUrl || 'EXPO_PUBLIC_TERMS_URL missing');
add('support_url_https', /^https:\/\//i.test(supportUrl), supportUrl || 'EXPO_PUBLIC_SUPPORT_URL missing');

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
