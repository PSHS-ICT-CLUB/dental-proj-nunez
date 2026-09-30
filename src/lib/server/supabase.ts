import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (!client) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      throw new Error('Image storage is not configured: set SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return client;
}

// Created on first use so routes that import this still load (and the app still
// builds) when Supabase isn't configured; only image uploads fail in that case.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = Reflect.get(getClient(), prop);
    return typeof value === 'function' ? value.bind(getClient()) : value;
  }
});
