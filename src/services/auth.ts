import { supabase } from '../lib/supabase';

export async function signUp(email: string, password: string, displayName: string) {
  if (!supabase) throw new Error('backend_unavailable');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('backend_unavailable');
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentAccount() {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile, error } = await supabase.from('profiles').select('id,display_name,phone,role').eq('id', auth.user.id).single();
  if (error) throw error;
  return { user: auth.user, profile };
}
