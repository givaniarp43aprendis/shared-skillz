import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// URL e anon key são públicas por design (Supabase). RLS protege os dados.
export const SUPABASE_URL = "https://okrrkkhwwbsnuuddohte.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcnJra2h3d2JzbnV1ZGRvaHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTE5MTAsImV4cCI6MjEwMDU2NzkxMH0.fZJo_u3bkz6q000EATK1IfAL6Gxu7S3r0EQxNpilQvw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
