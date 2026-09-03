import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const expected={
  'expo':'~57.0.0',
  'expo-router':'~57.0.16',
  'expo-dev-client':'~57.0.16',
  'expo-document-picker':'~57.0.1',
  'expo-file-system':'~57.0.6',
  'expo-linking':'~57.0.8',
  'expo-notifications':'~57.0.14',
  'expo-secure-store':'~57.0.1',
  'expo-sharing':'~57.0.15',
  'expo-status-bar':'~57.0.1',
  'expo-constants':'~57.0.15',
  'expo-image-picker':'~57.0.14',
  'expo-location':'~57.0.13',
  'expo-sqlite':'~57.0.1',
  'expo-crypto':'~57.0.2',
  '@react-native-async-storage/async-storage':'2.2.0',
  'react-native-safe-area-context':'~5.7.0',
  'react-native-screens':'~4.26.0',
  'react':'19.2.3',
  'react-dom':'19.2.3',
  'react-native':'0.86.0',
  'react-native-web':'~0.21.0'
};
let failed=false;
console.log('\nSanad Expo SDK 57 alignment\n');
for(const [name,want] of Object.entries(expected)){
  const got=pkg.dependencies?.[name];
  const ok=got===want;
  console.log(`${ok?'PASS':'FAIL'}  ${name} — ${got||'missing'}${ok?'':` (expected ${want})`}`);
  if(!ok) failed=true;
}
const nodeOk=Boolean(pkg.engines?.node?.includes('22.13'));
console.log(`${nodeOk?'PASS':'FAIL'}  node engine — ${pkg.engines?.node||'missing'}`);
if(!nodeOk) failed=true;
if(failed) process.exitCode=1;
