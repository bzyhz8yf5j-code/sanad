import * as Crypto from 'expo-crypto';
import { isLikelyTransientSyncError } from '../domain/offlineSync';
import { supabase } from '../lib/supabase';
import { enqueueOfflineMutation } from './offlineSync';

export async function startPropertyConversation(propertyId: string) {
  if (!supabase) return { conversationId: 'demo-conversation', existing: false };
  const { data, error } = await supabase.functions.invoke('start-conversation', { body: { propertyId } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { conversationId: string; existing: boolean };
}

export async function listMessages(conversationId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('id,sender_id,body,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

async function currentUserId() {
  if (!supabase) return 'demo-user';
  const { data: session } = await supabase.auth.getSession();
  if (session.session?.user.id) return session.session.user.id;
  const { data: auth, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!auth.user) throw new Error('not_authenticated');
  return auth.user.id;
}

export async function sendMessage(conversationId: string, body: string) {
  const clean = body.trim();
  if (!clean) throw new Error('empty_message');

  if (!supabase) {
    return { id: 'demo-message', body: clean, created_at: new Date().toISOString(), queued: false };
  }

  const senderId = await currentUserId();
  const id = Crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payload = {
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    body: clean,
    created_at: createdAt,
  };

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select('id,body,created_at')
      .single();
    if (error) throw error;
    return {
      id: data?.id ?? id,
      body: data?.body ?? clean,
      created_at: data?.created_at ?? createdAt,
      queued: false,
    };
  } catch (error) {
    if (!isLikelyTransientSyncError(error)) throw error;
    await enqueueOfflineMutation({
      id: 'message:' + id,
      entity: 'message',
      entityId: id,
      operation: 'create',
      payload,
      createdAtIso: createdAt,
    });
    return { id, body: clean, created_at: createdAt, queued: true };
  }
}
