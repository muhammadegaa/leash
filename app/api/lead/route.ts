import { NextRequest, NextResponse } from "next/server";
import { runLead } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const contact = String(body.contact ?? "anonymous");
  const message = String(body.message ?? "").trim();
  const source = String(body.source ?? "form");
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
  const { leadId } = await runLead({ contact, message, source });
  return NextResponse.json({ ok: true, leadId });
}
