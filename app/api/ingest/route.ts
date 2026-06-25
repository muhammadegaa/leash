import { NextRequest, NextResponse } from "next/server";
import { emitEvent, getControl } from "@/lib/store";
import { guardrail } from "@/lib/guardrail";
import { CONFIDENCE_THRESHOLD } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

// Handoff as a primitive ANY agent can adopt in one line. An external agent
// reports an intended action + its confidence and asks "may I act?". Handoff
// applies the same governance — kill switch, guardrail, confidence threshold —
// and returns allow:true|false. This is the oversight layer as a service.
//
//   POST /api/ingest
//   { agent, action, confidence?, input?, reason? }
//   -> { allow, status, decision }
export async function POST(req: NextRequest) {
  const key = process.env.HANDOFF_INGEST_KEY;
  if (key && req.headers.get("x-handoff-key") !== key) {
    return NextResponse.json({ error: "invalid ingest key" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agent = String(body.agent ?? "external");
  const action = String(body.action ?? "").slice(0, 300);
  const confidence = body.confidence == null ? null : Number(body.confidence);
  const input = (body.input as Record<string, unknown>) ?? null;
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  // 1. Kill switch — system level.
  if ((await getControl()).paused) {
    await emitEvent({ lead_id: null, agent, action, input, confidence, decision: "blocked", status: "killed",
      reason: "Global kill switch is on, so Handoff denied the action." });
    return NextResponse.json({ allow: false, status: "killed", decision: "blocked" });
  }

  // 2. Guardrail — scan the action + payload text.
  const scan = guardrail(action + " " + JSON.stringify(input ?? {}));
  if (scan.flagged) {
    await emitEvent({ lead_id: null, agent, action, input, confidence, decision: "blocked", status: "awaiting_approval",
      reason: scan.reason });
    return NextResponse.json({ allow: false, status: "awaiting_approval", decision: "blocked", reason: scan.reason });
  }

  // 3. Confidence threshold — low confidence goes to the human queue.
  if (confidence != null && confidence < CONFIDENCE_THRESHOLD) {
    await emitEvent({ lead_id: null, agent, action, input, confidence, decision: "escalate", status: "awaiting_approval",
      reason: `Confidence ${confidence.toFixed(2)} is below the ${CONFIDENCE_THRESHOLD} threshold, so it was escalated to a human.` });
    return NextResponse.json({ allow: false, status: "awaiting_approval", decision: "escalate" });
  }

  // 4. Cleared to act.
  await emitEvent({ lead_id: null, agent, action, input, confidence, decision: "auto_proceed", status: "done", reason: null });
  return NextResponse.json({ allow: true, status: "done", decision: "auto_proceed" });
}
