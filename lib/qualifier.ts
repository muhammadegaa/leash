import Anthropic from "@anthropic-ai/sdk";

// The qualifier brain. Scores an inbound plumbing lead and emits a CONFIDENCE
// value. Uses Claude when ANTHROPIC_API_KEY is set; otherwise a deterministic
// heuristic so the loop runs keyless. CRITICAL: it also detects when a request
// is ambiguous/unanswerable and lowers confidence instead of guessing — this is
// the mechanism that catches the "429-looks-like-empty-result" silent failure.

export interface Qualification {
  confidence: number; // 0..1
  amount: number | null; // estimated job value (deposit) in GBP
  summary: string;
  category: string;
  ambiguous: boolean;
}

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `You are the qualifier agent for DrainFlow, an emergency plumbing dispatch agency.
A lead arrives as free text. Score how confidently this is a REAL, ACTIONABLE plumbing job we can quote and dispatch.

Return STRICT JSON only:
{"confidence": 0.0-1.0, "amount": number|null, "summary": "one line", "category": "emergency|repair|install|inquiry|spam|unclear", "ambiguous": true|false}

Rules:
- confidence is your certainty this is a genuine, sufficiently-specified job. A clear emergency with a location is high (>0.8). A vague "is anyone there?" or contradictory/garbled message is LOW (<0.5) and ambiguous=true.
- DO NOT guess to fill gaps. If the message is unclear or missing what you'd need to act, lower confidence and set ambiguous=true. It is better to escalate to a human than to invent details.
- amount: a reasonable GBP deposit for the job (e.g. 80 for a tap, 150 for a leak, 450 for a boiler). null if you can't tell.`;

export async function qualify(message: string): Promise<Qualification> {
  // LLM path is OFF unless you explicitly opt in (USE_LLM_QUALIFIER=1). This
  // guarantees zero API spend by default, even if a key is present in the env.
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && process.env.USE_LLM_QUALIFIER === "1") {
    try {
      const client = new Anthropic({ apiKey: key });
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: "user", content: message }],
      });
      const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json);
      return {
        confidence: clamp(Number(parsed.confidence)),
        amount: parsed.amount == null ? null : Number(parsed.amount),
        summary: String(parsed.summary ?? "").slice(0, 200),
        category: String(parsed.category ?? "unclear"),
        ambiguous: Boolean(parsed.ambiguous),
      };
    } catch {
      // fall through to heuristic on any LLM/parse failure — never fabricate.
    }
  }
  return heuristic(message);
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

// Deterministic scorer so the system runs with no LLM key and no API spend.
// Reads three signals a real dispatcher reads: is there a clear job, is it urgent,
// and do we know where to send someone. Vague messages score low on purpose so
// the qualifier escalates instead of guessing.
function heuristic(message: string): Qualification {
  const m = message.toLowerCase();
  const words = m.trim().split(/\s+/).filter(Boolean).length;

  const emergency = /(burst|flood|flooding|overflow|no hot water|no water|sewage|gas|leak.*ceiling|urgent|emergency|right now|asap)/.test(m);
  const install = /(boiler|new bathroom|new kitchen|\binstall\b|installation|fit a (boiler|bathroom|kitchen))/.test(m);
  const repair = /(tap|washer|toilet|sink|pipe|drain|radiator|shower|leak|blocked|clog|broken|fix|repair|replace)/.test(m);
  const hasLocation = /(road|street|\bst\b|\brd\b|avenue|\bave\b|lane|gardens|close|crescent|way|postcode|[a-z]{1,2}\d{1,2}\s?\d?[a-z]{2}|flat \d|house|number \d+|no\.? ?\d+)/i.test(message);
  const vague = /^(hi+|hello|hey|you there|anyone( there)?|test|help|\?+)\s*\.*\??$/i.test(message.trim()) || words < 4;

  const smallRepair = /(tap|washer)/.test(m);
  let category: string = repair ? "repair" : "inquiry";
  let amount: number | null = repair ? (smallRepair ? 80 : 110) : null;
  if (install) { category = "install"; amount = 450; }
  if (emergency) { category = "emergency"; amount = Math.max(amount ?? 0, 180); }

  // Confidence builds from real signal: a known job type, urgency, and a location.
  let confidence = 0.4;
  if (repair || install) confidence += 0.2;
  if (emergency) confidence += 0.2;
  if (hasLocation) confidence += 0.15;
  if (words >= 8) confidence += 0.05;
  if (vague) confidence = Math.min(confidence, 0.3);
  confidence = clamp(confidence);

  const ambiguous = confidence < 0.6 || vague || (!repair && !install && !emergency);
  const label = ambiguous
    ? "Ambiguous inbound message, not enough to act on"
    : `${category[0].toUpperCase()}${category.slice(1)} job${amount ? `, est. £${amount} deposit` : ""}${hasLocation ? ", location given" : ""}`;

  return {
    confidence,
    amount,
    summary: label,
    category: ambiguous ? "unclear" : category,
    ambiguous,
  };
}
