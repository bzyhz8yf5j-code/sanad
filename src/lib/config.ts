export const OPENFREEMAP_LIBERTY_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export const config = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? '',
  mapProvider: process.env.EXPO_PUBLIC_MAP_PROVIDER ?? '',
  mapTilesToken: process.env.EXPO_PUBLIC_MAP_TILES_TOKEN ?? '',
};

export const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseKey);
export const isProductionRuntime = config.appEnv === 'production';
export const hasConfiguredMapStyle = Boolean(config.mapStyleUrl);
export const canUseDevelopmentMapFallback = !isProductionRuntime;

export function effectiveMapStyleUrl() {
  if (config.mapStyleUrl) return config.mapStyleUrl;
  return canUseDevelopmentMapFallback ? OPENFREEMAP_LIBERTY_STYLE : '';
}

export function mapProviderLabel() {
  if (config.mapProvider === 'openfreemap' || effectiveMapStyleUrl().includes('openfreemap.org')) return 'OpenFreeMap / OpenStreetMap';
  return config.mapProvider || 'مزود خرائط مخصص';
}
