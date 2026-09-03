import { supabase } from '../lib/supabase';

export async function listMyNotifications(limit = 50) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('notifications').select('id,topic,entity_id,title,body,read_at,created_at').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  if (!supabase) return { id: notificationId, demo: true };
  const { data, error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId).select('id,read_at').single();
  if (error) throw error;
  return data;
}
