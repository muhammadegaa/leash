import { emitEvent, createLead, updateLead, getControl, getEvent, updateEvent } from "./store";
import { guardrail } from "./guardrail";
import { qualify } from "./qualifier";
import { createInvoice } from "./paypal";
import { rate } from "./rates";
import type { Lead } from "./types";

export const CONFIDENCE_THRESHOLD = 0.7; // high -> auto. low -> human queue.
export const HUMAN_REVIEW_AMOUNT = 250; // >£250 -> human-in-the-loop regardless.

// The system-level off-switch. Every agent calls this FIRST. If paused it logs a
// halted event and refuses to act — this is enforced in code, not a prompt the
// agent can choose to ignore.
async function halted(agent: string, leadId: string | null): Promise<boolean> {
  const { paused } = await getControl();
  if (paused) {
    await emitEvent({
      lead_id: leadId,
      agent: "system",
      action: `${agent} halted by kill switch`,
      input: null,
      confidence: null,
      decision: "blocked",
      status: "killed",
      reason: "Global kill switch is ON. Agent refused to act (system-level, not advisory).",
    });
    return true;
  }
  return false;
}

export interface IntakeInput {
  contact: string;
  message: string;
  source: string; // whatsapp | form | simulator | external
}

// INTAKE -> QUALIFIER -> INVOICER, end to end.
export async function runLead(input: IntakeInput): Promise<{ leadId: string | null }> {
  if (await halted("intake", null)) return { leadId: null };

  const lead = await createLead({
    source: input.source,
    contact: input.contact,
    raw_message: input.message,
    amount: null,
  });

  await emitEvent({
    lead_id: lead.id,
    agent: "intake",
    action: `received lead via ${input.source}`,
    input: { contact: input.contact, message: input.message, source: input.source },
    confidence: null,
    decision: "auto_proceed",
    status: "done",
    reason: null,
  });

  await runQualify(lead);
  return { leadId: lead.id };
}

async function runQualify(lead: Lead): Promise<void> {
  if (await halted("qualifier", lead.id)) return;

  // Guardrail first — a malicious/out-of-scope instruction never gets acted on.
  const g = guardrail(lead.raw_message);
  if (g.flagged) {
    await emitEvent({
      lead_id: lead.id,
      agent: "qualifier",
      action: "guardrail caught a malicious / out-of-scope instruction",
      input: { message: lead.raw_message, kind: "guardrail", contact: lead.contact, source: lead.source },
      confidence: 0,
      decision: "blocked",
      status: "awaiting_approval",
      reason: g.reason,
    });
    await updateLead(lead.id, { stage: "blocked" });
    return;
  }

  const policy = await getControl();
  const q = await qualify(lead.raw_message);
  await updateLead(lead.id, { amount: q.amount });
  const auto = q.confidence >= policy.threshold && !q.ambiguous;

  if (!auto) {
    await emitEvent({
      lead_id: lead.id,
      agent: "qualifier",
      action: "escalated low-confidence lead to human",
      input: { message: lead.raw_message, amount: q.amount, summary: q.summary, kind: "low_confidence", contact: lead.contact, source: lead.source, rateLabel: q.rateLabel },
      confidence: q.confidence,
      decision: "escalate",
      status: "awaiting_approval",
      reason: q.ambiguous
        ? "Lead is ambiguous or under-specified, so it was escalated instead of guessed."
        : `Confidence ${q.confidence.toFixed(2)} below the ${policy.threshold.toFixed(2)} threshold you set.`,
    });
    await updateLead(lead.id, { stage: "escalated" });
    return;
  }

  await emitEvent({
    lead_id: lead.id,
    agent: "qualifier",
    action: `qualified: ${q.summary}`,
    input: { message: lead.raw_message, amount: q.amount, summary: q.summary },
    confidence: q.confidence,
    decision: "auto_proceed",
    status: "done",
    reason: null,
  });
  await updateLead(lead.id, { stage: "qualified" });

  await runInvoice(lead, q.amount ?? rate("inquiry").amount, { rateLabel: q.rateLabel, summary: q.summary });
}

