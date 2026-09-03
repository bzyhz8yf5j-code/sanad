export const config = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? '',
  mapTilesToken: process.env.EXPO_PUBLIC_MAP_TILES_TOKEN ?? '',
};

export const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseKey);
