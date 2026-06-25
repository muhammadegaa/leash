import { NextRequest, NextResponse } from "next/server";
import { runLead } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

// Some webhook providers verify the endpoint with a GET challenge. Echo it back.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("challenge") ?? req.nextUrl.searchParams.get("hub.challenge");
  if (c) return new NextResponse(c, { status: 200 });
  return NextResponse.json({ ok: true, hook: "wassist" });
}

// Wassist WhatsApp inbound webhook — the live on-stage trigger. A judge texts the
// UK number, Wassist POSTs here, and the lead flows through all three agents.
// Reliability first: we verify the secret where it is sent but never drop a real
// message because of a header-name guess.
export async function POST(req: NextRequest) {
  const secret = process.env.WASSIST_WEBHOOK_SECRET;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Verify the secret across the places a provider might put it (informational).
  const provided =
    req.headers.get("x-wassist-secret") ??
    req.headers.get("x-webhook-secret") ??
    req.headers.get("x-hook-secret") ??
    req.headers.get("x-signature") ??
    (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null) ??
    req.nextUrl.searchParams.get("secret") ??
    (body.secret as string | undefined) ??
    null;
  const verified = !secret || (provided != null && provided === secret);

  const { message, contact } = extract(body);
  if (!message) return NextResponse.json({ ok: true, skipped: "no text message", verified });

  const { leadId } = await runLead({ contact, message, source: "whatsapp" });
  return NextResponse.json({ ok: true, leadId, verified });
}

// Dig the message + sender out of the common WhatsApp / Wassist payload shapes.
function extract(body: Record<string, unknown>): { message: string; contact: string } {
  const g = (o: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), o);

  // WhatsApp Cloud API style: entry[].changes[].value.messages[]
  const value = g(body, "entry.0.changes.0.value") as Record<string, unknown> | undefined;
  const waMsg = value ? (g(value, "messages.0") as Record<string, unknown> | undefined) : undefined;

  const message = String(
    (body.message as string) ??
      (body.text as string) ??
      (g(body, "text.body") as string) ??
      (g(body, "message.text") as string) ??
      (g(body, "data.message") as string) ??
      (waMsg ? (g(waMsg, "text.body") as string) : "") ??
      (body.content as string) ??
      ""
  ).trim();

  const contact = String(
    (body.from as string) ??
      (body.sender as string) ??
      (body.phone as string) ??
      (body.wa_id as string) ??
      (waMsg ? (waMsg.from as string) : "") ??
      (g(value ?? {}, "contacts.0.wa_id") as string) ??
      "whatsapp-user"
  );

  return { message, contact };
}
