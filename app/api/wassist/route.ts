import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { runLead } from "@/lib/orchestrator";
import { emitEvent, recentLeadExists } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Some providers verify the endpoint with a GET challenge. Echo it back.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("challenge") ?? req.nextUrl.searchParams.get("hub.challenge");
  if (c) return new NextResponse(c, { status: 200 });
  return NextResponse.json({ ok: true, hook: "wassist" });
}

// Wassist WhatsApp inbound webhook — the live on-stage trigger.
// Verifies the Stripe-style HMAC-SHA256 signature over `${t}.${rawBody}`, then
// runs the message through Intake -> Qualifier -> Invoicer.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.WASSIST_WEBHOOK_SECRET;
  const sigHeader = req.headers.get("x-wassist-signature") ?? "";
  const eventType = req.headers.get("x-wassist-event") ?? "";

  // HMAC signature verification (constant time).
  let verified = false;
  let stale = false;
  if (secret && sigHeader) {
    const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
    if (parts.t && parts.v1) {
      const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
      try {
        verified = crypto.timingSafeEqual(Buffer.from(parts.v1, "hex"), Buffer.from(expected, "hex"));
      } catch {
        verified = false;
      }
      stale = Math.abs(Date.now() / 1000 - Number(parts.t)) > 300;
    }
  }

  const body = JSON.parse(raw || "{}") as WassistEvent;
  const type = body.event ?? eventType ?? "unknown";

  // Test event from the dashboard button — visible confirmation the hook is wired.
  if (type === "test.ping") {
    await emitEvent({
      lead_id: null,
      agent: "system",
      action: "Wassist webhook test received",
      input: { verified, type },
      confidence: null,
      decision: verified ? "approved" : null,
      status: "done",
      reason: verified ? "Signature verified (HMAC-SHA256)." : "Test ping received (no valid signature).",
    });
    return NextResponse.json({ ok: true, type, verified });
  }

  // Wassist fires BOTH message.received and subscription.message.received for one
  // physical message. Process the canonical one; ignore the subscription duplicate.
  if (type === "subscription.message.received") {
    return NextResponse.json({ ok: true, skipped: "duplicate of message.received", type });
  }

  // Dig the text + sender out of every shape Wassist might send (message.received,
  // subscription.message.received, nested data/entry wrappers).
  const b = body as Record<string, unknown>;
  const dig = (path: string): string => {
    const v = path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Record<string, unknown>)[k] : undefined), b);
    return typeof v === "string" ? v : "";
  };
  const message = (
    dig("message.body") || dig("message.text") || dig("text") ||
    dig("data.message.body") || dig("subscription.message.body") ||
    dig("entry.0.changes.0.value.messages.0.text.body")
  ).trim();
  const contact = (
    dig("from") || dig("contact.phoneNumber") || dig("data.from") ||
    dig("subscription.contact.phoneNumber") || dig("contact.name") || "whatsapp-user"
  );

  if (!message) {
    // Webhook fired but we couldn't find the text — capture the raw payload so it's
    // debuggable instead of silently dropped.
    await emitEvent({
      lead_id: null, agent: "system", action: `Wassist inbound received (${type}) — no parseable message`,
      input: { type, verified, raw: raw.slice(0, 800) }, confidence: null, decision: null, status: "done",
      reason: "Webhook fired but the message text wasn't in an expected field. Raw payload captured.",
    });
    return NextResponse.json({ ok: true, skipped: "no message body", type, verified });
  }

  // One physical message can be delivered twice (two subscribed events / a retry).
  if (await recentLeadExists(contact, message)) {
    return NextResponse.json({ ok: true, deduped: true, verified });
  }

  const { leadId } = await runLead({ contact, message, source: "whatsapp" });
  return NextResponse.json({ ok: true, leadId, verified, stale });
}

interface WassistEvent {
  event?: string;
  from?: string;
  text?: string;
  contact?: { name?: string; phoneNumber?: string };
  message?: { body?: string; text?: string };
}
