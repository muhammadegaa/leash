import { NextRequest, NextResponse } from "next/server";
import { getControl, setPolicy, emitEvent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = await getControl();
  return NextResponse.json({ threshold: c.threshold, cap: c.cap, business: c.business });
}

// The onboarding deploy. Persists the real governance policy the agents enforce.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawT = body.threshold == null ? undefined : Number(body.threshold);
  const threshold = rawT == null ? undefined : rawT > 1 ? rawT / 100 : rawT; // accept 70 or 0.7
  const cap = body.cap == null ? undefined : Number(body.cap);
  const business = body.business == null ? undefined : String(body.business).slice(0, 120);

  const control = await setPolicy({ threshold, cap, business });
  await emitEvent({
    lead_id: null,
    agent: "system",
    action: `policy deployed for "${control.business ?? "your agents"}"`,
    input: { threshold: control.threshold, cap: control.cap, business: control.business },
    confidence: null,
    decision: "approved",
    status: "done",
    reason: `Agents now auto-run above ${(control.threshold * 100).toFixed(0)}% confidence and escalate payments over £${control.cap}.`,
  });
  return NextResponse.json({ ok: true, threshold: control.threshold, cap: control.cap, business: control.business });
}
