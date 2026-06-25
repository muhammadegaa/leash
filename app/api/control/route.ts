import { NextRequest, NextResponse } from "next/server";
import { getControl, setPaused, emitEvent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getControl());
}

// The kill switch. Flipping it writes a system event so the action itself is audited.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const paused = Boolean(body.paused);
  const control = await setPaused(paused);
  await emitEvent({
    lead_id: null,
    agent: "system",
    action: paused ? "Kill switch engaged. All agents halted." : "Kill switch released. Agents resumed.",
    input: null,
    confidence: null,
    decision: paused ? "blocked" : "approved",
    status: paused ? "killed" : "done",
    reason: paused
      ? "Human pressed the global off-switch. No agent can act until released."
      : "Human released the off-switch.",
  });
  return NextResponse.json(control);
}
