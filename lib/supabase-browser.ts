"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Auth is enabled only when Supabase is configured. With no keys (local/mock) the
// dashboard renders without a login gate so the full loop still runs.
export const authEnabled = Boolean(url && key);

export const supabaseBrowser: SupabaseClient | null = authEnabled
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
