// Cliente do Supabase EXTERNO do usuário (projeto próprio, gerenciável pelo dashboard).
// A chave publishable/anon é pública por design — protegida por RLS no banco.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://fstznnundkmbyazrjzby.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zcmr-XWTjbDwlqo5eIE6FQ_Lb3jR2_l';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createExternalClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _client: ReturnType<typeof createExternalClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createExternalClient>, {
  get(_, prop, receiver) {
    if (!_client) _client = createExternalClient();
    return Reflect.get(_client, prop, receiver);
  },
});
