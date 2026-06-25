import { NextResponse } from "next/server";
import { getControl, approvalQueue, getStats, emitEvent } from "@/lib/store";

export const dynamic = "force-dynamic";

const SLA_MINUTES = 10; // approvals waiting longer than this get flagged

// The unattended operations sweep — what Modal runs on a schedule with no human
// present. It does REAL work on REAL state: enforce the review SLA on the approval
// queue, and write a health audit. This is the proof the company runs on its own.
export async function POST() {
  const ctrl = await getControl();

  // The kill switch governs the unattended runner too.
  if (ctrl.paused) {
    await emitEvent({
      lead_id: null, agent: "system", action: "unattended sweep halted by kill switch",
      input: null, confidence: null, decision: "blocked", status: "killed",
      reason: "Kill switch is on. The unattended runner refused to act.",
    });
    return NextResponse.json({ ok: true, halted: true });
  }

  const [queue, stats] = await Promise.all([approvalQueue(), getStats()]);
  const now = Date.now();
  const ages = queue.map((e) => Math.floor((now - new Date(e.created_at).getTime()) / 60000));
  const oldest = ages.length ? Math.max(...ages) : 0;
  const breached = ages.filter((a) => a >= SLA_MINUTES).length;

  if (breached > 0) {
    await emitEvent({
      lead_id: null, agent: "system",
      action: `SLA sweep: ${breached} approval(s) waiting over ${SLA_MINUTES}m for you`,
      input: { pending: queue.length, breached, oldest_min: oldest },
      confidence: null, decision: "escalate", status: "done",
      reason: `Unattended runner flagged ${breached} approval(s) breaching the ${SLA_MINUTES}-minute review SLA. Oldest has waited ${oldest}m.`,
    });
  } else {
    await emitEvent({
      lead_id: null, agent: "system",
      action: `health check: ${stats.handled_autonomously} handled, ${queue.length} awaiting you`,
      input: { total: stats.total_events, pending: queue.length },
      confidence: null, decision: "approved", status: "done",
      reason: `Agents live. ${stats.total_events} decisions on record, ${queue.length} awaiting a human, none past SLA. System nominal.`,
    });
  }

  return NextResponse.json({ ok: true, pending: queue.length, breached, oldest });
}
