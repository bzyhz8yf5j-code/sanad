import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

const PUSH_TOKEN_KEY = 'sanad.push.token.v1';

export interface PushRegistrationResult {
  enabled: boolean;
  token?: string;
  reason?: string;
}

async function currentUserId() {
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  if (session.session?.user.id) return session.session.user.id;
  const { data: auth } = await supabase.auth.getUser();
  return auth.user?.id ?? null;
}

async function disableStoredTokenForUser(userId: string, token: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from('push_devices')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('expo_push_token', token);
  if (error) throw error;
}

export async function registerForPush(options: { requestPermission?: boolean } = {}): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') return { enabled: false, reason: 'native_only' };

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted' && options.requestPermission !== false) {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return { enabled: false, reason: 'permission_denied' };

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return { enabled: false, reason: 'eas_project_not_linked' };

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const userId = await currentUserId();

  if (supabase && userId) {
    const previous = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (previous && previous !== token) {
      await disableStoredTokenForUser(userId, previous).catch(() => {});
    }

    const { error } = await supabase.from('push_devices').upsert({
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'expo_push_token' });
    if (error) throw error;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  }

  return { enabled: true, token };
}

export async function refreshPushRegistrationIfAuthorized(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') return { enabled: false, reason: 'native_only' };
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return { enabled: false, reason: 'permission_not_granted' };
  return registerForPush({ requestPermission: false });
}

export async function unregisterPushForCurrentDevice() {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return { disabled: false, reason: 'no_local_token' };

  const userId = await currentUserId();
  if (supabase && userId) {
    await disableStoredTokenForUser(userId, token);
  }

  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  return { disabled: true };
}
