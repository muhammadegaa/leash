import { NextRequest, NextResponse } from "next/server";
import { runLead } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

// Wassist WhatsApp inbound webhook — the live on-stage trigger. A judge texts the
// UK number, Wassist POSTs here, and the lead flows through all three agents.
// Tolerant of payload shape since Wassist's exact format is confirmed at wiring time.
export async function POST(req: NextRequest) {
  const secret = process.env.WASSIST_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-wassist-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  // Best-effort extraction across likely field names.
  const message =
    (body.message as string) ??
    (body.text as string) ??
    ((body.body as Record<string, unknown>)?.text as string) ??
    (body.content as string) ??
    "";
  const contact =
    (body.from as string) ??
    (body.sender as string) ??
    (body.phone as string) ??
    (body.wa_id as string) ??
    "whatsapp-user";

  if (!message) return NextResponse.json({ ok: true, skipped: "no message" });
  const { leadId } = await runLead({ contact, message, source: "whatsapp" });
  return NextResponse.json({ ok: true, leadId });
}
