import { NextRequest, NextResponse } from "next/server";
import { runLead } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

// Drives the UNATTENDED log: each call injects one realistic inbound lead. A
// scheduler (Modal / cron / the in-app autopilot) hits this so the system keeps
// running and logging on its own — proving it ran while no one was touching it.
const POOL: { contact: string; message: string }[] = [
  { contact: "+44 7700 900111", message: "Burst pipe under the kitchen sink flooding the floor, 14 Bywater St SW3, please come now" },
  { contact: "+44 7700 900222", message: "Dripping tap in the bathroom, not urgent, can you replace the washer this week?" },
  { contact: "+44 7700 900333", message: "Boiler completely dead, no hot water, family of 4, need a replacement quote, flat 2, 8 Maddox Rd" },
  { contact: "+44 7700 900444", message: "Toilet won't stop running" },
  { contact: "+44 7700 900555", message: "hi" }, // ugly case: too vague -> should escalate
  { contact: "+44 7700 900666", message: "you there??" }, // ugly case -> escalate
  { contact: "+44 7700 900777", message: "Blocked drain in the garden, water backing up, 22 Elm Park Gardens" },
  { contact: "+44 7700 900888", message: "Radiator leak in the bedroom staining the ceiling below, urgent, 5 Cale Street" },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const n = Math.min(Number(body.count ?? 1), 8);
  const picked: string[] = [];
  for (let i = 0; i < n; i++) {
    const lead = POOL[Math.floor((Date.now() / 1000 + i) % POOL.length)];
    const { leadId } = await runLead({ ...lead, source: "simulator" });
    if (leadId) picked.push(leadId);
  }
  return NextResponse.json({ ok: true, injected: picked.length });
}
