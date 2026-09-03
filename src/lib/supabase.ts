import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { config, hasSupabaseConfig } from './config';

export const supabase = hasSupabaseConfig
  ? createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

let nativeAuthRefreshBound = false;
export function bindNativeAuthRefresh() {
  if (!supabase || Platform.OS === 'web' || nativeAuthRefreshBound) return () => {};
  nativeAuthRefreshBound = true;
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
  if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
  return () => {
    sub.remove();
    nativeAuthRefreshBound = false;
  };
}
