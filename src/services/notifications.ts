import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export interface PushRegistrationResult { enabled: boolean; token?: string; reason?: string }

export async function registerForPush(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') return { enabled:false, reason:'native_only' };
  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return { enabled: false, reason: 'permission_denied' };
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return { enabled:false, reason:'eas_project_not_linked' };
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { error } = await supabase.from('push_devices').upsert({
        user_id: auth.user.id,
        expo_push_token: token,
        platform: Platform.OS,
        enabled: true,
      }, { onConflict: 'expo_push_token' });
      if (error) throw error;
    }
  }
  return { enabled: true, token };
}
