import { supabase } from '../lib/supabase';

export async function startPropertyConversation(propertyId: string) {
  if (!supabase) return { conversationId: 'demo-conversation', existing: false };
  const { data, error } = await supabase.functions.invoke('start-conversation', { body: { propertyId } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { conversationId: string; existing: boolean };
}

export async function listMessages(conversationId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('messages').select('id,sender_id,body,created_at').eq('conversation_id', conversationId).order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(conversationId: string, body: string) {
  if (!supabase) return { id: 'demo-message', body };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('not_authenticated');
  const clean = body.trim();
  if (!clean) throw new Error('empty_message');
  const { data, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: auth.user.id, body: clean }).select('id,body,created_at').single();
  if (error) throw error;
  return data;
}
