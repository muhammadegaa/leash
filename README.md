# Leash

**Governance and the off switch for autonomous agents.** Full-autonomy speed with a
layer that makes it trustable: every action logged, low-confidence work escalated to
a human, malicious instructions caught in code, and a system-level kill switch.

The demo business is **DrainFlow**, an autonomous plumbing-lead agency built from
three shallow agents. The actual product is the layer underneath: any agent can emit
to Leash and inherit the same oversight.

## The one architectural decision
Every agent action is one append-only row in an event store:

```
{ id, agent, action, input, confidence, decision, status, reason, lead_id, created_at }
```

The dashboard is a live view of that stream. Shallow agents, visible seams, a real
audit trail.

## The three agents
- **Intake** receives a lead (WhatsApp via Wassist, the on-stage form, or the simulator).
- **Qualifier** scores the lead and emits a confidence value. High confidence
  proceeds automatically, low confidence escalates to the approval queue. It does not
  guess, so ambiguous leads escalate instead of being invented. Runs on a free local
  scorer by default (no API key, no spend); set `USE_LLM_QUALIFIER=1` to use Claude.
- **Invoicer** raises a PayPal sandbox invoice. Anything over £250 needs a human.

## The oversight layer (the headline)
- **Live decision feed** with per-action confidence.
- **Approval queue** for low-confidence and high-value actions.
- **Kill switch** enforced in code: every agent reads `control.paused` before acting
  and refuses if it is on. Not a prompt the agent can ignore.
- **Guardrail** that routes malicious or out-of-scope instructions to the queue.
- **Cognitive load counter**: handled autonomously vs needed you. The system protects
  human attention by only interrupting for the uncertain cases.

## Run it
```bash
cp .env.local.example .env.local   # fill what you have; it runs with nothing set
npm install
npm run dev                        # http://localhost:3000
```

With no credentials it uses an in-memory store and a heuristic qualifier, so the full
loop still runs. Each key upgrades one path:
- Supabase: persistent event store + realtime dashboard.
- PayPal sandbox: real invoices.
- Anthropic (optional, opt-in): swaps the free scorer for a Claude qualifier.
- Wassist: live WhatsApp intake.
- Modal: the unattended runner (`modal_app.py`).

## Supabase setup
Run `supabase/schema.sql` in the SQL editor, then set the three `SUPABASE_*` /
`NEXT_PUBLIC_SUPABASE_*` vars. The dashboard reads from the same tables the agents
write to.

## Governance as a service
Any external agent can ask Leash for permission before acting:

```bash
curl -X POST $HANDOFF_URL/api/ingest -H 'Content-Type: application/json' \
  -d '{"agent":"my-bot","action":"charge customer 4000","confidence":0.4}'
# -> { "allow": false, "status": "awaiting_approval", "decision": "escalate" }
```

Kill switch, guardrail, and confidence threshold all apply. This is the wedge: every
other agent at the hackathon is a potential user.
