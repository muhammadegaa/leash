import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { AgentEvent, Control, Lead, Stats } from "./types";

// ---------------------------------------------------------------------------
// Backbone. Supabase when configured (realtime live dashboard), otherwise an
// in-memory store so the whole system runs with zero credentials (mock-first).
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = Boolean(url && serviceKey);

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_sb) _sb = createClient(url!, serviceKey!, { auth: { persistSession: false } });
  return _sb;
}

// In-memory fallback — survives across requests in a single dev/server process.
type Mem = { events: AgentEvent[]; leads: Lead[]; control: Control };
const g = globalThis as unknown as { __handoff?: Mem };
function mem(): Mem {
  if (!g.__handoff) {
    g.__handoff = { events: [], leads: [], control: { paused: false, updated_at: new Date().toISOString() } };
  }
  return g.__handoff;
}

// --- Events ---------------------------------------------------------------

export async function emitEvent(
  e: Omit<AgentEvent, "id" | "created_at">
): Promise<AgentEvent> {
  if (usingSupabase) {
    const { data, error } = await sb().from("events").insert(e).select().single();
    if (error) throw error;
    return data as AgentEvent;
  }
  const row: AgentEvent = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...e };
  mem().events.unshift(row);
  return row;
}

export async function updateEvent(
  id: string,
  patch: Partial<Pick<AgentEvent, "status" | "decision" | "reason">>
): Promise<void> {
  if (usingSupabase) {
    const { error } = await sb().from("events").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  const ev = mem().events.find((x) => x.id === id);
  if (ev) Object.assign(ev, patch);
}

export async function getEvent(id: string): Promise<AgentEvent | null> {
  if (usingSupabase) {
    const { data } = await sb().from("events").select().eq("id", id).single();
    return (data as AgentEvent) ?? null;
  }
  return mem().events.find((x) => x.id === id) ?? null;
}

export async function listEvents(limit = 100): Promise<AgentEvent[]> {
  if (usingSupabase) {
    const { data, error } = await sb()
      .from("events")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as AgentEvent[]) ?? [];
  }
  return mem().events.slice(0, limit);
}

export async function approvalQueue(): Promise<AgentEvent[]> {
  if (usingSupabase) {
    const { data } = await sb()
      .from("events")
      .select()
      .eq("status", "awaiting_approval")
      .order("created_at", { ascending: false });
    return (data as AgentEvent[]) ?? [];
  }
  return mem().events.filter((e) => e.status === "awaiting_approval");
}

// --- Control (the kill switch) --------------------------------------------

export async function getControl(): Promise<Control> {
  if (usingSupabase) {
    const { data } = await sb().from("control").select().eq("id", 1).single();
    return { paused: !!data?.paused, updated_at: data?.updated_at ?? new Date().toISOString() };
  }
  return mem().control;
}

export async function setPaused(paused: boolean): Promise<Control> {
  const updated_at = new Date().toISOString();
  if (usingSupabase) {
    await sb().from("control").update({ paused, updated_at }).eq("id", 1);
    return { paused, updated_at };
  }
  mem().control = { paused, updated_at };
  return mem().control;
}

// --- Leads ----------------------------------------------------------------

export async function createLead(
  l: Omit<Lead, "id" | "created_at" | "stage"> & { stage?: Lead["stage"] }
): Promise<Lead> {
  const stage = l.stage ?? "intake";
  if (usingSupabase) {
    const { data, error } = await sb().from("leads").insert({ ...l, stage }).select().single();
    if (error) throw error;
    return data as Lead;
  }
  const row: Lead = { id: crypto.randomUUID(), created_at: new Date().toISOString(), stage, ...l } as Lead;
  mem().leads.unshift(row);
  return row;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  if (usingSupabase) {
    await sb().from("leads").update(patch).eq("id", id);
    return;
  }
  const lead = mem().leads.find((x) => x.id === id);
  if (lead) Object.assign(lead, patch);
}

// --- Stats (cognitive load saved) -----------------------------------------

export async function getStats(): Promise<Stats> {
  const events = await listEvents(1000);
  const handled_autonomously = events.filter((e) => e.decision === "auto_proceed").length;
  const blocked = events.filter((e) => e.decision === "blocked").length;
  const needed_human = events.filter(
    (e) => e.decision === "escalate" || e.status === "awaiting_approval"
  ).length;
  return { handled_autonomously, needed_human, blocked, total_events: events.length };
}