interface InvoiceCtx {
  rateLabel?: string;
  summary?: string;
}

async function runInvoice(lead: Lead, amount: number, ctx?: InvoiceCtx): Promise<void> {
  if (await halted("invoicer", lead.id)) return;

  // The "auto-pay small, human-in-the-loop above the cap" rule — using the cap you set.
  const { cap, business } = await getControl();
  const label = ctx?.rateLabel ?? "Job deposit";
  if (amount > cap) {
    await emitEvent({
      lead_id: lead.id,
      agent: "invoicer",
      action: `held £${amount} ${label} for your sign-off`,
      input: { amount, kind: "high_value", contact: lead.contact, message: lead.raw_message, summary: ctx?.summary, rateLabel: ctx?.rateLabel, source: lead.source },
      confidence: null,
      decision: "escalate",
      status: "awaiting_approval",
      reason: `${label} of £${amount} exceeds your £${cap} auto-approval limit, so it is waiting for you.`,
    });
    return;
  }

  const inv = await createInvoice({ amount, ref: lead.id, business: business ?? undefined, itemLabel: ctx?.rateLabel, request: lead.raw_message, customer: lead.contact });
  await emitEvent({
    lead_id: lead.id,
    agent: "invoicer",
    action: `invoiced £${amount} — ${label} (${inv.id})`,
    input: { amount, invoice_id: inv.id, status: inv.status, link: inv.link, mock: inv.mock, contact: lead.contact, message: lead.raw_message, summary: ctx?.summary, rateLabel: ctx?.rateLabel, source: lead.source },
    confidence: null,
    decision: "auto_proceed",
    status: "done",
    reason: null,
  });
  await updateLead(lead.id, { stage: "invoiced" });
}

// Human approves a queued action -> the pipeline resumes from where it paused.
export async function approveEvent(id: string): Promise<void> {
  const ev = await getEvent(id);
  if (!ev || ev.status !== "awaiting_approval") return;
  const inp = (ev.input ?? {}) as {
    kind?: string; amount?: number; contact?: string; message?: string; summary?: string; rateLabel?: string; source?: string;
  };
  const kind = inp.kind;
  const amount = Number(inp.amount ?? rate("inquiry").amount);

  await updateEvent(id, { status: "done", decision: "approved", reason: `Human approved. (${ev.reason ?? ""})` });
  if (!ev.lead_id) return;

  // Resume with the real context captured at escalation time — not a stub.
  const lead = { id: ev.lead_id, raw_message: inp.message ?? "", contact: inp.contact ?? "customer", source: inp.source ?? "form", amount } as Lead;

  if (kind === "low_confidence") {
    await runInvoice(lead, amount, { rateLabel: inp.rateLabel, summary: inp.summary });
  } else if (kind === "high_value") {
    if (await halted("invoicer", lead.id)) return;
    const { business } = await getControl();
    const inv = await createInvoice({ amount, ref: lead.id, business: business ?? undefined, itemLabel: inp.rateLabel, request: inp.message, customer: inp.contact });
    await emitEvent({
      lead_id: lead.id,
      agent: "invoicer",
      action: `invoiced £${amount} — ${inp.rateLabel ?? "deposit"} (${inv.id}), after your approval`,
      input: { amount, invoice_id: inv.id, status: inv.status, link: inv.link, mock: inv.mock, contact: inp.contact, message: inp.message, summary: inp.summary, rateLabel: inp.rateLabel, source: inp.source },
      confidence: null,
      decision: "auto_proceed",
      status: "done",
      reason: null,
    });
    await updateLead(lead.id, { stage: "invoiced" });
  }
  // guardrail blocks: approving just resolves the review; the malicious action is
  // intentionally NEVER executed.
}

export async function rejectEvent(id: string): Promise<void> {
  const ev = await getEvent(id);
  if (!ev || ev.status !== "awaiting_approval") return;
  await updateEvent(id, { status: "done", decision: "rejected", reason: `Human rejected. (${ev.reason ?? ""})` });
  if (ev.lead_id) await updateLead(ev.lead_id, { stage: "blocked" });
}
